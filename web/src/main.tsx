import { App } from "./containers";
import "./index.css";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

const CHUNK_RELOAD_KEY = "poe-tools.last-chunk-reload";
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  try {
    const previousReload = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY));
    if (!Number.isFinite(previousReload) || Date.now() - previousReload > 60_000) {
      window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
      window.location.reload();
    }
  } catch {
    // The error boundary remains available when session storage is disabled.
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Suspense>
        <App />
      </Suspense>
    </HashRouter>
  </React.StrictMode>,
);
