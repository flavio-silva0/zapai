import { Outlet } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import WhatsAppButton from "./WhatsAppButton";

export default function PublicLayout() {
  return (
    <div className="public-theme min-h-screen flex flex-col bg-slate-50 text-slate-900 font-body selection:bg-cyan-500/30 selection:text-cyan-900 overflow-x-hidden">
      <PublicNavbar />
      <main className="flex-1 w-full relative">
        <Outlet />
      </main>
      <PublicFooter />
      <WhatsAppButton />
    </div>
  );
}
