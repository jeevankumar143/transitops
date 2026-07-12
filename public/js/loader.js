// Injects a full-screen loading overlay on page load, then fades it out.
// Include this as the FIRST script in <body> on every page (login.html, index.html, etc).

(function () {
  const style = document.createElement("style");
  style.textContent = `
    #to-loader {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 22px;
      background: #0F1720;
      transition: opacity 0.5s ease, visibility 0.5s ease;
    }
    #to-loader.to-loader-hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    .to-loader-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .to-loader-mark {
      width: 10px;
      height: 26px;
      background: #F5A623;
      border-radius: 2px;
      animation: to-pulse 1.1s ease-in-out infinite;
    }
    .to-loader-name {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #E8EAED;
      letter-spacing: -0.01em;
    }
    .to-loader-name span { color: #F5A623; }
    .to-loader-track {
      width: 180px;
      height: 3px;
      background: #1A2530;
      border-radius: 2px;
      overflow: hidden;
    }
    .to-loader-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #F5A623, #FFB84D);
      border-radius: 2px;
      animation: to-fill 0.9s ease-out forwards;
    }
    .to-loader-label {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 11px;
      color: #8B98A5;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    @keyframes to-pulse {
      0%, 100% { opacity: 1; transform: scaleY(1); }
      50% { opacity: 0.4; transform: scaleY(0.7); }
    }
    @keyframes to-fill {
      from { width: 0%; }
      to { width: 100%; }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "to-loader";
  overlay.innerHTML = `
    <div class="to-loader-brand">
      <div class="to-loader-mark"></div>
      <div class="to-loader-name">Transit<span>Ops</span></div>
    </div>
    <div class="to-loader-track"><div class="to-loader-fill"></div></div>
    <div class="to-loader-label">Loading fleet data...</div>
  `;
  document.body.prepend(overlay);

  function hideLoader() {
    overlay.classList.add("to-loader-hidden");
    setTimeout(() => overlay.remove(), 500);
  }

  // Hide once the page is fully loaded, with a small minimum
  // display time so it doesn't just flash on fast connections.
  const minDisplay = new Promise((resolve) => setTimeout(resolve, 600));
  const pageReady = new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", resolve);
  });
  Promise.all([minDisplay, pageReady]).then(hideLoader);
})();