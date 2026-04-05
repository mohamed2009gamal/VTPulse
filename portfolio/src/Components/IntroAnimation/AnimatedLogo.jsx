import { motion, AnimatePresence } from "framer-motion";
import styles from "./IntroAnimation.module.css";

const letters = "VenomTech".split("");

const AnimatedLogo = ({ phase = "typing", runKey, config = {} }) => {
  const letterDelay = config.letterDelay ?? 0.4;
  const letterDuration = config.letterDuration ?? 0.28;
  const isTyping = phase === "typing";
  const isShowing = phase === "showing";
  const isDeleting = phase === "deleting";
  const showLogo = isTyping || isShowing || isDeleting;
  const showTagline = isShowing;

  return (
    <div className={styles.logoWrapper}>
      {showLogo && (
        <motion.div
          key="logo"
          className={styles.logoWord}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
            {letters.map((letter, index) => {
              const delay = isTyping
                ? index * letterDelay
                : isDeleting
                ? (letters.length - index - 1) * 0.18
                : 0;

              return (
                <motion.span
                  key={`${letter}-${index}-${runKey ?? "intro"}`}
                  className={styles.logoChar}
                  initial={isTyping ? { opacity: 0, y: 22 } : { opacity: 1, y: 0 }}
                  animate={
                    isTyping
                      ? { opacity: 1, y: 0 }
                      : isDeleting
                      ? { opacity: 0, y: -18 }
                      : { opacity: 1, y: 0 }
                  }
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ delay, duration: letterDuration, ease: "easeInOut" }}
                >
                  {letter}
                </motion.span>
              );
            })}
          </motion.div>
        )}

      <AnimatePresence>
        {showTagline && (
          <motion.p
            key="tagline"
            className={styles.logoTagline}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
          >
            build for future
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedLogo;