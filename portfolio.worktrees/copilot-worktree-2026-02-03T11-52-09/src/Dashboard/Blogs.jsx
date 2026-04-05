import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from './DashboardLayout';
import BlogCard from '../Components/BlogsSection/BlogCard';

export default function Blogs() {
  const { currentTheme } = useTheme();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState(null);
  const [totals, setTotals] = useState({ views: 0, likes: 0, dislikes: 0 });
  const location = useLocation();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/blogs');
      const data = await res.json();
      // Sort newest first
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setBlogs(data);

      // compute totals for quick analytics
      const totals = data.reduce((acc, b) => {
        acc.views += b.views || 0;
        acc.likes += b.likes || 0;
        acc.dislikes += b.dislikes || 0;
        return acc;
      }, { views: 0, likes: 0, dislikes: 0 });
      setTotals(totals);

      // support opening editor via ?edit=<id>
      try {
        const params = new URLSearchParams(location.search);
        const editId = params.get('edit');
        if (editId) {
          const found = data.find(b => b._id === editId);
          if (found) {
            setEditingBlog(found);
            // remove the query param so we don't re-open every refresh
            window.history.replaceState(null, '', '/dashboard/blogs');
          }
        }
      } catch (err) {
        // ignore param parsing errors
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

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
        setBlogs(prev => prev.filter(blog => blog._id !== id));
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
      }, { views: 0, likes: 0, dislikes: 0 });
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
        fetchBlogs(); // Refresh the blogs list
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
            Date (optional)
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
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
      date: '',
      publisherName: '',
      publisherAvatar: null // used for preview
    });
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
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
        formDataToSend.append('date', formData.date);
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
          const newBlog = await res.json();
          setMessage('Blog posted successfully!');
          setFormData({
            title: '',
            content: '',
            images: [],
            videos: [],
            website: '',
            date: '',
            publisherName: '',
            publisherAvatar: null
          });
          setSelectedImages([]);
          setSelectedVideos([]);
          setSelectedAvatar(null);
          setAvatarPreview(null);
          // Optimistically add the returned blog to the list so image/avatar appear without waiting for full refetch
          setBlogs(prev => [newBlog, ...prev]);
          // Recompute totals
          setTotals(prev => ({
            views: prev.views + (newBlog.views || 0),
            likes: prev.likes + (newBlog.likes || 0),
            dislikes: prev.dislikes + (newBlog.dislikes || 0)
          }));
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
            Date (optional)
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
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
    <div style={{ color: currentTheme.color }}>
      <h1 style={{ marginBottom: '18px', color: currentTheme.accentColor }}>Blogs Management</h1>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ background: currentTheme.cardBg, padding: '12px 16px', borderRadius: '8px', border: `1px solid ${currentTheme.sidebarBorder}` }}>
          Views: <strong>{totals.views}</strong>
        </div>
        <div style={{ background: currentTheme.cardBg, padding: '12px 16px', borderRadius: '8px', border: `1px solid ${currentTheme.sidebarBorder}` }}>
          Likes: <strong>{totals.likes}</strong>
        </div>
        <div style={{ background: currentTheme.cardBg, padding: '12px 16px', borderRadius: '8px', border: `1px solid ${currentTheme.sidebarBorder}` }}>
          Dislikes: <strong>{totals.dislikes}</strong>
        </div>

        <button onClick={async () => {
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
        }} style={{ marginLeft: 'auto', padding: '8px 12px', background: currentTheme.buttonBg, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Export CSV</button>

      </div>

      {/* Blog Creation Form */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', color: currentTheme.textSecondary }}>Create New Blog</h2>
        <Form />
      </div>

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
          <div style={{ backgroundColor: currentTheme.cardBg, padding: 20, borderRadius: 10, border: `1px solid ${currentTheme.sidebarBorder}` }}>
            <h3 style={{ marginTop: 0 }}>Confirm Delete</h3>
            <p>Are you sure you want to delete this blog? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={cancelDelete} style={{ padding: '8px 12px', borderRadius: 6 }}>Cancel</button>
              <button onClick={confirmDelete} style={{ padding: '8px 12px', background: 'red', color: 'white', borderRadius: 6 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Blogs */}
      <div>
        <h2 style={{ marginBottom: '20px', color: currentTheme.textSecondary }}>Existing Blogs</h2>
        {blogs.length === 0 ? (
          <p style={{ color: currentTheme.textSecondary }}>No blogs yet.</p>
        ) : (
          <div className="flex gap-5 overflow-x-auto justify-center">
            {blogs.map(blog => (
              <div key={blog._id} style={{ position: 'relative' }}>
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
      </div>
    </div>
  );
}
