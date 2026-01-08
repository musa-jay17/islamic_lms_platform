// src/pages/AdminPortal.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import {
  Users,
  BookOpen,
  GraduationCap,
  UserCheck,
  Plus,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  ShieldAlert,
  Search,
  SlidersHorizontal,
} from "lucide-react";

/** =========================
 *  TABLE NAMES (your schema)
 *  ========================= */
const T_USERS = "user_profiles_2025_11_15_16_09";
const T_COURSES = "courses_2025_11_15_16_09";
const T_ENROLL = "course_enrollments_2025_11_15_16_09";
const T_ANN = "announcements_2025_11_15_16_09";
const T_ASSIGN = "assignments_2025_11_15_16_09";
const T_ACAD = "academic_records_2025_11_15_16_09";
const T_APPS = "enrollment_applications_2025_11_15_16_09";

/** =========================
 *  Helpers
 *  ========================= */
function safeDate(value: any) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function normalize(str: any) {
  return (str || "").toString().toLowerCase().trim();
}

function matchesSearch(obj: any, q: string) {
  if (!q) return true;
  const query = normalize(q);
  const hay = JSON.stringify(obj ?? {}).toLowerCase();
  return hay.includes(query);
}

function downloadCSV(rows: any[], filename = "export.csv") {
  try {
    if (!rows || rows.length === 0) {
      toast.info("Nothing to export.");
      return;
    }

    const allKeys = Array.from(
      rows.reduce((set, r) => {
        Object.keys(r || {}).forEach((k) => set.add(k));
        return set;
      }, new Set<string>())
    );

    const escape = (v: any) => {
      const s = v === null || v === undefined ? "" : String(v);
      if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const header = allKeys.map(escape).join(",");
    const body = rows
      .map((r) => allKeys.map((k) => escape((r as Record<string, unknown>)?.[k as string])).join(","))
      .join("\n");

    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    toast.error("Export failed.");
  }
}

function explainSupabaseError(err: any) {
  const msg = err?.message || err?.hint || err?.details || "Unknown error";
  // Common RLS error signatures:
  const lower = String(msg).toLowerCase();
  if (lower.includes("row-level security") || lower.includes("rls") || err?.code === "42501") {
    return "Blocked by Row Level Security (RLS). Your admin user can SELECT but cannot INSERT/UPDATE/DELETE. Fix policies in Supabase for these tables.";
  }
  if (lower.includes("permission denied")) {
    return "Permission denied. Check your Postgres grants/RLS policies.";
  }
  return msg;
}

/** =========================
 *  Admin Portal
 *  ========================= */
export default function AdminPortal() {
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(false);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const [me, setMe] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<any>(null);

  // Data
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [academicRecords, setAcademicRecords] = useState<any[]>([]);

  // Applications
  const [applications, setApplications] = useState<any[]>([]);
  const [appStatusFilter, setAppStatusFilter] = useState("pending");

  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [assignCourseId, setAssignCourseId] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");

  // Filters / Search
  const [globalSearch, setGlobalSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [courseLevelFilter, setCourseLevelFilter] = useState("all");
  const [courseStatusFilter, setCourseStatusFilter] = useState("all");
  const [enrollStatusFilter, setEnrollStatusFilter] = useState("all");
  const [annAudienceFilter, setAnnAudienceFilter] = useState("all");

  // Dialogs + Forms
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    category: "",
    level: "beginner",
    duration_weeks: 12,
    credits: 3,
    prerequisites: "",
    learning_objectives: "",
    status: "active",
  });

  const [annDialogOpen, setAnnDialogOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<any>(null);
  const [annForm, setAnnForm] = useState({
    title: "",
    content: "",
    target_audience: "all",
  });

  const [enrollEditOpen, setEnrollEditOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<any>(null);
  const [enrollForm, setEnrollForm] = useState({
    status: "active",
    progress_percentage: 0,
  });

  /** =========================
   *  Boot
   *  ========================= */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadMeAndGuard();
        await fetchAll();
      } catch (e) {
        console.error(e);
        toast.error("Failed to initialize admin portal.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ REALTIME: keep admin lists updated without manual refresh
  useEffect(() => {
    // If you’re not logged in yet, don’t subscribe
    if (!me) return;

    const channel = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: T_APPS },
        (payload: any) => {
          // keep applications in sync
          const { eventType, new: newRow, old } = payload;
          setApplications((prev) => {
            const list = [...prev];
            if (eventType === "INSERT") return [newRow, ...list];
            if (eventType === "UPDATE") return list.map((r) => (r.id === newRow.id ? newRow : r));
            if (eventType === "DELETE") return list.filter((r) => r.id !== old?.id);
            return list;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: T_ANN },
        (payload: any) => {
          const { eventType, new: newRow, old } = payload;
          setAnnouncements((prev) => {
            const list = [...prev];
            if (eventType === "INSERT") return [newRow, ...list];
            if (eventType === "UPDATE") return list.map((r) => (r.id === newRow.id ? newRow : r));
            if (eventType === "DELETE") return list.filter((r) => r.id !== old?.id);
            return list;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: T_COURSES },
        (payload: any) => {
          const { eventType, new: newRow, old } = payload;
          setCourses((prev) => {
            const list = [...prev];
            if (eventType === "INSERT") return [newRow, ...list];
            if (eventType === "UPDATE") return list.map((r) => (r.id === newRow.id ? newRow : r));
            if (eventType === "DELETE") return list.filter((r) => r.id !== old?.id);
            return list;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: T_ENROLL },
        () => {
          // enrollments include joins, easiest is refetch
          fetchEnrollments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  async function loadMeAndGuard() {
    const { data } = await supabase.auth.getUser();
    const u = data?.user || null;
    setMe(u);

    if (!u) {
      setMyProfile(null);
      return;
    }

    const { data: profile, error } = await supabase.from(T_USERS).select("*").eq("user_id", u.id).maybeSingle();

    if (error) {
      console.error(error);
      toast.error(`Failed to load your profile: ${explainSupabaseError(error)}`);
      setMyProfile(null);
      return;
    }

    setMyProfile(profile || null);
  }

  async function fetchAll() {
    await Promise.all([
      fetchUsers(),
      fetchCourses(),
      fetchEnrollments(),
      fetchApplications(),
      fetchAnnouncements(),
      fetchAssignments(),
      fetchAcademicRecords(),
    ]);
    setLastSync(new Date());
  }

  async function handleRefresh() {
    setBusyAction(true);
    try {
      await fetchAll();
      toast.success("Data refreshed.");
    } catch (e) {
      console.error(e);
      toast.error("Refresh failed.");
    } finally {
      setBusyAction(false);
    }
  }

  /** =========================
   *  Fetchers (with 400-safe ordering)
   *  ========================= */
  async function fetchUsers() {
    const first = await supabase.from(T_USERS).select("*").order("created_at", { ascending: false });
    if (!first.error) {
      setUsers(first.data || []);
      return;
    }
    console.error(first.error);
    const second = await supabase.from(T_USERS).select("*");
    if (second.error) {
      console.error(second.error);
      toast.error(`Failed to load users: ${explainSupabaseError(second.error)}`);
      return;
    }
    setUsers(second.data || []);
  }

  async function fetchCourses() {
    const first = await supabase.from(T_COURSES).select("*").order("created_at", { ascending: false });
    if (!first.error) {
      setCourses(first.data || []);
      return;
    }
    console.error(first.error);
    const second = await supabase.from(T_COURSES).select("*");
    if (second.error) {
      console.error(second.error);
      toast.error(`Failed to load courses: ${explainSupabaseError(second.error)}`);
      return;
    }
    setCourses(second.data || []);
  }

  async function fetchEnrollments() {
    const q = supabase
      .from(T_ENROLL)
      .select(
        `
        *,
        ${T_USERS} (full_name, student_id, email),
        ${T_COURSES} (title, level, category)
      `
      );

    const first = await q.order("enrollment_date", { ascending: false });
    if (!first.error) {
      setEnrollments(first.data || []);
      return;
    }
    console.error(first.error);
    const second = await supabase
      .from(T_ENROLL)
      .select(
        `
        *,
        ${T_USERS} (full_name, student_id, email),
        ${T_COURSES} (title, level, category)
      `
      );
    if (second.error) {
      console.error(second.error);
      toast.error(`Failed to load enrollments: ${explainSupabaseError(second.error)}`);
      return;
    }
    setEnrollments(second.data || []);
  }

  async function fetchApplications() {
    const first = await supabase.from(T_APPS).select("*").order("created_at", { ascending: false });

    if (!first.error) {
      setApplications(first.data || []);
      return;
    }

    // created_at might not exist => 400
    console.error(first.error);

    const second = await supabase.from(T_APPS).select("*");
    if (second.error) {
      console.error(second.error);
      toast.error(`Failed to load enrollment applications: ${explainSupabaseError(second.error)}`);
      return;
    }

    setApplications(second.data || []);
  }

  async function fetchAnnouncements() {
    const first = await supabase.from(T_ANN).select("*").order("publish_date", { ascending: false });
    if (!first.error) {
      setAnnouncements(first.data || []);
      return;
    }
    console.error(first.error);
    const second = await supabase.from(T_ANN).select("*");
    if (second.error) {
      console.error(second.error);
      toast.error(`Failed to load announcements: ${explainSupabaseError(second.error)}`);
      return;
    }
    setAnnouncements(second.data || []);
  }

  async function fetchAssignments() {
    const first = await supabase.from(T_ASSIGN).select(`*, ${T_COURSES} (title)`).order("created_at", { ascending: false });
    if (!first.error) {
      setAssignments(first.data || []);
      return;
    }
    console.error(first.error);
    const second = await supabase.from(T_ASSIGN).select(`*, ${T_COURSES} (title)`);
    if (second.error) {
      console.error(second.error);
      return;
    }
    setAssignments(second.data || []);
  }

  async function fetchAcademicRecords() {
    const first = await supabase
      .from(T_ACAD)
      .select(`*, ${T_USERS} (full_name, student_id), ${T_COURSES} (title, credits)`)
      .order("created_at", { ascending: false });

    if (!first.error) {
      setAcademicRecords(first.data || []);
      return;
    }

    console.error(first.error);
    const second = await supabase
      .from(T_ACAD)
      .select(`*, ${T_USERS} (full_name, student_id), ${T_COURSES} (title, credits)`);
    if (second.error) {
      console.error(second.error);
      return;
    }
    setAcademicRecords(second.data || []);
  }

  /** =========================
   *  Derived (filters)
   *  ========================= */
  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (userRoleFilter !== "all") list = list.filter((u) => u.role === userRoleFilter);
    if (globalSearch) list = list.filter((u) => matchesSearch(u, globalSearch));
    return list;
  }, [users, userRoleFilter, globalSearch]);

  const filteredCourses = useMemo(() => {
    let list = [...courses];
    if (courseLevelFilter !== "all") list = list.filter((c) => c.level === courseLevelFilter);
    if (courseStatusFilter !== "all") list = list.filter((c) => c.status === courseStatusFilter);
    if (globalSearch) list = list.filter((c) => matchesSearch(c, globalSearch));
    return list;
  }, [courses, courseLevelFilter, courseStatusFilter, globalSearch]);

  const filteredEnrollments = useMemo(() => {
    let list = [...enrollments];
    if (enrollStatusFilter !== "all") list = list.filter((e) => e.status === enrollStatusFilter);
    if (globalSearch) list = list.filter((e) => matchesSearch(e, globalSearch));
    return list;
  }, [enrollments, enrollStatusFilter, globalSearch]);

  const filteredAnnouncements = useMemo(() => {
    let list = [...announcements];
    if (annAudienceFilter !== "all") list = list.filter((a) => a.target_audience === annAudienceFilter);
    if (globalSearch) list = list.filter((a) => matchesSearch(a, globalSearch));
    return list;
  }, [announcements, annAudienceFilter, globalSearch]);

  const filteredApplications = useMemo(() => {
    let list = [...applications];
    if (appStatusFilter !== "all") list = list.filter((a) => a.status === appStatusFilter);
    if (globalSearch) list = list.filter((a) => matchesSearch(a, globalSearch));
    return list;
  }, [applications, appStatusFilter, globalSearch]);

  /** =========================
   *  Stats
   *  ========================= */
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalStudents = users.filter((u) => u.role === "student").length;
    const totalInstructors = users.filter((u) => u.role === "instructor").length;

    const totalCourses = courses.length;
    const activeCourses = courses.filter((c) => c.status === "active").length;

    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter((e) => e.status === "active").length;

    return {
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      activeCourses,
      totalEnrollments,
      activeEnrollments,
    };
  }, [users, courses, enrollments]);

  /** =========================
   *  Actions - Users
   *  ========================= */
  async function updateUserRole(userId: string, newRole: string) {
    setBusyAction(true);
    try {
      const { data, error } = await supabase.from(T_USERS).update({ role: newRole }).eq("user_id", userId).select("*").maybeSingle();
      if (error) throw error;

      // optimistic local update (no need to refetch)
      if (data) setUsers((prev) => prev.map((u) => (u.user_id === userId ? data : u)));

      toast.success("User role updated.");
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to update role: ${explainSupabaseError(e)}`);
    } finally {
      setBusyAction(false);
    }
  }

  /** =========================
   *  Actions - Courses (CRUD)
   *  ========================= */
  function openCreateCourse() {
    setEditingCourse(null);
    setCourseForm({
      title: "",
      description: "",
      category: "",
      level: "beginner",
      duration_weeks: 12,
      credits: 3,
      prerequisites: "",
      learning_objectives: "",
      status: "active",
    });
    setCourseDialogOpen(true);
  }

  function openEditCourse(course: any) {
    setEditingCourse(course);
    setCourseForm({
      title: course?.title || "",
      description: course?.description || "",
      category: course?.category || "",
      level: course?.level || "beginner",
      duration_weeks: Number(course?.duration_weeks || 12),
      credits: Number(course?.credits || 3),
      prerequisites: course?.prerequisites || "",
      learning_objectives: course?.learning_objectives || "",
      status: course?.status || "active",
    });
    setCourseDialogOpen(true);
  }

  async function saveCourse() {
    if (!courseForm.title?.trim()) return toast.error("Course title is required.");
    if (!courseForm.category?.trim()) return toast.error("Course category is required.");

    setBusyAction(true);
    try {
      const { data: udata } = await supabase.auth.getUser();
      const instructor_id = udata?.user?.id || null;

      if (editingCourse?.id) {
        const { data, error } = await supabase.from(T_COURSES).update({ ...courseForm }).eq("id", editingCourse.id).select("*").single();
        if (error) throw error;

        setCourses((prev) => prev.map((c) => (c.id === data.id ? data : c)));
        toast.success("Course updated.");
      } else {
        const { data, error } = await supabase.from(T_COURSES).insert([{ ...courseForm, instructor_id }]).select("*").single();
        if (error) throw error;

        setCourses((prev) => [data, ...prev]);
        toast.success("Course created.");
      }

      setCourseDialogOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to save course: ${explainSupabaseError(e)}`);
    } finally {
      setBusyAction(false);
    }
  }

  async function toggleCourseStatus(course: any) {
    setBusyAction(true);
    try {
      const newStatus = course?.status === "active" ? "inactive" : "active";
      const { data, error } = await supabase.from(T_COURSES).update({ status: newStatus }).eq("id", course.id).select("*").single();
      if (error) throw error;

      setCourses((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      toast.success(`Course set to ${newStatus}.`);
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to update course status: ${explainSupabaseError(e)}`);
    } finally {
      setBusyAction(false);
    }
  }

  async function deleteCourse(course: any) {
    const ok = window.confirm(`Delete course: "${course.title}"?\n\nThis cannot be undone.`);
    if (!ok) return;

    setBusyAction(true);
    try {
      const { error } = await supabase.from(T_COURSES).delete().eq("id", course.id);
      if (error) throw error;

      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      toast.success("Course deleted.");
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to delete course: ${explainSupabaseError(e)}`);
    } finally {
      setBusyAction(false);
    }
  }

  /** =========================
   *  Actions - Announcements (CRUD)
   *  ========================= */
  function openCreateAnnouncement() {
    setEditingAnn(null);
    setAnnForm({ title: "", content: "", target_audience: "all" });
    setAnnDialogOpen(true);
  }

  function openEditAnnouncement(ann: any) {
    setEditingAnn(ann);
    setAnnForm({
      title: ann?.title || "",
      content: ann?.content || "",
      target_audience: ann?.target_audience || "all",
    });
    setAnnDialogOpen(true);
  }

  async function saveAnnouncement() {
    if (!annForm.title?.trim()) return toast.error("Announcement title is required.");
    if (!annForm.content?.trim()) return toast.error("Announcement content is required.");

    setBusyAction(true);
    try {
      const { data: udata } = await supabase.auth.getUser();
      const author_id = udata?.user?.id || null;

      if (editingAnn?.id) {
        const { data, error } = await supabase.from(T_ANN).update({ ...annForm }).eq("id", editingAnn.id).select("*").single();
        if (error) throw error;

        setAnnouncements((prev) => prev.map((a) => (a.id === data.id ? data : a)));
        toast.success("Announcement updated.");
      } else {
        const row = { ...annForm, author_id, publish_date: new Date().toISOString() };
        const { data, error } = await supabase.from(T_ANN).insert([row]).select("*").single();
        if (error) throw error;

        setAnnouncements((prev) => [data, ...prev]);
        toast.success("Announcement published.");
      }

      setAnnDialogOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to save announcement: ${explainSupabaseError(e)}`);
    } finally {
      setBusyAction(false);
    }
  }

  async function deleteAnnouncement(ann: any) {
    const ok = window.confirm(`Delete announcement: "${ann.title}"?\n\nThis cannot be undone.`);
    if (!ok) return;

    setBusyAction(true);
    try {
      const { error } = await supabase.from(T_ANN).delete().eq("id", ann.id);
      if (error) throw error;

      setAnnouncements((prev) => prev.filter((a) => a.id !== ann.id));
      toast.success("Announcement deleted.");
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to delete announcement: ${explainSupabaseError(e)}`);
    } finally {
      setBusyAction(false);
    }
  }

  /** =========================
   *  Actions - Enrollments (Control)
   *  ========================= */
  function openEditEnrollment(enr: any) {
    setEditingEnrollment(enr);
    setEnrollForm({
      status: enr?.status || "active",
      progress_percentage: Number(enr?.progress_percentage || 0),
    });
    setEnrollEditOpen(true);
  }

  async function saveEnrollment() {
    if (!editingEnrollment?.id) return;

    const p = Number(enrollForm.progress_percentage);
    if (Number.isNaN(p) || p < 0 || p > 100) return toast.error("Progress must be between 0 and 100.");

    setBusyAction(true);
    try {
      const { error } = await supabase.from(T_ENROLL).update({ status: enrollForm.status, progress_percentage: p }).eq("id", editingEnrollment.id);
      if (error) throw error;

      toast.success("Enrollment updated.");
      setEnrollEditOpen(false);
      await fetchEnrollments(); // (joins)
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to update enrollment: ${explainSupabaseError(e)}`);
    } finally {
      setBusyAction(false);
    }
  }

  async function deleteEnrollment(enr: any) {
    const studentName = enr?.[T_USERS]?.full_name || "Student";
    const courseTitle = enr?.[T_COURSES]?.title || "Course";
    const ok = window.confirm(`Remove enrollment?\n\n${studentName} -> ${courseTitle}\n\nThis cannot be undone.`);
    if (!ok) return;

    setBusyAction(true);
    try {
      const { error } = await supabase.from(T_ENROLL).delete().eq("id", enr.id);
      if (error) throw error;

      toast.success("Enrollment removed.");
      await fetchEnrollments();
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to remove enrollment: ${explainSupabaseError(e)}`);
    } finally {
      setBusyAction(false);
    }
  }

  /** =========================
   *  Actions - Applications (Approve/Deny)
   *  ========================= */
  function openReviewApplication(app: any) {
    setSelectedApp(app);
    setAssignCourseId("");
    setAdminNotes(app?.admin_notes || "");
    setAppDialogOpen(true);
  }

  async function resolveApplicantUserId(app: any) {
    if (app?.user_id) return app.user_id;

    if (app?.email) {
      const { data, error } = await supabase.from(T_USERS).select("user_id").eq("email", app.email).maybeSingle();
      if (error) throw error;
      return data?.user_id || null;
    }
    return null;
  }

  async function approveApplication() {
    if (!selectedApp) return;
    if (!assignCourseId) return toast.error("Please assign a course before approving.");

    setBusyAction(true);
    try {
      const { data: udata } = await supabase.auth.getUser();
      const adminId = udata?.user?.id || null;

      const applicantUserId = await resolveApplicantUserId(selectedApp);
      if (!applicantUserId) {
        toast.error("Cannot approve: applicant user_id not found (missing user_id or no matching email).");
        return;
      }

      // 1) create enrollment
      const { error: enrollErr } = await supabase.from(T_ENROLL).insert([
        {
          user_id: applicantUserId,
          course_id: assignCourseId,
          status: "active",
          progress_percentage: 0,
          enrollment_date: new Date().toISOString(),
        },
      ]);
      if (enrollErr) throw enrollErr;

      // 2) update application status (return updated row so UI reflects instantly)
      const { data: updatedApp, error: appErr } = await supabase
        .from(T_APPS)
        .update({
          status: "approved",
          assigned_course_id: assignCourseId,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
        })
        .eq("id", selectedApp.id)
        .select("*")
        .single();

      if (appErr) throw appErr;

      // ✅ optimistic local update
      setApplications((prev) => prev.map((a) => (a.id === updatedApp.id ? updatedApp : a)));

      toast.success("Application approved and student enrolled.");
      setAppDialogOpen(false);
      setSelectedApp(null);
      setAssignCourseId("");
      setAdminNotes("");

      await fetchEnrollments(); // joins
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to approve application: ${explainSupabaseError(e)}`);
    } finally {
      setBusyAction(false);
    }
  }

  async function denyApplication() {
    if (!selectedApp) return;

    setBusyAction(true);
    try {
      const { data: udata } = await supabase.auth.getUser();
      const adminId = udata?.user?.id || null;

      const { data: updatedApp, error } = await supabase
        .from(T_APPS)
        .update({
          status: "denied",
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
        })
        .eq("id", selectedApp.id)
        .select("*")
        .single();

      if (error) throw error;

      setApplications((prev) => prev.map((a) => (a.id === updatedApp.id ? updatedApp : a)));

      toast.success("Application denied.");
      setAppDialogOpen(false);
      setSelectedApp(null);
      setAssignCourseId("");
      setAdminNotes("");
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to deny application: ${explainSupabaseError(e)}`);
    } finally {
      setBusyAction(false);
    }
  }

  /** =========================
   *  UI Guards
   *  ========================= */
  const isAdmin = myProfile?.role === "admin";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin portal…</p>
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Authentication Required
            </CardTitle>
            <CardDescription>Please sign in to access the admin portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">You are not logged in. Go to your login page and sign in as an admin user.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Access Denied
            </CardTitle>
            <CardDescription>This account is not an admin.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Your role is: <b>{myProfile?.role || "unknown"}</b>. Change it in the database (or sign in with an admin user).
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /** =========================
   *  Render
   *  ========================= */
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Command Center</h1>
            <p className="text-gray-600">Full control over users, courses, enrollments, applications, and announcements.</p>
            <div className="mt-3">
              <span className="arabic-text text-xl text-green-700">وَقُل رَّبِّ زِدْنِي عِلْمًا</span>
              <p className="text-xs text-gray-500 mt-1">Quran 20:114</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                className="pl-9 w-full sm:w-80"
                placeholder="Search across everything…"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>

            <Button variant="outline" onClick={handleRefresh} disabled={busyAction}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Last sync: <b>{lastSync ? lastSync.toLocaleString() : "—"}</b>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Students: {stats.totalStudents} • Instructors: {stats.totalInstructors}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Courses</p>
                    <p className="text-2xl font-bold">{stats.totalCourses}</p>
                    <p className="text-xs text-gray-500 mt-1">Active: {stats.activeCourses}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-green-600" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Enrollments</p>
                    <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
                    <p className="text-xs text-gray-500 mt-1">Active: {stats.activeEnrollments}</p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-purple-600" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Students</p>
                    <p className="text-2xl font-bold">{stats.totalStudents}</p>
                    <p className="text-xs text-gray-500 mt-1">Community growth tracked</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-orange-600" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Roles, students, instructors, admins</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => downloadCSV(filteredUsers, "users.csv")} disabled={busyAction}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <SlidersHorizontal className="h-4 w-4" />
                    Role:
                  </div>
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger className="w-full md:w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500 md:ml-auto">
                    Showing <b>{filteredUsers.length}</b> users
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell>{u.email || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === "admin" ? "default" : u.role === "instructor" ? "secondary" : "outline"}>
                            {u.role || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.student_id || "—"}</TableCell>
                        <TableCell>{safeDate(u.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Select value={u.role || "student"} onValueChange={(r) => updateUserRole(u.user_id, r)}>
                            <SelectTrigger className="w-36 ml-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="instructor">Instructor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-8">
                          No users match your filters/search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses */}
          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Course Control</CardTitle>
                    <CardDescription>Create, edit, activate/deactivate, delete</CardDescription>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => downloadCSV(filteredCourses, "courses.csv")} disabled={busyAction}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>

                    <Button onClick={openCreateCourse} disabled={busyAction}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Course
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">Level</Label>
                    <Select value={courseLevelFilter} onValueChange={setCourseLevelFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <Select value={courseStatusFilter} onValueChange={setCourseStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <div className="text-xs text-gray-500">
                      Showing <b>{filteredCourses.length}</b> courses
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {filteredCourses.map((c) => (
                  <Card key={c.id} className="border">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="truncate">{c.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{c.description}</CardDescription>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="secondary">{(c.category || "—").toString().toUpperCase()}</Badge>
                            <Badge variant="outline">{c.level || "—"}</Badge>
                            <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status || "—"}</Badge>
                          </div>
                        </div>

                        <div className="flex gap-2 md:justify-end">
                          <Button variant="outline" size="sm" onClick={() => openEditCourse(c)} disabled={busyAction}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => toggleCourseStatus(c)} disabled={busyAction}>
                            {c.status === "active" ? "Deactivate" : "Activate"}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteCourse(c)} disabled={busyAction}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">Duration</div>
                        <div className="font-medium">{c.duration_weeks ?? "—"} weeks</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Credits</div>
                        <div className="font-medium">{c.credits ?? "—"}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500">Learning Objectives</div>
                        <div className="text-gray-700 line-clamp-2">{c.learning_objectives || "—"}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredCourses.length === 0 && (
                  <div className="text-center text-sm text-gray-500 py-10">No courses match your filters/search.</div>
                )}
              </CardContent>
            </Card>

            {/* Course Dialog */}
            <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingCourse ? "Edit Course" : "Create Course"}</DialogTitle>
                  <DialogDescription>Build courses that are structured, searchable, and controlled.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={courseForm.title} onChange={(e) => setCourseForm((p) => ({ ...p, title: e.target.value }))} />
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Select value={courseForm.category} onValueChange={(v) => setCourseForm((p) => ({ ...p, category: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quran">Quranic Studies</SelectItem>
                        <SelectItem value="arabic">Arabic Language</SelectItem>
                        <SelectItem value="fiqh">Fiqh</SelectItem>
                        <SelectItem value="hadith">Hadith</SelectItem>
                        <SelectItem value="aqeedah">Aqeedah</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                        <SelectItem value="tarbiyah">Tarbiyah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      rows={3}
                      value={courseForm.description}
                      onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Level</Label>
                    <Select value={courseForm.level} onValueChange={(v) => setCourseForm((p) => ({ ...p, level: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select value={courseForm.status} onValueChange={(v) => setCourseForm((p) => ({ ...p, status: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Duration (weeks)</Label>
                    <Input
                      type="number"
                      value={courseForm.duration_weeks}
                      onChange={(e) => setCourseForm((p) => ({ ...p, duration_weeks: Number(e.target.value || 0) }))}
                    />
                  </div>

                  <div>
                    <Label>Credits</Label>
                    <Input
                      type="number"
                      value={courseForm.credits}
                      onChange={(e) => setCourseForm((p) => ({ ...p, credits: Number(e.target.value || 0) }))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Prerequisites</Label>
                    <Textarea rows={2} value={courseForm.prerequisites} onChange={(e) => setCourseForm((p) => ({ ...p, prerequisites: e.target.value }))} />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Learning Objectives</Label>
                    <Textarea
                      rows={3}
                      value={courseForm.learning_objectives}
                      onChange={(e) => setCourseForm((p) => ({ ...p, learning_objectives: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setCourseDialogOpen(false)} disabled={busyAction}>
                    Cancel
                  </Button>
                  <Button onClick={saveCourse} disabled={busyAction}>
                    {busyAction ? "Saving…" : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Enrollments */}
          <TabsContent value="enrollments" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Enrollment Control</CardTitle>
                    <CardDescription>Pause, complete, track progress</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => downloadCSV(filteredEnrollments, "enrollments.csv")} disabled={busyAction}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Status:
                  </div>
                  <Select value={enrollStatusFilter} onValueChange={setEnrollStatusFilter}>
                    <SelectTrigger className="w-full md:w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="text-xs text-gray-500 md:ml-auto">
                    Showing <b>{filteredEnrollments.length}</b> enrollments
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrollments.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{e?.[T_USERS]?.full_name || "—"}</p>
                            <p className="text-xs text-gray-500 truncate">{e?.[T_USERS]?.student_id || e?.[T_USERS]?.email || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{e?.[T_COURSES]?.title || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{e?.[T_COURSES]?.level || "—"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status || "—"}</Badge>
                        </TableCell>
                        <TableCell>{Number(e.progress_percentage || 0)}%</TableCell>
                        <TableCell>{safeDate(e.enrollment_date)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => openEditEnrollment(e)} disabled={busyAction}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteEnrollment(e)} disabled={busyAction}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredEnrollments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-8">
                          No enrollments match your filters/search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Enrollment Edit Dialog */}
            <Dialog open={enrollEditOpen} onOpenChange={setEnrollEditOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Enrollment</DialogTitle>
                  <DialogDescription>Update status and progress for accurate tracking.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={enrollForm.status} onValueChange={(v) => setEnrollForm((p) => ({ ...p, status: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Progress (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={enrollForm.progress_percentage}
                      onChange={(e) => setEnrollForm((p) => ({ ...p, progress_percentage: Number(e.target.value || 0) }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">0 = just started, 100 = completed</p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEnrollEditOpen(false)} disabled={busyAction}>
                      Cancel
                    </Button>
                    <Button onClick={saveEnrollment} disabled={busyAction}>
                      {busyAction ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Applications */}
          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Enrollment Applications</CardTitle>
                    <CardDescription>Approve or deny student enrollment requests (level-only).</CardDescription>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => downloadCSV(applications, "applications.csv")} disabled={busyAction}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <div className="text-sm text-gray-600 flex items-center gap-2">Status:</div>

                  <Select value={appStatusFilter} onValueChange={setAppStatusFilter}>
                    <SelectTrigger className="w-full md:w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="denied">Denied</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="text-xs text-gray-500 md:ml-auto">
                    Showing <b>{filteredApplications.length}</b> applications
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredApplications.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.full_name || "—"}</TableCell>
                        <TableCell>{a.email || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{a.requested_level || "—"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={a.status === "pending" ? "secondary" : a.status === "approved" ? "default" : "destructive"}>
                            {a.status || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>{safeDate(a.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openReviewApplication(a)} disabled={busyAction}>
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {filteredApplications.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-8">
                          No applications found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Review Dialog */}
            <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Review Application</DialogTitle>
                  <DialogDescription>Approve by assigning a course (must match the student’s requested level).</DialogDescription>
                </DialogHeader>

                {selectedApp && (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-3 text-sm">
                      <div className="flex flex-wrap gap-2 items-center justify-between">
                        <div>
                          <div className="font-medium">{selectedApp.full_name || "—"}</div>
                          <div className="text-gray-500">{selectedApp.email || "—"}</div>
                        </div>
                        <Badge variant="outline">{selectedApp.requested_level || "—"}</Badge>
                      </div>

                      <div className="mt-3">
                        <Label className="text-xs text-gray-500">Application Data (stored JSON)</Label>
                        <pre className="text-xs bg-slate-50 border rounded p-2 max-h-48 overflow-auto">
                          {JSON.stringify(selectedApp.application_data, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <Label>Assign Course (Filtered by Level)</Label>
                      <Select value={assignCourseId} onValueChange={setAssignCourseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course to assign" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses
                            .filter((c: any) => c.status === "active" && c.level === selectedApp.requested_level)
                            .map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.title} ({c.level})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      {courses.filter((c: any) => c.status === "active" && c.level === selectedApp.requested_level).length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">No active courses found for this level.</p>
                      )}
                    </div>

                    <div>
                      <Label>Admin Notes (optional)</Label>
                      <Textarea rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="destructive" onClick={denyApplication} disabled={busyAction}>
                        Deny
                      </Button>
                      <Button onClick={approveApplication} disabled={busyAction}>
                        Approve + Enroll
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Announcements */}
          <TabsContent value="announcements" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Announcements</CardTitle>
                    <CardDescription>Broadcast messages to students & instructors</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => downloadCSV(filteredAnnouncements, "announcements.csv")} disabled={busyAction}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button onClick={openCreateAnnouncement} disabled={busyAction}>
                      <Plus className="h-4 w-4 mr-2" />
                      New
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Audience:
                  </div>
                  <Select value={annAudienceFilter} onValueChange={setAnnAudienceFilter}>
                    <SelectTrigger className="w-full md:w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="students">Students</SelectItem>
                      <SelectItem value="instructors">Instructors</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="text-xs text-gray-500 md:ml-auto">
                    Showing <b>{filteredAnnouncements.length}</b> announcements
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid gap-4">
                {filteredAnnouncements.map((a) => (
                  <Card key={a.id} className="border">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="truncate">{a.title}</CardTitle>
                          <CardDescription>
                            {safeDate(a.publish_date)} • <Badge variant="secondary">{a.target_audience}</Badge>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditAnnouncement(a)} disabled={busyAction}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteAnnouncement(a)} disabled={busyAction}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{a.content}</p>
                    </CardContent>
                  </Card>
                ))}

                {filteredAnnouncements.length === 0 && (
                  <div className="text-center text-sm text-gray-500 py-10">No announcements match your filters/search.</div>
                )}
              </CardContent>
            </Card>

            {/* Announcement Dialog */}
            <Dialog open={annDialogOpen} onOpenChange={setAnnDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingAnn ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
                  <DialogDescription>Make communication official, clear, and targeted.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={annForm.title} onChange={(e) => setAnnForm((p) => ({ ...p, title: e.target.value }))} />
                  </div>

                  <div>
                    <Label>Audience</Label>
                    <Select value={annForm.target_audience} onValueChange={(v) => setAnnForm((p) => ({ ...p, target_audience: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="students">Students</SelectItem>
                        <SelectItem value="instructors">Instructors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Content</Label>
                    <Textarea rows={5} value={annForm.content} onChange={(e) => setAnnForm((p) => ({ ...p, content: e.target.value }))} />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setAnnDialogOpen(false)} disabled={busyAction}>
                      Cancel
                    </Button>
                    <Button onClick={saveAnnouncement} disabled={busyAction}>
                      {busyAction ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reports & Exports</CardTitle>
                <CardDescription>Download clean data to Excel/CSV for analysis and records</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Button variant="outline" onClick={() => downloadCSV(users, "users.csv")} disabled={busyAction}>
                  <Download className="h-4 w-4 mr-2" /> Users
                </Button>
                <Button variant="outline" onClick={() => downloadCSV(courses, "courses.csv")} disabled={busyAction}>
                  <Download className="h-4 w-4 mr-2" /> Courses
                </Button>
                <Button variant="outline" onClick={() => downloadCSV(enrollments, "enrollments.csv")} disabled={busyAction}>
                  <Download className="h-4 w-4 mr-2" /> Enrollments
                </Button>
                <Button variant="outline" onClick={() => downloadCSV(announcements, "announcements.csv")} disabled={busyAction}>
                  <Download className="h-4 w-4 mr-2" /> Announcements
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Academic Snapshot</CardTitle>
                <CardDescription>Current stored academic records (if you use that table)</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>
                  Records: <b>{academicRecords.length}</b> • Assignments: <b>{assignments.length}</b>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * IMPORTANT NOTE (why your approve/post “doesn’t update”):
 * If the UI can READ but cannot UPDATE/INSERT, that’s almost always Supabase RLS policies.
 * This file now surfaces the real error message and also uses realtime + optimistic updates
 * so changes reflect immediately when permissions allow.
 */
