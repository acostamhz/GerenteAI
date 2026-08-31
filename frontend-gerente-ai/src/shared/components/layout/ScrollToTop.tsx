import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Componente global que asegura que al cambiar de ruta, vista o pestaña,
 * la pantalla y todos los contenedores con scroll se desplacen inmediatamente al tope (top: 0).
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 1. Scroll en ventana global / documento
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.body.scrollTo({ top: 0, left: 0, behavior: "instant" });

    // 2. Scroll en contenedores con scroll interno (<main>, divs con overflow)
    const scrollableElements = document.querySelectorAll(
      "main, .overflow-y-auto, .overflow-auto, [data-scroll-container]"
    );
    scrollableElements.forEach((el) => {
      el.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
  }, [pathname, search]);

  return null;
}
