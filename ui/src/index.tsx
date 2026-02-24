import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

const devMode = !(window as any)?.invokeNative;
const root = ReactDOM.createRoot(document.getElementById("root")!);

const renderApp = () => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (devMode) {
  renderApp();
} else {
  let rendered = false;

  // lb-phone sends "componentsLoaded" when ready
  window.addEventListener("message", (event) => {
    if (event.data === "componentsLoaded" && !rendered) {
      rendered = true;
      renderApp();
    }
  });

  // Fallback for phones that don't send componentsLoaded (yseries, yphone)
  setTimeout(() => {
    if (!rendered) {
      rendered = true;
      renderApp();
    }
  }, 200);
}
