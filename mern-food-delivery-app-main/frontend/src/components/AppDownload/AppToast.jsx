import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import "./AppToast.css";

/* ─── Config ──────────────────────────────────────────────────── */
const DURATION = 4000;

const MSGS = [
  {
    icon: "🚀",
    title: "QuickBite Mobile App is Coming Soon!",
    desc: "Stay tuned for a faster and smarter food ordering experience.",
  },
  {
    icon: "📱",
    title: "We're cooking something amazing!",
    desc: "The QuickBite App will be available soon.",
  },
];

/* ─── Module singleton ── one toast at a time ─────────────────── */
let _live = false;

/* ═══════════════════════════════════════════════════════════════
   AppToast
   • Rendered via createPortal → always escapes stacking contexts
   • triggerKey increments on every button click
   • If toast already visible → update (reset timer, pick new msg)
   • If toast hidden        → show fresh
═══════════════════════════════════════════════════════════════ */
const AppToast = ({ triggerKey, onDone }) => {
  const [visible,  setVisible]  = useState(false);
  const [msg,      setMsg]      = useState(MSGS[0]);
  const [progress, setProgress] = useState(100);

  const tickRef      = useRef(null);
  const remainingRef = useRef(DURATION);
  const lastRef      = useRef(null);
  const pausedRef    = useRef(false);

  /* ── timer helpers ── */
  const stopTick = () => clearInterval(tickRef.current);

  const startTick = useCallback(() => {
    stopTick();
    lastRef.current = Date.now();

    tickRef.current = setInterval(() => {
      if (pausedRef.current) {
        lastRef.current = Date.now();   // keep reference fresh while paused
        return;
      }
      const delta = Date.now() - lastRef.current;
      lastRef.current = Date.now();
      remainingRef.current = Math.max(0, remainingRef.current - delta);
      setProgress((remainingRef.current / DURATION) * 100);

      if (remainingRef.current === 0) {
        stopTick();
        setVisible(false);
        setTimeout(() => { _live = false; onDone?.(); }, 380);
      }
    }, 40);
  }, [onDone]);

  /* ── fire on every button click ── */
  useEffect(() => {
    if (triggerKey === 0) return;

    const nextMsg = MSGS[Math.random() < 0.5 ? 0 : 1];
    setMsg(nextMsg);

    if (_live) {
      /* toast already showing → just reset */
      stopTick();
      remainingRef.current = DURATION;
      setProgress(100);
      startTick();
    } else {
      /* fresh */
      _live = true;
      remainingRef.current = DURATION;
      setProgress(100);
      setVisible(true);
      startTick();
    }

    return stopTick;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);

  /* ── manual close ── */
  const close = useCallback(() => {
    stopTick();
    setVisible(false);
    setTimeout(() => { _live = false; onDone?.(); }, 380);
  }, [onDone]);

  /* ── portal target ── */
  const portalRoot = typeof document !== "undefined" ? document.body : null;
  if (!portalRoot) return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          key="qb-toast"
          className="qbt-wrapper"
          initial={{ opacity: 0, x: 120, scale: 0.9 }}
          animate={{
            opacity: 1, x: 0, scale: 1,
            transition: { type: "spring", stiffness: 320, damping: 28 },
          }}
          exit={{
            opacity: 0, x: 120, scale: 0.92,
            transition: { duration: 0.34, ease: "easeIn" },
          }}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; lastRef.current = Date.now(); }}
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          {/* ambient glow behind card */}
          <div className="qbt-glow" aria-hidden="true" />

          {/* card */}
          <div className="qbt-card">
            <span className="qbt-icon" aria-hidden="true">{msg.icon}</span>
            <div className="qbt-text">
              <p className="qbt-title">{msg.title}</p>
              <p className="qbt-desc">{msg.desc}</p>
            </div>
            <button
              className="qbt-close"
              onClick={close}
              aria-label="Dismiss"
              type="button"
            >×</button>
          </div>

          {/* progress bar */}
          <div className="qbt-track" aria-hidden="true">
            <div className="qbt-bar" style={{ width: `${progress}%` }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalRoot
  );
};

export default AppToast;
