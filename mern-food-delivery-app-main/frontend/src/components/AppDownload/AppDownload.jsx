import { useState, useRef, useCallback } from "react";
import "./AppDownlaod.css";
import { assets } from "../../assets/assets";
import AppToast from "./AppToast";

/* ── Ripple helper ─────────────────────────────────────────────── */
function spawnRipple(e) {
  const wrap = e.currentTarget;
  const rect  = wrap.getBoundingClientRect();
  const size  = Math.max(rect.width, rect.height);
  const span  = document.createElement("span");
  span.className = "store-ripple";
  span.style.cssText = `
    width:  ${size}px;
    height: ${size}px;
    top:    ${e.clientY - rect.top  - size / 2}px;
    left:   ${e.clientX - rect.left - size / 2}px;
  `;
  wrap.appendChild(span);
  span.addEventListener("animationend", () => span.remove(), { once: true });
}

/* ── Component ─────────────────────────────────────────────────── */
const AppDownload = () => {
  const keyRef  = useRef(0);
  const [triggerKey, setTriggerKey] = useState(0);
  const [showToast,  setShowToast]  = useState(false);

  const handleClick = useCallback((e) => {
    spawnRipple(e);
    keyRef.current += 1;
    setTriggerKey(keyRef.current);
    setShowToast(true);
  }, []);

  return (
    <div className="app-download" id="app-download">
      <p>
        For Better Experience <br /> QuickBite App
      </p>

      <div className="app-download-platforms">
        <div className="store-btn" onClick={handleClick}>
          <img src={assets.play_store} alt="Get it on Google Play" draggable="false" />
        </div>
        <div className="store-btn" onClick={handleClick}>
          <img src={assets.app_store} alt="Download on the App Store" draggable="false" />
        </div>
      </div>

      {/* Toast is portal-rendered into document.body — escapes all stacking contexts */}
      {showToast && (
        <AppToast
          triggerKey={triggerKey}
          onDone={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default AppDownload;