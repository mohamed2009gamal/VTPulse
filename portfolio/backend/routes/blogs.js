const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const BlogVote = require('../models/BlogVote');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

// Simple request logger for debugging (also write to file)
const fs = require('fs');
router.use((req, res, next) => {
  const msg = `[blogs] ${req.method} ${req.originalUrl} from ${req.ip}`;
  console.log(msg);
  try {
    fs.appendFileSync('blogs.log', msg + '\n');
  } catch (_) {}
  next();
});


const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'avatar' && !file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed for avatar'));
    } else if ((file.fieldname === 'images' || file.fieldname === 'videos') && !file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
      cb(new Error('Only image and video files are allowed for media'));
    } else {
      cb(null, true);
    }
  }
});

// Debug-only upload endpoint (no auth) to reproduce upload-related errors
if (process.env.NODE_ENV !== 'production') {
  router.post('/debug-upload', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 10 }, { name: 'avatar', maxCount: 1 }]), (req, res) => {
    try {
      console.log('DEBUG UPLOAD req.body:', req.body);
      console.log('DEBUG UPLOAD files:', Object.keys(req.files || {}).reduce((acc, k) => ({ ...acc, [k]: (req.files[k] || []).map(f => f.filename) }), {}));
      res.json({ ok: true, body: req.body, files: req.files });
    } catch (err) {
      console.error('DEBUG UPLOAD error', err);
      res.status(500).json({ error: err && err.message ? err.message : 'Upload error' });
    }
  });
}

// after route definitions, log available routes for debugging
const listRoutes = () => {
  const routes = [];
  router.stack.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(',');
      routes.push(`${methods.toUpperCase()} ${layer.route.path}`);
    }
  });
  console.log('BLOGS ROUTES:', routes);
};
// call once now (will show routes as they exist at file load time)
listRoutes();

// Helper to normalize file paths for responses
const normalizePath = (p) => {
  if (!p) return p;
  if (p.startsWith('/')) return p.startsWith('/uploads') ? p : `/uploads${p}`;
  return `/uploads/${p}`;
};

// Convert blog doc to a plain object and normalize media paths
const transformBlogForResponse = (blogDoc) => {
  const blog = blogDoc.toObject ? blogDoc.toObject() : blogDoc;
  if (blog.images && Array.isArray(blog.images)) {
    blog.images = blog.images.map(i => normalizePath(i));
  }
  if (blog.videos && Array.isArray(blog.videos)) {
    blog.videos = blog.videos.map(v => normalizePath(v));
  }
  if (blog.publisher && blog.publisher.avatar) {
    blog.publisher.avatar = normalizePath(blog.publisher.avatar);
  }
  return blog;
};

