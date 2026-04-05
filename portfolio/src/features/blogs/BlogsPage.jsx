import React, { useEffect, useState, useCallback } from "react";
import { useHistory } from 'react-router-dom';
import BlogCard from './components/BlogCard';
import Navbar from '../../Components/NavbarSection/NavbarSection';
import Loader from '../../Components/Loader';
import Footer from '../../Components/FooterSection/Footer';
import './BlogsPage.css';

const BlogsContent = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/dashboard/overview', { credentials: 'include' });
        if (res.ok) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          localStorage.removeItem('adminEmail');
        }
      } catch (err) {
        setIsAdmin(false);
        localStorage.removeItem('adminEmail');
      }
    };
    verifyAdmin();
  }, []);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const categories = Array.from(new Set(blogs.map(b => b.category).filter(Boolean)));
  const handleCategorySelect = (cat) => {
    setSelectedCategory(prev => prev === cat ? null : cat);
  };

  const [sortOption, setSortOption] = useState('date-desc');
  const sortBlogs = (list) => {
    const sorted = [...list];
    switch (sortOption) {
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'title-asc':
        sorted.sort((a, b) => (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase()));
        break;
      case 'title-desc':
        sorted.sort((a, b) => (b.title || '').toLowerCase().localeCompare((a.title || '').toLowerCase()));
        break;
      default:
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    return sorted;
  };

  const handleEditNavigate = (id) => {
    history.push(`/dashboard/blogs?edit=${id}`);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      alert('You must be an admin to delete posts.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this blog?')) return;

    try {
      const res = await fetch(`http://localhost:4000/api/blogs/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setBlogs(prev => prev.filter(b => b._id !== id));
      } else if (res.status === 401) {
        alert('Unauthorized. Please sign in to the dashboard.');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to delete blog');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting blog');
    }
  };

  const fetchBlogs = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:4000/api/blogs');
      const data = await res.json();
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBlogs(data);
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="blogs-section-container">
      <div className="data-container">
        <div className="container-title">
          <hr />
          <h1>Blogs</h1>
          <hr />
        </div>

        <div className="filter-bar">
          <button 
            type="button" 
            className={`filter-btn ${!selectedCategory ? 'active' : ''}`} 
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map(c => (
            <button 
              key={c} 
              className={`filter-btn ${selectedCategory === c ? 'active' : ''}`} 
              onClick={() => handleCategorySelect(c)}
            >
              {c}
            </button>
          ))}
          <div className="sort-controls">
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
            </select>
          </div>
        </div>

        {blogs.length > 0 ? (
          <div className="blogs-cards-row">
            {sortBlogs(blogs.filter(b => !selectedCategory || b.category === selectedCategory)).map(blog => (
              <BlogCard
                key={blog._id}
                blog={blog}
                onEdit={handleEditNavigate}
                onDelete={() => handleDelete(blog._id)}
                onUpdate={(updated) => setBlogs(prev => prev.map(b => b._id === updated._id ? updated : b))}
                onCategoryClick={handleCategorySelect}
                isHighlighted={selectedCategory === blog.category}
              />
            ))}
          </div>
        ) : (
          <p>No blogs available yet.</p>
        )}
      </div>
    </div>
  );
};

export default function BlogsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Blogs | VenomTech";
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="blogs-page page-shell">
      <Navbar />
      <BlogsContent />
      <Footer />
    </div>
  );
}

