import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Home,
  FolderKanban,
  QrCode,
  Package,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, business, signOut } = useAuth();

  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: FolderKanban, label: "Category", path: "/category" },
    { icon: QrCode, label: "Generate QR", path: "/generate-qr" },
    { icon: Package, label: "Manage Stock", path: "/manage-stock" },
    { icon: Activity, label: "Activities", path: "/activities" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const handleLogout = () => {
    signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#628F97] text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center gap-3">
            {/* Logo Placeholder */}
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-2xl">
                {(business?.name ?? "Admin").slice(0, 2).toUpperCase()}
              </span>
            </div>
            
            {/* Shop Name */}
            <div className="text-center">
              <h2 className="text-white">{business?.name ?? "Business"}</h2>
              <p className="text-sm text-white/80 mt-1">{profile?.login_id ?? "Admin"}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-[#B9CE18] text-[#4D4D4D]"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#4D4D4D]"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
