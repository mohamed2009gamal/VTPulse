import React from 'react';

const SortMenu = ({ current, onChange }) => {
  return (
    <select value={current} onChange={(e) => onChange(e.target.value)}>
      <option value="date-desc">Newest</option>
      <option value="date-asc">Oldest</option>
      <option value="title-asc">Title A-Z</option>
      <option value="title-desc">Title Z-A</option>
    </select>
  );
};

export default SortMenu;

