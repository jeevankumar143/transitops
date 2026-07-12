// public/js/water-ripple.js
// ==================== LIGHTWEIGHT WATER RIPPLE EFFECT ====================
// Uses CSS-based animated ripples instead of heavy canvas pixel manipulation.
// Activates after 2 seconds of idle. Mouse/touch interactions create ripple drops.
(function () {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWaterRipple);
  } else {
    initWaterRipple();
  }

  function initWaterRipple() {
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
      #water-ripple-layer {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
        opacity: 0;
        transition: opacity 0.8s ease;
      }
      #water-ripple-layer.active { opacity: 1; }

      /* Ensure page content stays above the ripple layer */
      body > *:not(#water-ripple-layer):not(.idle-indicator):not(#to-loader) {
        position: relative;
        z-index: 1;
      }

      .water-drop {
        position: absolute;
        border-radius: 50%;
        border: 2px solid rgba(42, 82, 152, 0.25);
        background: radial-gradient(circle, rgba(42,82,152,0.08) 0%, transparent 70%);
        transform: scale(0);
        animation: waterDropExpand 2s ease-out forwards;
        pointer-events: none;
      }
      @keyframes waterDropExpand {
        0%   { transform: scale(0); opacity: 1; }
        50%  { opacity: 0.6; }
        100% { transform: scale(1); opacity: 0; }
      }

      /* Ambient wave overlays */
      .ambient-wave {
        position: absolute;
        border-radius: 50%;
        border: 1.5px solid rgba(42, 82, 152, 0.12);
        transform: scale(0);
        animation: ambientPulse 4s ease-out forwards;
        pointer-events: none;
      }
      @keyframes ambientPulse {
        0%   { transform: scale(0); opacity: 0.8; }
        100% { transform: scale(1); opacity: 0; }
      }

      /* Idle indicator */
      .idle-indicator {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999;
        background: rgba(26, 58, 107, 0.85);
        color: #fff;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.5px;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s, transform 0.3s;
        pointer-events: none;
        backdrop-filter: blur(4px);
      }
      .idle-indicator.show {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);

    // Create ripple layer
    let layer = document.getElementById('water-ripple-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'water-ripple-layer';
      document.body.prepend(layer);
    }

    // Create idle indicator
    let indicator = document.getElementById('idle-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'idle-indicator';
      indicator.id = 'idle-indicator';
      indicator.textContent = '💧 Water surface active';
      document.body.appendChild(indicator);
    }

    let isIdle = false;
    let idleTimer = null;
    let ambientTimer = null;
    let dropCount = 0;
    const MAX_DROPS = 25; // Limit concurrent drop elements for performance

    function createDrop(x, y, size) {
      if (dropCount >= MAX_DROPS) return;
      dropCount++;
      const drop = document.createElement('div');
      drop.className = 'water-drop';
      const s = size || (Math.random() * 120 + 60);
      drop.style.width = s + 'px';
      drop.style.height = s + 'px';
      drop.style.left = (x - s / 2) + 'px';
      drop.style.top = (y - s / 2) + 'px';
      layer.appendChild(drop);
      drop.addEventListener('animationend', () => { drop.remove(); dropCount--; });
    }

    function createAmbientWave() {
      if (dropCount >= MAX_DROPS) return;
      dropCount++;
      const wave = document.createElement('div');
      wave.className = 'ambient-wave';
      const s = Math.random() * 300 + 150;
      wave.style.width = s + 'px';
      wave.style.height = s + 'px';
      wave.style.left = (Math.random() * window.innerWidth - s / 2) + 'px';
      wave.style.top = (Math.random() * window.innerHeight - s / 2) + 'px';
      layer.appendChild(wave);
      wave.addEventListener('animationend', () => { wave.remove(); dropCount--; });
    }

    function startAmbient() {
      layer.classList.add('active');
      indicator.classList.add('show');
      // Initial drops
      for (let i = 0; i < 3; i++) {
        setTimeout(() => createAmbientWave(), i * 400);
      }
      ambientTimer = setInterval(() => {
        createAmbientWave();
        if (Math.random() > 0.5) createAmbientWave();
      }, 1200);
    }

    function stopAmbient() {
      layer.classList.remove('active');
      indicator.classList.remove('show');
      if (ambientTimer) { clearInterval(ambientTimer); ambientTimer = null; }
    }

    function resetIdleTimer() {
      if (isIdle) {
        isIdle = false;
        stopAmbient();
      }
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isIdle = true;
        startAmbient();
      }, 2000);
    }

    // Mouse interaction: create drop on click
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0 && isIdle) {
        createDrop(e.clientX, e.clientY, Math.random() * 80 + 40);
      }
      resetIdleTimer();
    });

    // Right click: big drop
    document.addEventListener('contextmenu', (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
      }
      if (isIdle) {
        createDrop(e.clientX, e.clientY, 200);
      } else {
        startAmbient();
        isIdle = true;
        createDrop(e.clientX, e.clientY, 200);
      }
      resetIdleTimer();
    });

    document.addEventListener('mousemove', resetIdleTimer);
    document.addEventListener('keydown', resetIdleTimer);
    document.addEventListener('touchstart', resetIdleTimer);
    document.addEventListener('scroll', resetIdleTimer);

    // Initialize
    resetIdleTimer();
  }
})();
