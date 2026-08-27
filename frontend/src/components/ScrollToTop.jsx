import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop
 * Gerencia scroll entre rotas e hashes com scrollRestoration manual,
 * garantindo que reload (F5) em "/" sempre renderize no topo (Hero),
 * que hashes como #como-funciona, #recursos e #segmentos rolem suavemente,
 * e que cliques em Home enquanto já está na página inicial realizem scroll suave.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const isFirstRender = useRef(true);
  const prevPathname = useRef(pathname);

  useLayoutEffect(() => {
    const isNewPage = prevPathname.current !== pathname;
    const isInitial = isFirstRender.current;
    isFirstRender.current = false;
    prevPathname.current = pathname;

    // 1. Caso sem hash (Ex: "/", "/planos", reload em "/")
    if (!hash) {
      // Se é reload inicial ou troca de rota completa (ex: de /planos para /)
      if (isInitial || isNewPage) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        const rafId = requestAnimationFrame(() => {
          if (!window.location.hash) {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          }
        });
        return () => cancelAnimationFrame(rafId);
      } else {
        // Se já está na mesma página, scroll suave até o topo
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        return;
      }
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
