import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import Index from "./pages/Index";
import EnrollmentPage from "./pages/EnrollmentPage";
import StudentPortal from "./pages/StudentPortal";
import InstructorPortal from "./pages/InstructorPortal";
import AdminPortal from "./pages/AdminPortal";
import CourseDetails from "./pages/CourseDetails";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "./components/ProtectedRoute";
import Navigation from "./components/Navigation";

// If your Dashboard has AuthComponent inside, you can use it as a Login page:
import Dashboard from "./components/Dashboard"; // (the file you pasted)

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await fetchProfile(u.id);
      else setProfile(null);
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await fetchProfile(u.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("user_profiles_2025_11_15_16_09")
      .select("*")
      .eq("user_id", userId)
      .single();

    setProfile(data ?? null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Navigation user={user} profile={profile} />
      <Routes>
        {/* If logged in, go to dashboard; else show public home */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Index />} />

        <Route path="/enrollment" element={<EnrollmentPage />} />

        {/* Login page (your Dashboard component already shows AuthComponent when not logged in) */}
        <Route path="/login" element={<Dashboard />} />

        <Route
          path="/dashboard"
          element={
            user ? (
              profile?.role === "admin" ? <Navigate to="/admin" /> :
              profile?.role === "instructor" ? <Navigate to="/instructor" /> :
              <Navigate to="/student" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute user={user} profile={profile} allowedRoles={["student"]}>
              <StudentPortal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor"
          element={
            <ProtectedRoute user={user} profile={profile} allowedRoles={["instructor"]}>
              <InstructorPortal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} profile={profile} allowedRoles={["admin"]}>
              <AdminPortal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/course/:id"
          element={
            <ProtectedRoute user={user} profile={profile} allowedRoles={["student", "instructor", "admin"]}>
              <CourseDetails />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
