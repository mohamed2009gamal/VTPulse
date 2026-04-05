import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./BlogCard.css";

const BlogCard = ({
  blog,
  onEdit,
  onDelete,
  onUpdate,
  isAdmin: isAdminProp,
  adminEmail: adminEmailProp,
  showControls = false,
  onCategoryClick,
  isHighlighted = false
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const modalOpenTimeRef = useRef(null);

  // User state
  const adminEmail = adminEmailProp || (typeof window !== "undefined" ? localStorage.getItem("adminEmail") : null);
  const isAdmin = typeof isAdminProp !== "undefined" ? isAdminProp : !!adminEmail;
  const canManage = showControls && isAdmin;

  // Vote states
  const [liked, setLiked] = useState(false);
  const [counts, setCounts] = useState({
    views: blog.views || 0,
    likes: blog.likes || 0,
    reads: blog.reads || 0
  });

  // Animation states
  const [animateLike, setAnimateLike] = useState(false);
  const [animateView, setAnimateView] = useState(false);
  const [flashLike, setFlashLike] = useState(null);
  const [animateRead, setAnimateRead] = useState(false);

  // Request states
  const [likeInProgress, setLikeInProgress] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Modal/detail state
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState(blog);

  // Toast message
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Menu handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
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
      if (e.key === "Escape") {
        setMenuOpen(false);
        setShowModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Cleanup toast timer
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // Modal keyboard handler
  useEffect(() => {
    if (!showModal) return;

    const handleKeyPress = (e) => {
      if (e.key === "Escape") {
        setShowModal(false);
      }
    };

    const handleDocumentClick = (e) => {
      // If modal is open, prevent document-level click handlers from interfering
      if (showModal) {
        e.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    // Capture phase listener to prevent bubbling
    document.addEventListener("click", handleDocumentClick, true);
    
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [showModal]);

  // Sync counts when blog prop updates
  useEffect(() => {
    setCounts({
      views: blog.views || 0,
      likes: blog.likes || 0,
      reads: blog.reads || 0
    });
    setDetail(blog);
  }, [blog._id, blog.views, blog.likes, blog.reads, blog]);

  // Fetch vote status on mount
  useEffect(() => {
    let mounted = true;
    const fetchVote = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/blogs/${blog._id}/vote`, {
          credentials: "include"
        });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          if (data.vote === 1) {
            setLiked(true);
          } else {
            setLiked(false);
          }
        }
      } catch (err) {
        console.error("Error fetching vote:", err);
      }
    };
    fetchVote();
    return () => {
      mounted = false;
    };
  }, [blog._id]);

  // Utility functions
  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    let p = path;
    if (!p.startsWith("/")) p = `/${p}`;
    if (!p.startsWith("/uploads")) p = `/uploads${p}`;
    return `http://localhost:4000${p}`;
  };

  const formatDateTime = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  const publisherName =
    adminEmail === "mohamedgamal2512009@gmail.com"
      ? "Mohamed"
      : blog.publisher
      ? blog.publisher.name || "Admin"
      : "Admin";

  const mainImage = blog.images && blog.images.length > 0 ? getFullUrl(blog.images[0]) : "/Logo.png";
  const avatarUrl = blog.publisher && blog.publisher.avatar
    ? getFullUrl(blog.publisher.avatar)
    : blog.publisherAvatar
    ? getFullUrl(blog.publisherAvatar)
    : null;

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  };

  const triggerFlash = (which, dir) => {
    if (which === "like") {
      setFlashLike(dir);
      setTimeout(() => setFlashLike(null), 420);
    }
  };

  // Handler: Open modal and increment views
  const openModal = async () => {
    if (modalLoading || showModal) return; // Prevent multiple calls
    setModalLoading(true);

    try {
      setCounts((prev) => ({ ...prev, views: prev.views + 1, reads: prev.reads + 1 }));

      const viewRes = await fetch(`http://localhost:4000/api/blogs/${blog._id}/view`, {
        method: "POST",
        credentials: "include"
      });
      if (viewRes.ok) {
        const v = await viewRes.json();
        setCounts({
          views: v.views || 0,
          likes: v.likes || 0,
          reads: v.reads || 0
        });
        setAnimateView(true);
        setAnimateRead(true);
        setTimeout(() => {
          setAnimateView(false);
          setAnimateRead(false);
        }, 450);
        if (onUpdate) onUpdate(v);
      } else {
        setCounts((prev) => ({ ...prev, views: Math.max(0, prev.views - 1), reads: Math.max(0, prev.reads - 1) }));
      }

      const res = await fetch(`http://localhost:4000/api/blogs/${blog._id}`, {
        credentials: "include"
      });
      const data = await res.json();
      setDetail(data);
      setCounts({
        views: data.views || 0,
        likes: data.likes || 0,
        reads: data.reads || 0
      });
      if (onUpdate) onUpdate(data);
      modalOpenTimeRef.current = Date.now();
      setShowModal(true);
    } catch (err) {
      setCounts((prev) => ({ ...prev, views: Math.max(0, prev.views - 1), reads: Math.max(0, prev.reads - 1) }));
      console.error("Error loading blog detail", err);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = (e) => {
    // Only close if clicking directly on the overlay, not on the card
    if (e && e.target !== e.currentTarget) return;
    setShowModal(false);
  };

  const handleOverlayClick = (e) => {
    // Only close if clicking on the overlay background, not the card
    // Also prevent closing if modal just opened (within 100ms) to avoid accidental closes
    if (e.target === e.currentTarget) {
      const timeSinceOpen = Date.now() - (modalOpenTimeRef.current || 0);
      if (timeSinceOpen > 100) {
        setShowModal(false);
      }
    }
  };

  // Handler: Like
  const handleLike = async () => {
    if (likeInProgress) return;
    setLikeInProgress(true);

    try {
      if (liked) {
        // Undo like
        const res = await fetch(`http://localhost:4000/api/blogs/${blog._id}/vote`, {
          method: "DELETE",
          credentials: "include"
        });
        if (res.ok) {
          const updated = await res.json();
          setDetail(updated);
          setCounts({
            views: updated.views || 0,
            likes: updated.likes || 0,
            reads: updated.reads || 0
          });
          setLiked(false);
          triggerFlash("like", "down");
          showToast("Like removed");
          if (onUpdate) onUpdate(updated);
        }
      } else {
        const res = await fetch(`http://localhost:4000/api/blogs/${blog._id}/like`, {
          method: "POST",
          credentials: "include"
        });
        if (res.ok) {
          const updated = await res.json();
          setDetail(updated);
          setCounts({
            views: updated.views || 0,
            likes: updated.likes || 0,
            reads: updated.reads || 0
          });
          setLiked(true);
          setAnimateLike(true);
          triggerFlash("like", "up");
          showToast("Liked!");
          setTimeout(() => setAnimateLike(false), 450);
          if (onUpdate) onUpdate(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLikeInProgress(false);
    }
  };



  return (
    <div className={`blog-card-modern ${isHighlighted ? "highlighted" : ""}`}>
      {/* Image Container with Overlay */}
      <div className="blog-image-container">
        <img
          className="blog-image"
          src={mainImage}
          alt={blog.title || "Blog image"}
          onError={(e) => (e.target.src = "/Logo.png")}
        />
        <div className="image-overlay"></div>

        {/* Category Badge */}
        {blog.category && (
          <button
            className="category-badge"
            onClick={() => onCategoryClick && onCategoryClick(blog.category)}
            aria-label={`Filter by ${blog.category}`}
          >
            {blog.category}
          </button>
        )}

        {/* Stats Overlay (Quick Preview) */}
        <div className="stats-preview">
          <div className="stat-item" aria-label={`${counts.views} views`}>
            <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span className="stat-value">{counts.views}</span>
          </div>
          <div className="stat-item" aria-label={`${counts.likes} likes`}>
            <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span className="stat-value">{counts.likes}</span>
          </div>
          <div className="stat-item" aria-label={`${counts.reads} reads`}>
            <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-1.93-2.5L3 8a2 2 0 0 1 .19-1.16z"></path>
            </svg>
            <span className="stat-value">{counts.reads}</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="blog-card-content">
        {/* Title */}
        <h3 className="blog-card-title">{blog.title || "Untitled"}</h3>

        {/* Description */}
        <p className="blog-card-description">{blog.content ? `${blog.content.substring(0, 100)}...` : ""}</p>

        {/* Author Section */}
        <div className="blog-author-section">
          <div className="author-avatar" aria-hidden>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${publisherName} avatar`}
                onError={(e) => (e.target.src = "/Logo.png")}
              />
            ) : (
              <div className="avatar-placeholder"></div>
            )}
          </div>
          <div className="author-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="author-name">{publisherName}{isAdmin ? ' — Admin' : ''}</div>
              <div className="author-date">{new Date(blog.date).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="card-divider"></div>

        {/* Engagement Actions */}
        <div className="blog-actions">
          {/* Like Button */}
          <button
            className={`action-btn like-btn ${liked ? "active" : ""}`}
            onClick={handleLike}
            disabled={likeInProgress}
            aria-pressed={liked}
            aria-label={liked ? "Unlike" : "Like"}
            title="Like this post"
          >
            <svg
              className="action-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span
              className={`action-count ${animateLike ? "pulse" : ""} ${
                flashLike ? `flash ${flashLike}` : ""
              }`}
            >
              {counts.likes}
            </span>
          </button>

          {/* Views */}
          <div className="action-item views-item" aria-label={`${counts.views} views`}>
            <svg
              className="action-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span className={`action-count ${animateView ? "pulse" : ""}`}>{counts.views}</span>
          </div>

          {/* Reads */}
          <div className="action-item reads-item" aria-label={`${counts.reads} reads`}>
            <svg
              className="action-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-1.93-2.5L3 8a2 2 0 0 1 .19-1.16z"></path>
            </svg>
            <span className={`action-count ${animateRead ? "pulse" : ""}`}>{counts.reads}</span>
          </div>



          {/* Read Button */}
          <button
            className="action-btn read-btn"
            onClick={openModal}
            disabled={modalLoading}
            aria-label="Read full post"
          >
            Read
          </button>

              {/* Admin controls are available inside the menu (three dots) */}

            {/* Menu Button (Admin Only) */}
            <button
              ref={buttonRef}
              className="action-btn menu-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Post options"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              ⋮
            </button>
        </div>
      </div>

      {/* Menu Dropdown */}
      {menuOpen && (
        <ul className="blog-card-menu" role="menu" ref={menuRef}>
          {canManage && (
            <li>
              <button
                className="menu-item edit"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit && onEdit();
                }}
                role="menuitem"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }} aria-hidden>
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"></path>
                  <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path>
                </svg>
                Edit
              </button>
            </li>
          )}
          {canManage && (
            <li>
              <button
                className="menu-item delete"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete && onDelete();
                }}
                role="menuitem"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }} aria-hidden>
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                  <path d="M10 11v6"></path>
                  <path d="M14 11v6"></path>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                </svg>
                Delete
              </button>
            </li>
          )}

          <li className="menu-divider"></li>

          <li className="menu-item" role="menuitem" aria-label={`Published by ${publisherName}`}>
            <strong>Published by:</strong>&nbsp;{publisherName}
          </li>

          <li className="menu-item" role="menuitem" aria-label={`Published in ${formatDateTime(blog.date)}`}>
            <strong>Published in:</strong>&nbsp;{formatDateTime(blog.date)}
          </li>

          {blog.updatedAt && new Date(blog.updatedAt) > new Date(blog.createdAt) && (
            <>
              <li className="menu-item" role="menuitem">
                <strong>Edited:</strong>&nbsp;{formatDateTime(blog.updatedAt)}
              </li>
              <li className="menu-item" role="menuitem">
                <strong>Edited by:</strong>&nbsp;{publisherName}
              </li>
            </>
          )}
        </ul>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="blog-toast" role="status">
          {toast}
        </div>
      )}

      {/* Modal Detail View */}
      {showModal && ReactDOM.createPortal(
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={handleOverlayClick}
          onMouseDown={handleOverlayClick}
          onTouchStart={handleOverlayClick}
        >
          <div 
            className="modal-card" 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
          >
            <button
              className="modal-close"
              onClick={() => {
                setShowModal(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Close modal"
            >
              ✕
            </button>
            <img
              className="modal-image"
              src={getFullUrl((detail.images && detail.images[0]) || "/Logo.png")}
              alt={detail.title}
            />
            <div className="modal-content">
              <h2>{detail.title}</h2>
              <div className="modal-metadata">
                By {detail.publisher ? detail.publisher.name : "Admin"} •{" "}
                {new Date(detail.date).toLocaleString()}
              </div>
              <p>{detail.content}</p>

              <div className="modal-engagement">
                <button
                  className={`modal-action-btn like ${liked ? "active" : ""}`}
                  onClick={handleLike}
                  disabled={likeInProgress}
                  aria-pressed={liked}
                >
                  ❤️ {counts.likes}
                </button>
                <div className="modal-action-btn views">
                  👁️ {counts.views}
                </div>
                <div className="modal-action-btn reads">
                  📖 {counts.reads}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* End Modal Portal */}
    </div>
  );
};

export default BlogCard;
