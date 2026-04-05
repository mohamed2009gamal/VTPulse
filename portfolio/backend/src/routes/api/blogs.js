// backend/src/routes/api/blogs.js - Thin router
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const adminAuth = require('../../../middleware/adminAuth');
const { getAllBlogs, getBlogById, createBlog } = require('../../controllers/blogsController');

// Multer config
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/', getAllBlogs);
router.get('/:id', getBlogById);
router.post('/', adminAuth, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 10 },
  { name: 'avatar', maxCount: 1 }
]), createBlog);

module.exports = router;

