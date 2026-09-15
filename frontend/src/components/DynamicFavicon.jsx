import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * DynamicFavicon
 * Altera o ícone da aba (favicon) dinamicamente:
 * - Verde (/zapai-favicon-green.png) na Landing Page e páginas públicas
 * - Azul (/zapai-favicon.png) quando estiver dentro do Painel
 */
export default function DynamicFavicon() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isPainel = pathname.startsWith("/painel") || pathname.startsWith("/admin");
    const targetFavicon = isPainel ? "/zapai-favicon.png" : "/zapai-favicon-green.png";

    const links = document.querySelectorAll("link[rel*='icon']");
    if (links.length === 0) {
      const newLink = document.createElement("link");
      newLink.rel = "icon";
      newLink.type = "image/png";
      newLink.href = targetFavicon;
      document.head.appendChild(newLink);
    } else {
      links.forEach((link) => {
        link.type = "image/png";
        link.href = targetFavicon;
      });
    }
  }, [pathname]);

  return null;
}
