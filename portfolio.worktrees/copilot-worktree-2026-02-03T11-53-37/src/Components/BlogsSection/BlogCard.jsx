import React, { useState, useEffect, useRef } from "react";
import "./BlogCard.css";

const BlogCard = ({ blog, onEdit, onDelete, onUpdate, isAdmin: isAdminProp, adminEmail: adminEmailProp, showControls = false, onCategoryClick, isHighlighted = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // If click is neither inside the menu nor on the menu button, close menu
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  // `isAdmin` and `adminEmail` can be passed as props from parent for a single auth check
  const adminEmail = adminEmailProp || (typeof window !== 'undefined' ? localStorage.getItem('adminEmail') : null);
  const isAdmin = (typeof isAdminProp !== 'undefined') ? isAdminProp : !!adminEmail;

  // Only allow management actions when `showControls` is true (dashboard passes this) AND admin is verified.
  const canManage = showControls && isAdmin;

  const publisherName = adminEmail === 'mohamedgamal2512009@gmail.com' ? 'Mohamed' : (blog.publisher ? blog.publisher.name || 'Admin' : 'Admin');

  const formatDateTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    // If backend stores only filenames (e.g., "abc.jpg"), ensure we point to /uploads/<filename>
    let p = path;
    if (!p.startsWith('/')) p = `/${p}`;
    if (!p.startsWith('/uploads')) p = `/uploads${p}`;
    return `http://localhost:4000${p}`;
  };

  const mainImage = (blog.images && blog.images.length > 0) ? getFullUrl(blog.images[0]) : '/Logo.png';
  const avatarUrl = blog.publisher && blog.publisher.avatar ? getFullUrl(blog.publisher.avatar) : null;

  // Modal / detail view state
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState(blog);
  const [liked, setLiked] = useState(!!(typeof window !== 'undefined' && localStorage.getItem(`blog_liked_${blog._id}`)));
  const [disliked, setDisliked] = useState(!!(typeof window !== 'undefined' && localStorage.getItem(`blog_disliked_${blog._id}`)));

  // Local counts so the card updates immediately when actions are performed
  const [counts, setCounts] = useState({ views: blog.views || 0, likes: blog.likes || 0, dislikes: blog.dislikes || 0 });

  // Animation flags for count changes
  const [animateLike, setAnimateLike] = useState(false);
  const [animateDislike, setAnimateDislike] = useState(false);
  const [animateView, setAnimateView] = useState(false);

  // request-in-progress flags to avoid double clicks
  const [likeInProgress, setLikeInProgress] = useState(false);
  const [dislikeInProgress, setDislikeInProgress] = useState(false);

  // flash animation states for counts
  const [flashLike, setFlashLike] = useState(null); // 'up' | 'down' | null
  const [flashDislike, setFlashDislike] = useState(null);

  // temporary toast message for actions
  const [toast, setToast] = useState(null);
  let toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  };

  const triggerFlash = (which, dir) => {
    if (which === 'like') {
      setFlashLike(dir);
      setTimeout(() => setFlashLike(null), 420);
    } else if (which === 'dislike') {
      setFlashDislike(dir);
      setTimeout(() => setFlashDislike(null), 420);
    }
  };

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  // Sync counts when parent updates the `blog` prop
  useEffect(() => {
    setCounts({ views: blog.views || 0, likes: blog.likes || 0, dislikes: blog.dislikes || 0 });
    setDetail(blog);
  }, [blog._id, blog.views, blog.likes, blog.dislikes, blog]);

  // Fetch vote status for current visitor and initialize liked/disliked reliably
  useEffect(() => {
    let mounted = true;
    const fetchVote = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/blogs/${blog._id}/vote`, { credentials: 'include' });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          if (data.vote === 1) {
            setLiked(true);
            setDisliked(false);
            localStorage.setItem(`blog_liked_${blog._id}`, '1');
            localStorage.removeItem(`blog_disliked_${blog._id}`);
          } else if (data.vote === -1) {
            setDisliked(true);
            setLiked(false);
            localStorage.setItem(`blog_disliked_${blog._id}`, '1');
            localStorage.removeItem(`blog_liked_${blog._id}`);
          } else {
            setLiked(false);
            setDisliked(false);
          }
        }
      } catch (err) {
        // ignore
      }
    };
    fetchVote();
    return () => { mounted = false; };
  }, [blog._id]);

  const openModal = async () => {
    try {
      // Optimistically increment views locally so the UI feels instant
      setCounts(prev => ({ ...prev, views: prev.views + 1 }));

      // increment view then fetch latest blog
      const viewRes = await fetch(`http://localhost:4000/api/blogs/${blog._id}/view`, { method: 'POST', credentials: 'include' });
      if (viewRes.ok) {
        const v = await viewRes.json();
        setCounts({ views: v.views || 0, likes: v.likes || 0, dislikes: v.dislikes || 0 });
        setAnimateView(true);
        setTimeout(() => setAnimateView(false), 450);
        if (onUpdate) onUpdate(v);
      } else {
        // revert optimistic increment on failure
        setCounts(prev => ({ ...prev, views: Math.max(0, prev.views - 1) }));
      }

      const res = await fetch(`http://localhost:4000/api/blogs/${blog._id}`, { credentials: 'include' });
      const data = await res.json();
      setDetail(data);
      setCounts({ views: data.views || 0, likes: data.likes || 0, dislikes: data.dislikes || 0 });
      if (onUpdate) onUpdate(data);
      setShowModal(true);
    } catch (err) {
      // revert optimistic increment on error
      setCounts(prev => ({ ...prev, views: Math.max(0, prev.views - 1) }));
      console.error('Error loading blog detail', err);
    }
  };

  const closeModal = () => setShowModal(false);

  const handleLike = async () => {
    if (likeInProgress || dislikeInProgress) return;
    setLikeInProgress(true);

    const prev = { ...counts };

    try {
      if (liked) {
        // Undo like (unvote)
        setCounts(prevC => ({ ...prevC, likes: Math.max(0, prevC.likes - 1) }));
        setLiked(false);
        localStorage.removeItem(`blog_liked_${blog._id}`);

        const res = await fetch(`http://localhost:4000/api/blogs/${blog._id}/vote`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) {
          const updated = await res.json();
          setDetail(updated);
          setCounts({ views: updated.views || 0, likes: updated.likes || 0, dislikes: updated.dislikes || 0 });
          // We unvoted (like removed)
          triggerFlash('like', 'down');
          showToast('Like removed');
          if (onUpdate) onUpdate(updated);
        } else {
          // revert on error
          setCounts(prev);
          setLiked(true);
        }
      } else {
        const wasDisliked = disliked;
        // Optimistically apply like
        setCounts(prevC => ({ ...prevC, likes: prevC.likes + 1, dislikes: prevC.dislikes - (wasDisliked ? 1 : 0) }));
        setLiked(true);
        if (wasDisliked) setDisliked(false);

        const res = await fetch(`http://localhost:4000/api/blogs/${blog._id}/like`, { method: 'POST', credentials: 'include' });
        if (res.ok) {
          const updated = await res.json();
          setDetail(updated);
          setCounts({ views: updated.views || 0, likes: updated.likes || 0, dislikes: updated.dislikes || 0 });
          localStorage.setItem(`blog_liked_${blog._id}`, '1');
          localStorage.removeItem(`blog_disliked_${blog._id}`);
          setAnimateLike(true);
          triggerFlash('like', 'up');
          showToast('Liked');
          setTimeout(() => setAnimateLike(false), 450);
          if (onUpdate) onUpdate(updated);
        } else {
          // revert optimistic
          setCounts(prev);
          setLiked(false);
          if (wasDisliked) setDisliked(true);
        }
      }
    } catch (err) {
      // revert optimistic on error
      setCounts(prev);
      setLiked(false);
      setDisliked(false);
      console.error(err);
    } finally {
      setLikeInProgress(false);
    }
  };

  const handleDislike = async () => {
    if (likeInProgress || dislikeInProgress) return;
    setDislikeInProgress(true);

    const prev = { ...counts };

    try {
      if (disliked) {
        // Undo dislike (unvote)
        setCounts(prevC => ({ ...prevC, dislikes: Math.max(0, prevC.dislikes - 1) }));
        setDisliked(false);
        localStorage.removeItem(`blog_disliked_${blog._id}`);

        const res = await fetch(`http://localhost:4000/api/blogs/${blog._id}/vote`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) {
          const updated = await res.json();
          setDetail(updated);
          setCounts({ views: updated.views || 0, likes: updated.likes || 0, dislikes: updated.dislikes || 0 });
          triggerFlash('dislike', 'down');
          showToast('Dislike removed');
          if (onUpdate) onUpdate(updated);
        } else {
          // revert on error
          setCounts(prev);
          setDisliked(true);
        }
      } else {
        const wasLiked = liked;
        // Optimistically apply dislike
        setCounts(prevC => ({ ...prevC, dislikes: prevC.dislikes + 1, likes: prevC.likes - (wasLiked ? 1 : 0) }));
        setDisliked(true);
        if (wasLiked) setLiked(false);

        const res = await fetch(`http://localhost:4000/api/blogs/${blog._id}/dislike`, { method: 'POST', credentials: 'include' });
        if (res.ok) {
          const updated = await res.json();
          setDetail(updated);
          setCounts({ views: updated.views || 0, likes: updated.likes || 0, dislikes: updated.dislikes || 0 });
          localStorage.setItem(`blog_disliked_${blog._id}`, '1');
          localStorage.removeItem(`blog_liked_${blog._id}`);
          setAnimateDislike(true);
          triggerFlash('dislike', 'up');
          showToast('Disliked');
          setTimeout(() => setAnimateDislike(false), 450);
          if (onUpdate) onUpdate(updated);
        } else {
          // revert optimistic
          setCounts(prev);
          setDisliked(false);
          if (wasLiked) setLiked(true);
        }
      }
    } catch (err) {
      // revert optimistic on error
      setCounts(prev);
      setDisliked(false);
      setLiked(false);
      console.error(err);
    } finally {
      setDislikeInProgress(false);
    }
  };

  return (
    <div className={`blog-card ${isHighlighted ? 'highlighted' : ''}`} style={{ position: 'relative' }}>
      <div className="image-wrapper">
        <img
          className="blog-card-image"
          src={mainImage}
          alt={blog.title || 'Blog image'}
          onError={(e) => { e.target.onerror = null; e.target.src = '/Logo.png'; }}
        />

        <div className="image-overlay" aria-hidden></div>
        <button
          type="button"
          className={`badge filter-badge ${isHighlighted ? 'active' : ''}`}
          onClick={() => onCategoryClick && onCategoryClick(blog.category || 'Featured')}
          aria-pressed={isHighlighted}
          aria-label={`Filter by ${blog.category || 'Featured'}`}
        >
          {blog.category || 'Featured'}
        </button>
        <span className="sparkles" aria-hidden></span>
      </div>

      <div className="blog-card-body">

        <h3 className="blog-title">{blog.title || 'Untitled'}</h3>

        <p className="blog-description">
          {blog.content ? `${blog.content.substring(0, 100)}...` : ''}
        </p>

        <div className="blog-author">
          <div className="author-avatar" aria-hidden>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${publisherName} avatar`}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/Logo.png'; }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#c7d2fe' }}></div>
            )}
          </div>
          <div className="author-info">
            <span className="author-name">{publisherName}</span>
            <span className="author-time">Published: {new Date(blog.date).toLocaleDateString()}</span>
            {blog.updatedAt && new Date(blog.updatedAt) > new Date(blog.createdAt) && (
              <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Edited</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 12px 12px' }}>
        <button
          className="read-button"
          onClick={openModal}
          aria-label="Read post"
        >
          Read
        </button>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginLeft: 'auto', paddingRight: 8 }}>
          <button
            className={`icon-btn ${liked ? 'active' : ''}`}
            onClick={handleLike}
            aria-pressed={liked}
            title="Like"
            disabled={likeInProgress || dislikeInProgress}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 21s-7-4.35-9-7.5C1.5 10.5 4 6 8 6c1.9 0 3.2 1.1 4 2 0.8-0.9 2.1-2 4-2 4 0 6.5 4.5 5 7.5C19 16.65 12 21 12 21z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill={liked ? '#ef4444' : 'none'} />
            </svg>
            <span className={`icon-count ${animateLike ? 'pulse' : ''} ${flashLike ? `flash ${flashLike}` : ''}`}>{counts.likes}</span>
          </button>

          <button
            className={`icon-btn ${disliked ? 'active' : ''}`}
            onClick={handleDislike}
            aria-pressed={disliked}
            title="Dislike"
            disabled={likeInProgress || dislikeInProgress}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M21 10c0 1.1-0.9 2-2 2h-3l1 7c0 1.1-0.9 2-2 2h-6L7 16H5c-1.1 0-2-0.9-2-2V6c0-1.1 0.9-2 2-2h14c1.1 0 2 0.9 2 2v4z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill={disliked ? '#111827' : 'none'} />
            </svg>
            <span className={`icon-count ${animateDislike ? 'pulse' : ''} ${flashDislike ? `flash ${flashDislike}` : ''}`}>{counts.dislikes}</span>
          </button>

          <button
            className="icon-btn"
            onClick={openModal}
            title="Views"
            aria-label={`Views: ${counts.views}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
            <span className={`icon-count ${animateView ? 'pulse' : ''}`}>{counts.views}</span>
          </button>
        </div>

        <button
          ref={buttonRef}
          className="menu-button"
          aria-label="Open post menu"
          aria-haspopup="true"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          ⋯
        </button>
      </div>

      {menuOpen && (
        <div className="card-menu" role="menu" ref={menuRef}>
          {canManage && (
            <div className="menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onEdit && onEdit(); }}>
              Edit
            </div>
          )}
          {canManage && (
            <div className="menu-item destructive" role="menuitem" onClick={() => { setMenuOpen(false); onDelete && onDelete(); }}>
              Delete
            </div>
          )}

          <div className="menu-item" role="menuitem">Published: {formatDateTime(blog.date)}</div>
          <div className="menu-item" role="menuitem">Published by: {publisherName}</div>
          {blog.updatedAt && new Date(blog.updatedAt) > new Date(blog.createdAt) && (
            <div className="menu-item" role="menuitem">Last edited: {formatDateTime(blog.updatedAt)}</div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`vote-toast show`} role="status">{toast}</div>
      )}

      {/* Detail modal */}
      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <button className="modal-close" onClick={closeModal} aria-label="Close">×</button>
            <img src={getFullUrl(detail.images && detail.images[0]) || '/Logo.png'} alt={detail.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
            <div style={{ padding: '16px' }}>
              <h2 style={{ margin: '0 0 8px' }}>{detail.title}</h2>
              <div style={{ color: '#6b7280', marginBottom: '8px' }}>By {detail.publisher ? detail.publisher.name : 'Admin'} • {new Date(detail.date).toLocaleString()}</div>
              <div style={{ marginBottom: '12px' }}>{detail.content}</div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button className="like-btn" onClick={handleLike} disabled={likeInProgress} aria-pressed={liked}>❤ {counts.likes}</button>
                <button className="dislike-btn" onClick={handleDislike} disabled={dislikeInProgress} aria-pressed={disliked}>👎 {counts.dislikes}</button>
                <div style={{ color: '#6b7280' }}>Views: {counts.views}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogCard;
