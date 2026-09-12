import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./app/App.tsx";
import { AppProvider } from "./providers/app.tsx";
import "./styles/index.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const root = createRoot(
  document.getElementById("root")!
);

root.render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <AppProvider>
      <App />
    </AppProvider>
  </GoogleOAuthProvider>
);

/* =========================================================
   LUKA INITIAL LOADER

   Mantener el loader visible durante 2 segundos.
========================================================= */

window.setTimeout(() => {
  const loader = document.getElementById(
    "initial-loader"
  );

  if (!loader) return;

  /*
   * Inicia el fade-out.
   */

  loader.classList.add("is-hidden");

  /*
   * Esperamos los 500ms del fade-out
   * antes de eliminar el loader del DOM.
   */

  window.setTimeout(() => {
    loader.remove();
  }, 500);
}, 2000);