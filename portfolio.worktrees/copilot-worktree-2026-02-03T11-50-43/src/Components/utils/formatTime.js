// src/utils/formatTime.js
// src/Components/utils/formatTime.js
export const formatTime = (seconds) => {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return `${hrs} hours ${mins} mins ${secs} secs`;
};
// src/Components/CookiesSection/CookiesSection.jsx