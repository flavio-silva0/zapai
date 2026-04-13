import { Outlet } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import WhatsAppButton from "./WhatsAppButton";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#060e1a]">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <WhatsAppButton />
    </div>
  );
}
