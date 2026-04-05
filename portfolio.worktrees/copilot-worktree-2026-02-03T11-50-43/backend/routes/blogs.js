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

// Simple request logger for debugging
router.use((req, res, next) => {
  console.log(`[blogs] ${req.method} ${req.originalUrl} from ${req.ip}`);
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

// GET all blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
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
    const blogId = req.params.id;
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

    const blog = await Blog.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
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

    console.log(`LIKE: blog=${blogId} voter=${voterId}`);

    const existing = await BlogVote.findOne({ blog: blogId, voterId });

    if (existing && existing.vote === 1) {
      return res.status(400).json({ error: 'You already liked this post' });
    }

    if (existing && existing.vote === -1) {
      // change dislike -> like
      existing.vote = 1;
      await existing.save();
      const blog = await Blog.findByIdAndUpdate(blogId, { $inc: { likes: 1, dislikes: -1 } }, { new: true });
      console.log(`LIKE: switched dislike->like for blog=${blogId} voter=${voterId}`);
      return res.json(transformBlogForResponse(blog));
    }

    // new like
    await BlogVote.create({ blog: blogId, voterId, vote: 1 });
    const blog = await Blog.findByIdAndUpdate(blogId, { $inc: { likes: 1 } }, { new: true });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    console.log(`LIKE: recorded like for blog=${blogId} voter=${voterId}`);
    res.json(transformBlogForResponse(blog));
  } catch (err) {
    console.error('LIKE error', err);
    res.status(500).json({ error: err.message });
  }
});

// Increment dislike (with per-voter protection)
router.post('/:id/dislike', async (req, res) => {
  try {
    const voterId = getOrSetVoterId(req, res);
    const blogId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ error: 'Invalid blog ID' });
    }

    console.log(`DISLIKE: blog=${blogId} voter=${voterId}`);

    const existing = await BlogVote.findOne({ blog: blogId, voterId });

    if (existing && existing.vote === -1) {
      return res.status(400).json({ error: 'You already disliked this post' });
    }

    if (existing && existing.vote === 1) {
      // change like -> dislike
      existing.vote = -1;
      await existing.save();
      const blog = await Blog.findByIdAndUpdate(blogId, { $inc: { likes: -1, dislikes: 1 } }, { new: true });
      console.log(`DISLIKE: switched like->dislike for blog=${blogId} voter=${voterId}`);
      return res.json(transformBlogForResponse(blog));
    }

    // new dislike
    await BlogVote.create({ blog: blogId, voterId, vote: -1 });
    const blog = await Blog.findByIdAndUpdate(blogId, { $inc: { dislikes: 1 } }, { new: true });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    console.log(`DISLIKE: recorded dislike for blog=${blogId} voter=${voterId}`);
    res.json(transformBlogForResponse(blog));
  } catch (err) {
    console.error('DISLIKE error', err);
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

    const existing = await BlogVote.findOne({ blog: blogId, voterId });
    if (!existing) {
      // nothing to remove - return current blog state
      const blog = await Blog.findById(blogId);
      if (!blog) return res.status(404).json({ error: 'Blog not found' });
      return res.json(transformBlogForResponse(blog));
    }

    // decrement counts accordingly and remove the vote record
    if (existing.vote === 1) {
      await Blog.findByIdAndUpdate(blogId, { $inc: { likes: -1 } });
      console.log(`UNVOTE: removed like for blog=${blogId} voter=${voterId}`);
    } else if (existing.vote === -1) {
      await Blog.findByIdAndUpdate(blogId, { $inc: { dislikes: -1 } });
      console.log(`UNVOTE: removed dislike for blog=${blogId} voter=${voterId}`);
    }

    await existing.remove();
    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(transformBlogForResponse(blog));
  } catch (err) {
    console.error('UNVOTE error', err);
    res.status(500).json({ error: err.message });
  }
});

// POST a new blog
router.post('/', adminAuth, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 10 }, { name: 'avatar', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, content, website, date, publisherName } = req.body;

    const images = req.files.images ? req.files.images.map(file => file.filename) : [];
    const videos = req.files.videos ? req.files.videos.map(file => file.filename) : [];
    const avatar = req.files.avatar ? req.files.avatar[0].filename : null;

    console.log('POST /api/blogs files:', Object.keys(req.files || {}).reduce((acc, k) => ({ ...acc, [k]: (req.files[k] || []).map(f => f.filename) }), {}));

    const blog = new Blog({
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

    await blog.save();
    res.status(201).json(transformBlogForResponse(blog));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update a blog
router.put('/:id', adminAuth, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 10 }, { name: 'avatar', maxCount: 1 }]), async (req, res) => {
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

// DELETE a blog
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics totals endpoint
router.get('/analytics/totals', async (req, res) => {
  try {
    const agg = await Blog.aggregate([
      { $group: { _id: null, views: { $sum: '$views' }, likes: { $sum: '$likes' }, dislikes: { $sum: '$dislikes' } } }
    ]);
    const totals = (agg && agg[0]) ? { views: agg[0].views || 0, likes: agg[0].likes || 0, dislikes: agg[0].dislikes || 0 } : { views: 0, likes: 0, dislikes: 0 };
    res.json(totals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export CSV of blog analytics
router.get('/analytics/export/csv', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ date: -1 }).select('title views likes dislikes date');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="blogs-analytics.csv"');

    res.write('id,title,date,views,likes,dislikes\n');
    blogs.forEach(b => {
      const row = `${b._id},"${(b.title || '').replace(/"/g, '""')}",${b.date.toISOString()},${b.views || 0},${b.likes || 0},${b.dislikes || 0}\n`;
      res.write(row);
    });
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all for undefined /api/blogs routes — return JSON 404 instead of serving index.html
router.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = router;
