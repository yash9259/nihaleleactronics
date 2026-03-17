import { useEffect, useState } from "react";
import { 
  User, 
  Building2, 
  Upload, 
  Database, 
  LogOut,
  Save,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

export function Settings() {
  const navigate = useNavigate();
  const { profile: authProfile, business, signOut } = useAuth();
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [shop, setShop] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  const [newAdmin, setNewAdmin] = useState({
    loginId: "",
    password: "",
    role: "admin",
  });
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (authProfile?.login_id) {
      setProfile((prev) => ({ ...prev, name: authProfile.login_id }));
    }
    if (business?.name) {
      setShop((prev) => ({ ...prev, name: business.name }));
    }
  }, [authProfile, business]);

  const handleProfileSave = () => {
    alert("Profile updated successfully!");
  };

  const handleShopSave = () => {
    alert("Shop details updated successfully!");
  };

  const handleLogoUpload = () => {
    alert("Logo upload feature coming soon!");
  };

  const handleBackup = () => {
    alert("Data backup initiated! This may take a few minutes.");
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      signOut();
      navigate("/login");
    }
  };

  const handleCreateAdmin = async () => {
    if (!authProfile?.business_id) {
      return;
    }
    setAdminError(null);
    setAdminLoading(true);

    const { data, error } = await supabase.functions.invoke("create-admin", {
      body: {
        loginId: newAdmin.loginId,
        password: newAdmin.password,
        role: newAdmin.role,
        businessId: authProfile.business_id,
      },
    });

    if (error || data?.error) {
      setAdminError(error?.message ?? data?.error ?? "Failed to create admin");
      setAdminLoading(false);
      return;
    }

    setNewAdmin({ loginId: "", password: "", role: "admin" });
    setAdminLoading(false);
    alert("Admin created successfully!");
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[#4D4D4D] mb-2">Settings</h1>
        <p className="text-[#717182]">Manage your profile and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[#628F97]/10 rounded-lg">
            <User className="w-6 h-6 text-[#628F97]" />
          </div>
          <div>
            <h2 className="text-[#4D4D4D]">Profile</h2>
            <p className="text-sm text-[#717182]">Your personal information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[#4D4D4D] mb-2">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[#4D4D4D] mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717182]" />
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#4D4D4D] mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717182]" />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleProfileSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#B9CE18] text-white rounded-lg hover:bg-[#a8bc14] transition-colors"
          >
            <Save className="w-5 h-5" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>

      {/* Shop Details Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[#628F97]/10 rounded-lg">
            <Building2 className="w-6 h-6 text-[#628F97]" />
          </div>
          <div>
            <h2 className="text-[#4D4D4D]">Shop Details</h2>
            <p className="text-sm text-[#717182]">Business information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[#4D4D4D] mb-2">Shop Name</label>
            <input
              type="text"
              value={shop.name}
              onChange={(e) => setShop({ ...shop, name: e.target.value })}
              className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[#4D4D4D] mb-2">Address</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 w-5 h-5 text-[#717182]" />
              <textarea
                value={shop.address}
                onChange={(e) => setShop({ ...shop, address: e.target.value })}
                rows={3}
                className="w-full pl-12 pr-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#4D4D4D] mb-2">Shop Phone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717182]" />
              <input
                type="tel"
                value={shop.phone}
                onChange={(e) => setShop({ ...shop, phone: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#4D4D4D] mb-2">Shop Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717182]" />
              <input
                type="email"
                value={shop.email}
                onChange={(e) => setShop({ ...shop, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleShopSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#B9CE18] text-white rounded-lg hover:bg-[#a8bc14] transition-colors"
          >
            <Save className="w-5 h-5" />
            <span>Save Shop Details</span>
          </button>
        </div>
      </div>

      {/* Logo Upload Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[#628F97]/10 rounded-lg">
            <Upload className="w-6 h-6 text-[#628F97]" />
          </div>
          <div>
            <h2 className="text-[#4D4D4D]">Logo Upload</h2>
            <p className="text-sm text-[#717182]">Upload your shop logo</p>
          </div>
        </div>

        <button
          onClick={handleLogoUpload}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#628F97] rounded-lg border border-[#628F97] hover:bg-[#628F97]/5 transition-colors"
        >
          <Upload className="w-5 h-5" />
          <span>Choose Logo</span>
        </button>
      </div>

      {/* Admin Management */}
      {authProfile?.role === "master" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#628F97]/10 rounded-lg">
              <User className="w-6 h-6 text-[#628F97]" />
            </div>
            <div>
              <h2 className="text-[#4D4D4D]">Admin Management</h2>
              <p className="text-sm text-[#717182]">Create new admins for this business</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[#4D4D4D] mb-2">Login ID</label>
              <input
                type="text"
                value={newAdmin.loginId}
                onChange={(e) => setNewAdmin({ ...newAdmin, loginId: e.target.value })}
                className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#4D4D4D] mb-2">Password</label>
              <input
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#4D4D4D] mb-2">Role</label>
              <select
                value={newAdmin.role}
                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                className="w-full px-4 py-3 bg-white text-[#4D4D4D] rounded-lg border border-gray-200 focus:border-[#B9CE18] focus:outline-none transition-colors"
              >
                <option value="admin">Admin</option>
                <option value="master">Master</option>
              </select>
            </div>

            {adminError && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
                {adminError}
              </div>
            )}

            <button
              onClick={handleCreateAdmin}
              disabled={adminLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#B9CE18] text-white rounded-lg hover:bg-[#a8bc14] transition-colors disabled:opacity-60"
            >
              <Save className="w-5 h-5" />
              <span>{adminLoading ? "Creating..." : "Create Admin"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Data Backup Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[#628F97]/10 rounded-lg">
            <Database className="w-6 h-6 text-[#628F97]" />
          </div>
          <div>
            <h2 className="text-[#4D4D4D]">Data Backup</h2>
            <p className="text-sm text-[#717182]">Backup your data regularly</p>
          </div>
        </div>

        <button
          onClick={handleBackup}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#628F97] rounded-lg border border-[#628F97] hover:bg-[#628F97]/5 transition-colors"
        >
          <Database className="w-5 h-5" />
          <span>Backup Now</span>
        </button>
      </div>

      {/* Logout Section */}
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-50 rounded-lg">
            <LogOut className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-[#4D4D4D]">Logout</h2>
            <p className="text-sm text-[#717182]">Sign out of your account</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
