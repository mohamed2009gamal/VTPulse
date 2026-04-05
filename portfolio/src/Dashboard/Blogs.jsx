import React, { useCallback, useState, useEffect } from 'react';
import SortMenu from '../Components/SortMenu';
import '../Components/BlogsSection/Style.css';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import BlogCard from '../Components/BlogsSection/BlogCard';
import { apiCall } from '../services/api';
import { formatNumber, formatRelativeTime } from './dashboardUtils';

export default function Blogs() {
  const { currentTheme } = useTheme();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);

  // sorting state for dashboard list
  const [sortOption, setSortOption] = useState('date-desc');
  const sortBlogs = (list) => {
    const sorted = [...list];
    switch (sortOption) {
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'title-asc':
        sorted.sort((a, b) => (a.title||'').toLowerCase().localeCompare((b.title||'').toLowerCase()));
        break;
      case 'title-desc':
        sorted.sort((a, b) => (b.title||'').toLowerCase().localeCompare((a.title||'').toLowerCase()));
        break;
      default:
        break;
    }
    return sorted;
  };
  const [totals, setTotals] = useState({ views: 0, likes: 0, dislikes: 0, blogs: 0 });
  const location = useLocation();

  const fetchBlogs = useCallback(async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      }
      const data = await apiCall('/blogs');
      // Filter out archived blogs
      const activeBlogs = data.filter(blog => !blog.isArchived);
      // Sort newest first
      activeBlogs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setBlogs(activeBlogs);

      // compute totals for quick analytics (only active blogs)
      const totals = activeBlogs.reduce((acc, b) => {
        acc.views += b.views || 0;
        acc.likes += b.likes || 0;
        acc.dislikes += b.dislikes || 0;
        return acc;
      }, { views: 0, likes: 0, dislikes: 0, blogs: activeBlogs.length });
      setTotals(totals);

      // support opening editor via ?edit=<id>
      try {
        const params = new URLSearchParams(location.search);
        const editId = params.get('edit');
        if (editId) {
          const found = data.find(b => b._id === editId && !b.isArchived);
          if (found) {
            setEditingBlog(found);
            // remove the query param so we don't re-open every refresh
            window.history.replaceState(null, '', '/dashboard/blogs');
          }
        }
      } catch (err) {
        // ignore param parsing errors
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location.search]);

  useEffect(() => {
    fetchBlogs(false);
    const interval = window.setInterval(() => {
      fetchBlogs(true);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [fetchBlogs]);


  const [deletingId, setDeletingId] = useState(null);

  const showDeleteModal = (id) => setDeletingId(id);

  const cancelDelete = () => setDeletingId(null);

  const confirmDelete = async () => {
    const id = deletingId;
    setDeletingId(null);
    try {
      const res = await fetch(`http://localhost:4000/api/blogs/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        await fetchBlogs(true);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to delete blog');
      }
    } catch (err) {
      console.error('Error deleting blog:', err);
      alert('Error deleting blog');
    }
  };

  

  const handleEdit = (blog) => {
    setEditingBlog(blog);
  };

  // Called by BlogCard when a blog is updated (likes/dislikes/views)
  const handleCardUpdate = (updated) => {
    setBlogs(prev => {
      const newBlogs = prev.map(b => b._id === updated._id ? updated : b);
      // recompute totals
      const totals = newBlogs.reduce((acc, b) => {
        acc.views += b.views || 0;
        acc.likes += b.likes || 0;
        acc.dislikes += b.dislikes || 0;
        return acc;
      }, { views: 0, likes: 0, dislikes: 0, blogs: newBlogs.length });
      setTotals(totals);
      return newBlogs;
    });
  };

  const handleUpdate = async (updatedBlog) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', updatedBlog.title);
      formDataToSend.append('content', updatedBlog.content);
      formDataToSend.append('website', updatedBlog.website);
      formDataToSend.append('date', updatedBlog.date);
      formDataToSend.append('publisherName', updatedBlog.publisherName);

      // Append images and videos as files if new ones are selected
      if (updatedBlog.selectedImages) {
        updatedBlog.selectedImages.forEach((file) => {
          formDataToSend.append('images', file);
        });
      }
      if (updatedBlog.selectedVideos) {
        updatedBlog.selectedVideos.forEach((file) => {
          formDataToSend.append('videos', file);
        });
      }
      if (updatedBlog.selectedAvatar) {
        formDataToSend.append('avatar', updatedBlog.selectedAvatar);
      }

      const res = await fetch(`http://localhost:4000/api/blogs/${editingBlog._id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formDataToSend
      });

      if (res.ok) {
        fetchBlogs(true); // Refresh the blogs list
        setEditingBlog(null);
      } else {
        const error = await res.json();
        console.error('Failed to update blog:', error);
      }
    } catch (err) {
      console.error('Error updating blog:', err);
    }
  };

  const EditForm = ({ blog, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      title: blog.title || '',
      content: blog.content || '',
      images: blog.images || [],
      videos: blog.videos || [],
      website: blog.website || '',
      date: blog.date ? new Date(blog.date).toISOString().split('T')[0] : '',
      publisherName: blog.publisher ? blog.publisher.name : '',
      publisherAvatar: blog.publisher ? blog.publisher.avatar : null
    });
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(blog.publisher ? blog.publisher.avatar : null);
    const [loadingForm, setLoadingForm] = useState(false);
    const [message, setMessage] = useState('');

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleFileUpload = (type) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = type === 'images' ? 'image/*' : 'video/*';
      input.onchange = (e) => {
        const files = Array.from(e.target.files);
        const urls = files.map(file => URL.createObjectURL(file));
        if (type === 'images') {
          setSelectedImages(prev => [...prev, ...files]);
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...urls]
          }));
        } else {
          setSelectedVideos(prev => [...prev, ...files]);
          setFormData(prev => ({
            ...prev,
            videos: [...prev.videos, ...urls]
          }));
        }
      };
      input.click();
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoadingForm(true);
      setMessage('');

      try {
        const updatedBlog = {
          ...formData,
          selectedImages,
          selectedVideos,
          selectedAvatar
        };
        await onSave(updatedBlog);
        setMessage('Blog updated successfully!');
        onCancel(); // Close the modal after successful update
      } catch (err) {
        setMessage('Error updating blog');
      } finally {
        setLoadingForm(false);
      }
    };

    const removeMedia = (type, index) => {
      setFormData(prev => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      }));
      if (type === 'images') {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
      } else {
        setSelectedVideos(prev => prev.filter((_, i) => i !== index));
      }
    };

    return (
      <form onSubmit={handleSubmit} style={{
        backgroundColor: currentTheme.cardBg,
        padding: '20px',
        borderRadius: '10px',
        border: `1px solid ${currentTheme.sidebarBorder}`,
        color: currentTheme.color
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: currentTheme.textSecondary }}>
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter title"
            required
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: currentTheme.inputBg,
              border: `1px solid ${currentTheme.inputBorder}`,
              borderRadius: '5px',
              color: currentTheme.color,
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: currentTheme.textSecondary }}>
            Content
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Enter your content"
            rows={5}
            required
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: currentTheme.inputBg,
              border: `1px solid ${currentTheme.inputBorder}`,
              borderRadius: '5px',
              color: currentTheme.color,
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: currentTheme.textSecondary }}>
            Website (optional)
          </label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="https://example.com"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: currentTheme.inputBg,
              border: `1px solid ${currentTheme.inputBorder}`,
              borderRadius: '5px',
              color: currentTheme.color,
              fontSize: '14px'
            }}
          />
        </div>

        

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: currentTheme.textSecondary }}>
            Publisher Name
          </label>
          <input
            type="text"
            name="publisherName"
            value={formData.publisherName}
            onChange={handleInputChange}
            placeholder="Enter publisher name"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: currentTheme.inputBg,
              border: `1px solid ${currentTheme.inputBorder}`,
              borderRadius: '5px',
              color: currentTheme.color,
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: currentTheme.textSecondary }}>
            Media
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleFileUpload('images')}
              style={{
                padding: '10px',
                backgroundColor: currentTheme.buttonBg,
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Add Images
            </button>
            <button
              type="button"
              onClick={() => handleFileUpload('videos')}
              style={{
                padding: '10px',
                backgroundColor: currentTheme.buttonBg,
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Add Videos
            </button>
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setSelectedAvatar(file);
                    const url = URL.createObjectURL(file);
                    setAvatarPreview(url);
                    setFormData(prev => ({ ...prev, publisherAvatar: url }));
                  }
                };
                input.click();
              }}
              style={{
                padding: '10px',
                backgroundColor: currentTheme.buttonBg,
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Update Publisher Avatar
            </button>

            {/* Avatar preview */}
            {avatarPreview && (
              <div style={{ marginTop: '10px' }}>
                <h4 style={{ color: currentTheme.textSecondary }}>Publisher Avatar Preview:</h4>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  <img src={avatarPreview} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <button type="button" onClick={() => { setSelectedAvatar(null); setAvatarPreview(null); setFormData(prev => ({ ...prev, publisherAvatar: null })); }} style={{ marginTop: '8px', background: 'red', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Remove Avatar</button>
              </div>
            )}
          </div>

          {/* Avatar preview for create form */}
          {avatarPreview && (
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ color: currentTheme.textSecondary }}>Publisher Avatar Preview:</h4>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <img src={avatarPreview} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <button type="button" onClick={() => { setSelectedAvatar(null); setAvatarPreview(null); setFormData(prev => ({ ...prev, publisherAvatar: null })); }} style={{ marginTop: '8px', background: 'red', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Remove Avatar</button>
            </div>
          )}

          {/* Display selected images */}
          {formData.images.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ color: currentTheme.textSecondary }}>Selected Images:</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {formData.images.map((url, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img
                      src={url}
                      alt={`Selected ${index + 1}`}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeMedia('images', index)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: 'red',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Display selected videos */}
          {formData.videos.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ color: currentTheme.textSecondary }}>Selected Videos:</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {formData.videos.map((url, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <video
                      src={url}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }}
                      controls={false}
                    />
                    <button
                      type="button"
                      onClick={() => removeMedia('videos', index)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: 'red',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {message && (
          <p style={{
            marginBottom: '20px',
            color: message.includes('successfully') ? 'lime' : 'red'
          }}>
            {message}
          </p>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loadingForm}
            style={{
              padding: '10px 20px',
              backgroundColor: currentTheme.buttonBg,
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loadingForm ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loadingForm ? 'Updating...' : 'Update'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  const Form = () => {
    const [formData, setFormData] = useState({
      title: '',
      content: '',
      images: [],
      videos: [],
      website: '',
      publisherName: '',
      publisherAvatar: null // used for preview
    });
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [loadingForm, setLoadingForm] = useState(false);
    const [message, setMessage] = useState('');

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleFileUpload = (type) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = type === 'images' ? 'image/*' : 'video/*';
      input.onchange = (e) => {
        const files = Array.from(e.target.files);
        const urls = files.map(file => URL.createObjectURL(file));
        if (type === 'images') {
          setSelectedImages(prev => [...prev, ...files]);
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...urls]
          }));
        } else {
          setSelectedVideos(prev => [...prev, ...files]);
          setFormData(prev => ({
            ...prev,
            videos: [...prev.videos, ...urls]
          }));
        }
      };
      input.click();
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoadingForm(true);
      setMessage('');

      try {
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('content', formData.content);
        formDataToSend.append('website', formData.website);
        formDataToSend.append('publisherName', formData.publisherName);

        // Append images and videos as files
        selectedImages.forEach((file) => {
          formDataToSend.append('images', file);
        });
        selectedVideos.forEach((file) => {
          formDataToSend.append('videos', file);
        });
        if (selectedAvatar) {
          formDataToSend.append('avatar', selectedAvatar);
        }

        const res = await fetch('http://localhost:4000/api/blogs', {
          method: 'POST',
          credentials: 'include',
          body: formDataToSend
        });

        if (res.ok) {
          await res.json();
          setMessage('Blog posted successfully!');
          setFormData({
            title: '',
            content: '',
            images: [],
            videos: [],
            website: '',
            publisherName: '',
            publisherAvatar: null
          });
          setSelectedImages([]);
          setSelectedVideos([]);
          setSelectedAvatar(null);
          await fetchBlogs(true);
        } else {
          const error = await res.json();
          setMessage(error.error || 'Failed to post blog');
        }
      } catch (err) {
        setMessage('Error posting blog');
      } finally {
        setLoadingForm(false);
      }
    };

    const removeMedia = (type, index) => {
      setFormData(prev => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      }));
      if (type === 'images') {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
      } else {
        setSelectedVideos(prev => prev.filter((_, i) => i !== index));
      }
    };

    return (
      <form onSubmit={handleSubmit} style={{
        backgroundColor: currentTheme.cardBg,
        padding: '20px',
        borderRadius: '10px',
        border: `1px solid ${currentTheme.sidebarBorder}`,
        color: currentTheme.color
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: currentTheme.textSecondary }}>
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter title"
            required
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: currentTheme.inputBg,
              border: `1px solid ${currentTheme.inputBorder}`,
              borderRadius: '5px',
              color: currentTheme.color,
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: currentTheme.textSecondary }}>
            Content
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Enter your content"
            rows={5}
            required
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: currentTheme.inputBg,
              border: `1px solid ${currentTheme.inputBorder}`,
              borderRadius: '5px',
              color: currentTheme.color,
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: currentTheme.textSecondary }}>
            Website (optional)
          </label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="https://example.com"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: currentTheme.inputBg,
              border: `1px solid ${currentTheme.inputBorder}`,
              borderRadius: '5px',
              color: currentTheme.color,
              fontSize: '14px'
            }}
          />
        </div>

        

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: currentTheme.textSecondary }}>
            Media
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleFileUpload('images')}
              style={{
                padding: '10px',
                backgroundColor: currentTheme.buttonBg,
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Add Images
            </button>
            <button
              type="button"
              onClick={() => handleFileUpload('videos')}
              style={{
                padding: '10px',
                backgroundColor: currentTheme.buttonBg,
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Add Videos
            </button>
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setSelectedAvatar(file);
                    const url = URL.createObjectURL(file);
                    setFormData(prev => ({ ...prev, publisherAvatar: url }));
                  }
                };
                input.click();
              }}
              style={{
                padding: '10px',
                backgroundColor: currentTheme.buttonBg,
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Add Publisher Avatar
            </button>
          </div>

          {/* Display selected images */}
          {formData.images.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ color: currentTheme.textSecondary }}>Selected Images:</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {formData.images.map((url, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img
                      src={url}
                      alt={`Selected ${index + 1}`}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeMedia('images', index)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: 'red',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Display selected videos */}
          {formData.videos.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ color: currentTheme.textSecondary }}>Selected Videos:</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {formData.videos.map((url, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <video
                      src={url}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }}
                      controls={false}
                    />
                    <button
                      type="button"
                      onClick={() => removeMedia('videos', index)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: 'red',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {message && (
          <p style={{
            marginBottom: '20px',
            color: message.includes('successfully') ? 'lime' : 'red'
          }}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loadingForm}
          style={{
            padding: '10px 20px',
            backgroundColor: currentTheme.buttonBg,
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loadingForm ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loadingForm ? 'Posting...' : 'Post'}
        </button>
      </form>
    );
  };

  if (loading) {
    return <div style={{ color: currentTheme.color, padding: '20px' }}>Loading...</div>;
  }

  return (
    <div className="dashboard-page" style={{ color: currentTheme.color }}>
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow">Publishing</span>
          <h1 className="dashboard-page-title">Blogs</h1>
          <p className="dashboard-page-copy">
            Manage the live blog catalog, watch engagement counters refresh, and publish new content from one place.
          </p>
        </div>
        <div className="dashboard-page-actions">
          <button type="button" className="dashboard-button dashboard-button-secondary" onClick={() => fetchBlogs(true)}>
            Refresh
          </button>
          <button
            type="button"
            className="dashboard-button"
            onClick={async () => {
              try {
                const res = await fetch('http://localhost:4000/api/blogs/analytics/export/csv');
                if (res.ok) {
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'blogs-analytics.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                } else {
                  const err = await res.json();
                  alert(err.error || 'Failed to export CSV');
                }
              } catch (err) {
                console.error(err);
                alert('Failed to export CSV');
              }
            }}
          >
            Export CSV
          </button>
          <span className="dashboard-status-badge">
            <span className="dashboard-live-dot" />
            {refreshing ? 'Refreshing catalog...' : `Updated ${formatRelativeTime(lastUpdated)}`}
          </span>
        </div>
      </section>

      <section className="dashboard-kpi-grid dashboard-kpi-grid-compact">
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Views</span>
          <strong className="dashboard-kpi-value">{formatNumber(totals.views)}</strong>
          <span className="dashboard-kpi-meta">Across live posts</span>
        </article>
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Likes</span>
          <strong className="dashboard-kpi-value">{formatNumber(totals.likes)}</strong>
          <span className="dashboard-kpi-meta">Audience approval</span>
        </article>
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Dislikes</span>
          <strong className="dashboard-kpi-value">{formatNumber(totals.dislikes)}</strong>
          <span className="dashboard-kpi-meta">Negative feedback</span>
        </article>
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Live posts</span>
          <strong className="dashboard-kpi-value">{formatNumber(totals.blogs)}</strong>
          <span className="dashboard-kpi-meta">Currently published</span>
        </article>
      </section>

      <article className="dashboard-panel" style={{ marginBottom: '32px' }}>
        <div className="dashboard-panel-header">
          <div>
            <h2 className="dashboard-panel-title">Create new blog</h2>
            <p className="dashboard-panel-copy">Draft and publish directly into the live collection.</p>
          </div>
        </div>
        <Form />
      </article>

      {/* Edit Blog Modal */}
      {editingBlog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: currentTheme.cardBg,
            padding: '20px',
            borderRadius: '10px',
            border: `1px solid ${currentTheme.sidebarBorder}`,
            color: currentTheme.color,
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px', color: currentTheme.accentColor }}>Edit Blog</h2>
            <EditForm blog={editingBlog} onSave={handleUpdate} onCancel={() => setEditingBlog(null)} />
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title" style={{ backgroundColor: currentTheme.cardBg, padding: 20, borderRadius: 10, border: `1px solid ${currentTheme.sidebarBorder}`, maxWidth: '400px' }}>
            <h3 id="confirm-delete-title" style={{ marginTop: 0, color: currentTheme.accentColor }}>Archive Blog</h3>
            <p style={{ color: currentTheme.textSecondary }}>
              This blog will be <strong>archived</strong> and hidden from the public blog page. 
              You can restore it later from the <strong>Archive</strong> section.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={cancelDelete} aria-label="Cancel" style={{ padding: '8px 16px', borderRadius: 6, background: currentTheme.inputBg, border: `1px solid ${currentTheme.inputBorder}`, color: currentTheme.color, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDelete} aria-label="Confirm archive" style={{ padding: '8px 16px', background: 'orange', color: 'white', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Blogs */}
      <article className="dashboard-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div>
            <h2 className="dashboard-panel-title" style={{ margin: 0 }}>Existing blogs</h2>
            <p className="dashboard-panel-copy">Live posts with in-place edit and archive controls.</p>
          </div>
          <div role="group" aria-label="Sort order" style={{ marginLeft: 'auto' }}>
            <SortMenu current={sortOption} onChange={setSortOption} />
          </div>
        </div>
        {blogs.length === 0 ? (
          <div className="dashboard-empty">No blogs yet.</div>
        ) : (
          <div className="dashboard-blog-grid">
            {sortBlogs(blogs).map(blog => (
              <div key={blog._id} className="dashboard-blog-grid-item" style={{ position: 'relative' }}>
                <BlogCard
                  blog={blog}
                  onEdit={() => handleEdit(blog)}
                  onDelete={() => showDeleteModal(blog._id)}
                  onUpdate={(updated) => handleCardUpdate(updated)}
                  showControls={true}
                  isAdmin={true}
                />
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
