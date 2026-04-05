import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import AnimatedLogo from "./AnimatedLogo";
import GradientFlow from "./GradientFlow";
import styles from "./IntroAnimation.module.css";

const IntroAnimation = ({ trigger = 0, readyToExit = true, onComplete }) => {
  const { theme } = useTheme();
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [phase, setPhase] = useState("hidden");
  const timerRef = useRef([]);

  useEffect(() => {
    if (trigger > 0) {
      setOverlayVisible(true);
      setPhase("typing");

      timerRef.current = [
        setTimeout(() => setPhase("showing"), 3800),
        setTimeout(() => setPhase("deleting"), 5800),
        setTimeout(() => setPhase("sliding"), 8200),
        setTimeout(() => {
          setOverlayVisible(false);
          setPhase("hidden");
          onComplete?.("initial", false);
        }, 10000),
      ];

      return () => timerRef.current.forEach((timer) => clearTimeout(timer));
    }
  }, [trigger, onComplete]);

  const handleSkip = () => {
    timerRef.current.forEach((timer) => clearTimeout(timer));
    setPhase("hidden");
    setOverlayVisible(false);
    onComplete?.("initial", false);
  };

  return (
    <AnimatePresence>
      {overlayVisible && (
        <motion.div
          className={styles.introOverlay}
          initial={{ y: 0, opacity: 1 }}
          animate={phase === "sliding" ? { y: "-100%", opacity: 0 } : { y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <div className={styles.introHeader} />
          <div className={styles.introShell}>
            <div className={styles.plank}>
              <GradientFlow theme={theme} lowPerf={false} />
              <div className={styles.plankContent}>
                <AnimatedLogo phase={phase} />
              </div>
            </div>
          </div>
          <div className={styles.introFooter}>
            <div className={styles.footerAccent} />
          </div>
          <div className={styles.skipButton}>
            <button onClick={handleSkip}>Skip Intro</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;
