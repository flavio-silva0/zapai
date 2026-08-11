import { Outlet } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import WhatsAppButton from "./WhatsAppButton";

export default function PublicLayout() {
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
