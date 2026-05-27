import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import {
  LayoutDashboard,
  Users,
  Database,
  Activity,
  Cpu,
  Bell,
  Search,
  LogOut,
  Brain,
  ArrowLeft,
  User,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "User Management", icon: Users },
  { to: "/admin/classifications", label: "Classifications", icon: Database },
  { to: "/admin/logs", label: "Activity Logs", icon: Activity },
  { to: "/admin/models", label: "Model Management", icon: Cpu },
];

interface NotificationLog {
  id: number;
  activity: string;
  description: string;
  created_at: string;
  users?: { fullname: string } | null;
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchRecentLogs = async (isInitial = false) => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*, users(fullname)")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setNotifications(data || []);
      
      if (isInitial) {
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchRecentLogs(true);

    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs" },
        () => {
          fetchRecentLogs();
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleOpenNotifications = (open: boolean) => {
    if (open) {
      setUnreadCount(0);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-base font-bold leading-tight">NeuroScan</div>
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Admin Console</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full flex items-center justify-start gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl lg:px-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search users, scans, models…" className="h-9 pl-9" />
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Dropdown */}
            <DropdownMenu onOpenChange={handleOpenNotifications}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <span className="font-display text-sm font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="p-3 text-xs hover:bg-muted/40 transition-colors">
                        <div className="flex justify-between font-medium">
                          <span className="truncate max-w-[180px]">
                            {notif.users?.fullname || "System"}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="mt-1 font-semibold text-foreground/90">
                          {notif.activity}
                        </div>
                        <div className="mt-0.5 text-muted-foreground break-words">
                          {notif.description}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuItem
                  className="w-full justify-center text-xs text-primary font-medium py-2.5 cursor-pointer focus:bg-muted/50"
                  onClick={() => navigate("/admin/logs")}
                >
                  View all logs
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.profile_image || undefined} className="object-cover" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {profile?.fullname?.substring(0, 2).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <div className="text-sm font-semibold leading-none">{profile?.fullname || "Admin"}</div>
                    <Badge variant="secondary" className="mt-1 h-4 px-1.5 text-[10px]">Super Admin</Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Admin</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/profile")}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

