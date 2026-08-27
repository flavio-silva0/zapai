import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop
 * Gerencia scroll entre rotas e hashes com scrollRestoration manual,
 * garantindo que reload (F5) em "/" sempre renderize no topo (Hero),
 * e que hashes como #como-funciona, #recursos e #segmentos rolem suavemente.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    // 1. Caso sem hash (Ex: "/", "/planos", reload em "/")
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      // Salvaguarda contra browser restoring scroll position assincronamente após o layout
      const rafId = requestAnimationFrame(() => {
        if (!window.location.hash) {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
      });
      return () => cancelAnimationFrame(rafId);
    }

    // 2. Caso com hash
    let targetId = hash.replace(/^#/, "");
    // Alias para retrocompatibilidade
    if (targetId === "demo") targetId = "recursos";

    if (targetId === "hero") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }

    const scrollToElement = () => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
      return false;
    };

    // Se já estiver no DOM
    if (scrollToElement()) return;

    // Se ainda está carregando ou montando (ex: lazy loading)
    let attempts = 0;
    const maxAttempts = 30; // ~500ms
    let rafId = null;

    const observer = new MutationObserver(() => {
      if (scrollToElement()) {
        observer.disconnect();
        if (rafId) cancelAnimationFrame(rafId);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const checkFrame = () => {
      attempts++;
      if (scrollToElement() || attempts >= maxAttempts) {
        observer.disconnect();
        return;
      }
      rafId = requestAnimationFrame(checkFrame);
    };

    rafId = requestAnimationFrame(checkFrame);

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [pathname, hash]);

  return null;
}