// Temporary bypass route for debugging upload without auth
// (not exposed in production)
if (process.env.NODE_ENV !== 'production') {
  router.post('/force-post', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 10 }, { name: 'avatar', maxCount: 1 }]), async (req, res) => {
    try {
      const { title, content, website, date, publisherName } = req.body;
      const images = req.files.images ? req.files.images.map(f => f.filename) : [];
      const videos = req.files.videos ? req.files.videos.map(f => f.filename) : [];
      const avatar = req.files.avatar ? req.files.avatar[0].filename : null;
      res.status(201).json({ title, content, website, date, publisherName, images, videos, avatar });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
}

// GET all blogs
router.get('/', async (req, res) => {
  try {
    const { archived } = req.query;
    const query = archived === 'true' ? { isArchived: true } : { isArchived: false };
    const allBlogs = await Blog.find(query);
    const blogs = (Array.isArray(allBlogs) ? allBlogs : [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const transformed = blogs.map(transformBlogForResponse);
    res.json(transformed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single blog
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(transformBlogForResponse(blog));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current visitor's vote for a blog (returns { vote: 1 | -1 | 0 })
router.get('/:id/vote', async (req, res) => {
  try {
    const voterId = getOrSetVoterId(req, res);
    const blogId = mongoose.Types.ObjectId(req.params.id);
    const voteDoc = await BlogVote.findOne({ blog: blogId, voterId });
    const vote = voteDoc ? voteDoc.vote : 0;
    res.json({ vote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Increment view count (no auth required)
router.post('/:id/view', async (req, res) => {
  try {
    // Ensure voterId cookie exists so future votes are tied to this visitor
    const voterId = getOrSetVoterId(req, res);
    console.log(`VIEW: blog=${req.params.id} voter=${voterId}`);

    const blog = await Blog.findByIdAndUpdate(req.params.id, { $inc: { views: 1, reads: 1 } }, { new: true });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(transformBlogForResponse(blog));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vote protection using voterId cookie and BlogVote model

// Helper to ensure voterId cookie exists
const getOrSetVoterId = (req, res) => {
  let voterId = req.cookies && req.cookies.voterId;
  if (!voterId) {
    voterId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    res.cookie('voterId', voterId, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 365 });
  }
  return voterId;
};

// Increment like (with per-voter protection)
router.post('/:id/like', async (req, res) => {
  try {
    const voterId = getOrSetVoterId(req, res);
    const blogId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ error: 'Invalid blog ID' });
    }

    const blogIdObj = mongoose.Types.ObjectId(blogId);

    console.log(`LIKE: blog=${blogId} voter=${voterId}`);

    const existing = await BlogVote.findOne({ blog: blogIdObj, voterId });

    if (existing && existing.vote === 1) {
      return res.status(400).json({ error: 'You already liked this post' });
    }

    // new like
    await BlogVote.create({ blog: blogIdObj, voterId, vote: 1 });
    const blog = await Blog.findByIdAndUpdate(blogId, { $inc: { likes: 1 } }, { new: true });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    console.log(`LIKE: recorded like for blog=${blogId} voter=${voterId}`);
    res.json(transformBlogForResponse(blog));
  } catch (err) {
    console.error('LIKE error', err);
    res.status(500).json({ error: err.message });
  }
});



// Remove a vote (unvote) - allows toggling a previous like/dislike
router.delete('/:id/vote', async (req, res) => {
  try {
    const voterId = getOrSetVoterId(req, res);
    const blogId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ error: 'Invalid blog ID' });
    }

    console.log(`UNVOTE: blog=${blogId} voter=${voterId}`);

    const existing = await BlogVote.findOneAndDelete({ blog: blogId, voterId });
    if (!existing) {
      // nothing to remove - return current blog state
      const blog = await Blog.findById(blogId);
      if (!blog) return res.status(404).json({ error: 'Blog not found' });
      return res.json(transformBlogForResponse(blog));
    }

    // decrement counts accordingly
    if (existing.vote === 1) {
      await Blog.findByIdAndUpdate(blogId, { $inc: { likes: -1 } });
      console.log(`UNVOTE: removed like for blog=${blogId} voter=${voterId}`);
    }
    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(transformBlogForResponse(blog));
  } catch (err) {
    console.error('UNVOTE error', err);
    res.status(500).json({ error: err.message });
  }
});

// helper wrapper to debug upload behavior for blog posting
const blogUploadMiddleware = (req, res, next) => {
  const msg = `blogUploadMiddleware: entered for ${req.originalUrl}`;
  console.log(msg);
  try { fs.appendFileSync('blogs.log', msg + '\n'); } catch(_){}

  const handler = upload.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 10 }, { name: 'avatar', maxCount: 1 }]);
  try {
    handler(req, res, (err) => {
      if (err) {
        const emsg = `blogUploadMiddleware: multer error ${err}`;
        console.error(emsg, err);
        try { fs.appendFileSync('blogs.log', emsg + '\n' + (err.stack||err) + '\n'); } catch(_){}
        return next(err);
      }
      const doneMsg = 'blogUploadMiddleware: multer finished without error';
      console.log(doneMsg);
      try { fs.appendFileSync('blogs.log', doneMsg + '\n'); } catch(_){}
      next();
    });
  } catch (err) {
    const emsg = `blogUploadMiddleware: synchronous exception ${err}`;
    console.error(emsg, err);
    try { fs.appendFileSync('blogs.log', emsg + '\n' + (err.stack||err) + '\n'); } catch(_){}
    next(err);
  }
};

// POST a new blog
router.post('/', adminAuth, blogUploadMiddleware, async (req, res) => {
  console.log('POST route called, req.body:', req.body, 'req.files:', req.files);
  try {
    // avoid destructuring to prevent a malicious `next` field from being pulled
    const title = req.body.title;
    const content = req.body.content;
    const website = req.body.website;
    const date = req.body.date;
    const publisherName = req.body.publisherName;

    const images = req.files && req.files.images ? req.files.images.map(file => file.filename) : [];
    const videos = req.files && req.files.videos ? req.files.videos.map(file => file.filename) : [];
    const avatar = req.files && req.files.avatar ? req.files.avatar[0].filename : null;

    console.log('POST /api/blogs files:', Object.keys(req.files || {}).reduce((acc, k) => ({ ...acc, [k]: (req.files[k] || []).map(f => f.filename) }), {}));

    const blog = await Blog.create({
      title,
      content,
      images,
      videos,
      website,
      date: date || new Date(),
      publisher: {
        name: publisherName || 'Admin',
        avatar: avatar
      }
    });

    res.status(201).json(transformBlogForResponse(blog));
  } catch (err) {
    console.error('POST handler error stack:', err && err.stack ? err.stack : err);
    res.status(400).json({ error: err.message });
  }
});

// PUT update a blog
router.put('/:id', adminAuth, (req, res, next) => {
  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'avatar' && !file.mimetype.startsWith('image/')) {
        cb(new Error('Only image files are allowed for avatar'));
      } else if ((file.fieldname === 'images' || file.fieldname === 'videos') && !file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
        cb(new Error('Only image and video files are allowed for media'));
      } else {
        cb(null, true);
      }
    }
  }).fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 10 }, { name: 'avatar', maxCount: 1 }]);

  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { title, content, website, date, publisherName } = req.body;

    const images = req.files.images ? req.files.images.map(file => file.filename) : [];
    const videos = req.files.videos ? req.files.videos.map(file => file.filename) : [];
    const avatar = req.files.avatar ? req.files.avatar[0].filename : null;

    console.log('PUT /api/blogs files:', Object.keys(req.files || {}).reduce((acc, k) => ({ ...acc, [k]: (req.files[k] || []).map(f => f.filename) }), {}));

    const updateData = {
      title,
      content,
      website,
      date: date || new Date(),
      updatedAt: new Date()
    };

    if (images.length > 0) updateData.images = images;
    if (videos.length > 0) updateData.videos = videos;
    if (avatar) updateData.publisher = { name: publisherName || 'Admin', avatar };

    const blog = await Blog.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json(transformBlogForResponse(blog));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a blog (archive instead of hard delete)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, { isArchived: true, archivedAt: new Date() }, { new: true });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json({ message: 'Blog archived' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics totals endpoint (exclude archived blogs)
router.get('/analytics/totals', async (req, res) => {
  try {
    const agg = await Blog.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: null, views: { $sum: '$views' }, likes: { $sum: '$likes' } } }
    ]);
    const totals = (agg && agg[0]) ? { views: agg[0].views || 0, likes: agg[0].likes || 0 } : { views: 0, likes: 0 };
    res.json(totals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export CSV of blog analytics (exclude archived by default)
router.get('/analytics/export/csv', async (req, res) => {
  try {
    const query = req.query.includeArchived === 'true' ? {} : { isArchived: false };
    const allBlogs = await Blog.find(query);
    const blogs = (Array.isArray(allBlogs) ? allBlogs : [])
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="blogs-analytics.csv"');

    res.write('id,title,date,views,likes\n');
    blogs.forEach(b => {
      const row = `${b._id},"${(b.title || '').replace(/"/g, '""')}",${b.date.toISOString()},${b.views || 0},${b.likes || 0}\n`;
      res.write(row);
    });
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore a blog from archive
router.put('/:id/restore', adminAuth, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, { isArchived: false, archivedAt: null }, { new: true });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json({ message: 'Blog restored', blog: transformBlogForResponse(blog) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all for undefined /api/blogs routes — return JSON 404 instead of serving index.html
router.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Log available routes after all routes are defined
setImmediate(() => {
  listRoutes();
});

module.exports = router;
