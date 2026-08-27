import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }

    const targetId = hash.replace(/^#/, "");
    if (!targetId) return;

    // Tenta encontrar o elemento e rolar
    const scrollToElement = () => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
      return false;
    };

    // Se já estiver no DOM, rola imediatamente
    if (scrollToElement()) return;

    // Se o elemento ainda não montou (ex: mudança de rota com lazy loading),
    // aguarda via MutationObserver e requestAnimationFrame
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
