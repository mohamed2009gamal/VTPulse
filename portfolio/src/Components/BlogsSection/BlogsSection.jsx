import React, { useEffect, useState, useRef } from "react";
import { useHistory } from 'react-router-dom';
import SortMenu from '../SortMenu';
import styled from 'styled-components';

// components
import Header from "../NavbarSection/NavbarSection";
import Cookies from "../CookiesSection/CookiesSection";
import AIChat from "../AIbotSection/AIbotSection";
import BackToTopButton from "../BackToTopButtonSection/BackToTopButtonSection";
import Footer from "../FooterSection/Footer";
import Loader from "../Loader/Loader";
import BlogCard from "./BlogCard";

// styles
import "./Style.css";

const BlogsContent = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  // a ref in case we want to scroll or measure the container later
  const containerRef = useRef(null);

  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem('adminEmail'));
  const [adminEmail, setAdminEmail] = useState(localStorage.getItem('adminEmail') || null);

  // Verify server-side dashboard session (keeps client state in sync)
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/dashboard/overview', { credentials: 'include' });
        if (res.ok) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          setAdminEmail(null);
          localStorage.removeItem('adminEmail');
        }
      } catch (err) {
        setIsAdmin(false);
        setAdminEmail(null);
        localStorage.removeItem('adminEmail');
      }
    };
    verifyAdmin();
  }, []);

  // Category filtering state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const categories = Array.from(new Set(blogs.map(b => b.category).filter(Boolean)));
  const handleCategorySelect = (cat) => {
    setSelectedCategory(prev => prev === cat ? null : cat);
  };

  // sorting state
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
        break;
    }
    return sorted;
  };

  const handleEditNavigate = (id) => {
    // Navigate admin to dashboard to edit the post
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

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/blogs');
        const data = await res.json();
        // Sort newest first
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBlogs(data);
      } catch (err) {
        console.error('Error fetching blogs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <Container className="blogs-section-container" ref={containerRef}>
      <div className="data-container">
        <div className="container-title" >
          <hr />
          <h1>
            <span color="blue">
              Blogs
            </span>
          </h1>
          <hr />
        </div>


        <div className="filter-bar" role="toolbar" aria-label="Blog category filters and sorting">
          <button type="button" className={`filter-btn ${!selectedCategory ? 'active' : ''}`} onClick={() => setSelectedCategory(null)}>All</button>
          {categories.map(c => (
            <button type="button" key={c} className={`filter-btn ${selectedCategory === c ? 'active' : ''}`} onClick={() => handleCategorySelect(c)}>{c}</button>
          ))}

          <div role="group" aria-label="Sort order" className="sort-controls">
            <span className="visually-hidden">Sort order</span>
            <SortMenu current={sortOption} onChange={setSortOption} />
          </div>
        </div>

        {blogs.length > 0 ? (
          <div className="blogs-cards-row">
            {sortBlogs(
              blogs.filter(b => !selectedCategory || b.category === selectedCategory)
            ).map(blog => (
                <BlogCard
                  key={blog._id}
                  blog={blog}
                  // Public page: do NOT provide management controls
                  onEdit={null}
                  onDelete={null}
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
    </Container>
  );
};

export { BlogsContent };

// styled wrapper used by BlogsContent so "styled" is defined and
// ESLint won't complain about an unused import.
const Container = styled.div`
  /* additional styling could go here but most of the rules are in Style.css */
`;

export default function Blogs() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Blogs | VENOMTECH";

    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Loader screen
  if (loading) {
    return <Loader />;
  }

  // Page content
  return (
    <div className="App">
      <Header />
      <BlogsContent />
      <Cookies />
      <AIChat />
      <BackToTopButton />
      <Footer />
    </div>
  );
}
