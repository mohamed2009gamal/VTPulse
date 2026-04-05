import React from "react";
import "./BlogCard.css";

const buildImageUrl = (path) => {
  if (!path) return "/Logo.png";
  if (/^https?:\/\//i.test(path)) return path;
  let normalized = path;
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  if (!normalized.startsWith("/uploads")) {
    normalized = `/uploads${normalized}`;
  }
  return `http://localhost:4000${normalized}`;
};

const statIcons = {
  views: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  likes: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  ),
  reads: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M4 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-1.93-2.5L3 8a2 2 0 0 1 .19-1.16z"></path>
    </svg>
  ),
};

const BlogCard = ({ blog, onCategoryClick, isHighlighted = false }) => {
  const counts = {
    views: blog?.views ?? 0,
    likes: blog?.likes ?? 0,
    reads: blog?.reads ?? 0,
  };

  const stats = [
    { key: "views", label: "Views", value: counts.views },
    { key: "likes", label: "Likes", value: counts.likes },
    { key: "reads", label: "Reads", value: counts.reads },
  ];

  const rawContent = blog?.content || "";
  const trimmedContent = rawContent.trim();
  const excerpt =
    trimmedContent.length > 0
      ? `${trimmedContent.slice(0, 120)}${trimmedContent.length > 120 ? "..." : ""}`
      : blog?.description || "";

  const publisherName = blog?.publisher?.name || blog?.publisherName || "VenomTech";
  const formattedDate = blog?.date ? new Date(blog.date).toLocaleDateString() : "";
  const imageSrc = buildImageUrl(blog?.images?.[0]);

  return (
    <article className={`blog-card-modern ${isHighlighted ? "highlighted" : ""}`}>
      <div className="blog-image-container">
        <img
          className="blog-image"
          src={imageSrc}
          alt={blog?.title || "Blog image"}
          loading="lazy"
        />
        <div className="image-overlay" aria-hidden="true" />
        {blog?.category && (
          <button
            type="button"
            className="category-badge"
            onClick={() => onCategoryClick && onCategoryClick(blog.category)}
          >
            {blog.category}
          </button>
        )}
        <div className="stats-preview">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="stat-item"
              aria-label={`${stat.value} ${stat.label.toLowerCase()}`}
            >
              {statIcons[stat.key]}
              <span className="stat-value">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="blog-card-content">
        <h3 className="blog-card-title">{blog?.title || "Untitled"}</h3>
        <p className="blog-card-description">{excerpt}</p>
        <div className="blog-author-section">
          <span className="author-name">{publisherName}</span>
          {formattedDate && <span className="author-date">{formattedDate}</span>}
        </div>
        <div className="card-divider" />
        <div className="blog-actions">
          <button className="action-btn read-btn" type="button">
            Read Post
          </button>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
