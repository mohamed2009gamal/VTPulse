// backend/src/controllers/blogsController.js
const Blog = require('../../models/Blog');
const BlogVote = require('../../models/BlogVote');
const path = require('path');

// Transform blog for response
const transformBlogForResponse = (blogDoc) => {
  const blog = blogDoc.toObject ? blogDoc.toObject() : blogDoc;
  // normalize paths...
  return blog;
};

// GET all blogs
const getAllBlogs = async (req, res) => {
  try {
    const { archived } = req.query;
    const query = archived === 'true' ? { isArchived: true } : { isArchived: false };
    const allBlogs = await Blog.find(query);
    const blogs = (Array.isArray(allBlogs) ? allBlogs : [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(blogs.map(transformBlogForResponse));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single blog
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(transformBlogForResponse(blog));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST new blog (expects multer middleware first)
const createBlog = async (req, res) => {
  try {
    const createBlogData = {
      title: req.body.title,
      content: req.body.content,
      images: req.files?.images?.map(f => f.filename) || [],
      videos: req.files?.videos?.map(f => f.filename) || [],
      website: req.body.website,
      date: req.body.date || new Date(),
      publisher: {
        name: req.body.publisherName || 'Admin',
        avatar: req.files?.avatar ? req.files.avatar[0].filename : null
      }
    };
    const blog = await Blog.create(createBlogData);
    res.status(201).json(transformBlogForResponse(blog));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Add more controllers...

module.exports = {
  getAllBlogs,
  getBlogById,
  createBlog
  // ...
};

