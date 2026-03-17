import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./screens/Home";
import { Category } from "./screens/Category";
import { GenerateQR } from "./screens/GenerateQR";
import { ManageStock } from "./screens/ManageStock";
import { Activities } from "./screens/Activities";
import { Settings } from "./screens/Settings";
import { Login } from "./screens/Login";
import { useAuth } from "./context/AuthContext";

function ProtectedLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-[#717182]">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function LoginPage() {
  return <Login />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    Component: ProtectedLayout,
    children: [
      {
        path: "/",
        Component: Home,
      },
      {
        path: "/category",
        Component: Category,
      },
      {
        path: "/generate-qr",
        Component: GenerateQR,
      },
      {
        path: "/manage-stock",
        Component: ManageStock,
      },
      {
        path: "/activities",
        Component: Activities,
      },
      {
        path: "/settings",
        Component: Settings,
      },
    ],
  },
]);
