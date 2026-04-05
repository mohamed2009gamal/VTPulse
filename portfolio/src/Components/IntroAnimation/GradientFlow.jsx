import { useEffect, useMemo, useState } from "react";
import styles from "./IntroAnimation.module.css";

const GradientFlow = ({ theme, lowPerf }) => {
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const [supportsHover, setSupportsHover] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hoverQuery = window.matchMedia ? window.matchMedia("(hover: hover)") : null;

    const updateHoverSupport = () => {
      if (!hoverQuery) {
        setSupportsHover(true);
        return;
      }
      setSupportsHover(hoverQuery.matches);
    };

    updateHoverSupport();

    const moveHandler = (event) => {
      const { clientX, clientY } = event;
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (!width || !height) {
        setPointer({ x: 50, y: 50 });
        return;
      }

      setPointer({
        x: Math.min(100, Math.max(0, (clientX / width) * 100)),
        y: Math.min(100, Math.max(0, (clientY / height) * 100)),
      });
    };

    window.addEventListener("pointermove", moveHandler);

    if (hoverQuery) {
      if (hoverQuery.addEventListener) {
        hoverQuery.addEventListener("change", updateHoverSupport);
      } else {
        hoverQuery.addListener(updateHoverSupport);
      }
    }

    return () => {
      window.removeEventListener("pointermove", moveHandler);
      if (hoverQuery) {
        if (hoverQuery.removeEventListener) {
          hoverQuery.removeEventListener("change", updateHoverSupport);
        } else {
          hoverQuery.removeListener(updateHoverSupport);
        }
      }
    };
  }, []);

  const gradient = useMemo(() => {
    return theme === "dark"
      ? "linear-gradient(110deg, #030711 0%, #0b1122 25%, #0c1d3a 55%, #1e3a8a 100%)"
      : "linear-gradient(110deg, #ffffff 0%, #e0f2fe 35%, #bae6fd 65%, #1d4ed8 100%)";
  }, [theme]);

  const gridColor = theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const shouldShowLight = !lowPerf && supportsHover;

  return (
    <div className={styles.gradientFlow} style={{ backgroundImage: gradient, "--grid-color": gridColor }}>
      <div className={styles.gridLayer} />
      {shouldShowLight && (
        <div
          className={styles.cursorLight}
          style={{
            left: `${pointer.x}%`,
            top: `${pointer.y}%`,
          }}
        />
      )}
    </div>
  );
};

export default GradientFlow;
