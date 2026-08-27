import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import WhatsAppButton from "./WhatsAppButton";

export default function PublicLayout() {
  // Configura scrollRestoration manual exclusivamente para as rotas públicas,
  // impedindo que o navegador restaure a rolagem no meio da página ao dar F5.
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      const original = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      return () => {
        window.history.scrollRestoration = original;
      };
    }
  }, []);

  return (
    <div className="landing min-h-screen flex flex-col bg-[#FAFAF8] text-[#1a1a1a] font-body selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      <PublicNavbar />
      <main className="flex-1 w-full relative">
        <Outlet />
      </main>
      <PublicFooter />
      <WhatsAppButton />
    </div>
  );
}
