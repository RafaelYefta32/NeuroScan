import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileScan, Cpu, TrendingUp, Activity, Loader2 } from "lucide-react";
import { formatDistanceToNow, subDays, format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    classifications: 0,
    activeModel: "None",
    avgConfidence: 0,
  });
  const [series, setSeries] = useState<{ d: string; scans: number }[]>([]);
  const [distribution, setDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Users Count
        const { count: usersCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });

        // 2. Fetch Classifications Count & Avg Confidence
        const { data: classData } = await supabase
          .from("classification_results")
          .select("confidence_score, predicted_class, created_at");

        const totalScans = classData?.length || 0;
        let avgConf = 0;
        if (totalScans > 0) {
          avgConf = classData!.reduce((acc, curr) => acc + curr.confidence_score, 0) / totalScans;
        }

        // 3. Fetch Active Model
        const { data: modelData } = await supabase
          .from("models")
          .select("version, model_name")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        setStats({
          users: usersCount || 0,
          classifications: totalScans,
          activeModel: modelData ? `${modelData.model_name} (${modelData.version})` : "None",
          avgConfidence: avgConf,
        });

        // 4. Calculate Distribution
        if (classData) {
          const distMap: Record<string, number> = {
            "Glioma": 0,
            "Meningioma": 0,
            "Pituitary": 0,
            "No Tumor": 0,
          };
          classData.forEach((c) => {
            const cls = c.predicted_class === "No_Tumor" ? "No Tumor" : c.predicted_class;
            if (distMap[cls] !== undefined) distMap[cls]++;
            else distMap[cls] = 1;
          });

          setDistribution([
            { name: "Glioma", value: distMap["Glioma"] || 0, color: "hsl(var(--destructive))" },
            { name: "Meningioma", value: distMap["Meningioma"] || 0, color: "hsl(var(--primary-glow))" },
            { name: "Pituitary", value: distMap["Pituitary"] || 0, color: "hsl(var(--warning))" },
            { name: "No tumor", value: distMap["No Tumor"] || 0, color: "hsl(var(--success))" },
          ].filter(d => d.value > 0)); // Only show if value > 0

          // 5. Calculate Last 7 Days Series
          const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = subDays(new Date(), 6 - i);
            return {
              dateStr: format(d, "yyyy-MM-dd"),
              label: format(d, "EEE"),
              scans: 0
            };
          });

          classData.forEach(c => {
            const dateStr = c.created_at.split('T')[0];
            const dayObj = last7Days.find(d => d.dateStr === dateStr);
            if (dayObj) dayObj.scans++;
          });

          setSeries(last7Days.map(d => ({ d: d.label, scans: d.scans })));
        }

        // 6. Fetch Recent Activity
        const { data: logsData } = await supabase
          .from("activity_logs")
          .select("*, users(fullname)")
          .order("created_at", { ascending: false })
          .limit(5);
        
        setRecentLogs(logsData || []);

      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.users.toString(), delta: "Live", icon: Users },
    { label: "Total Classifications", value: stats.classifications.toString(), delta: "Live", icon: FileScan },
    { label: "Active Model", value: stats.activeModel, delta: "Production", icon: Cpu },
    { label: "Avg. Confidence", value: `${(stats.avgConfidence * 100).toFixed(1)}%`, delta: "Live", icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of platform usage and model performance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                <div className="mt-2 font-display text-2xl font-bold">{s.value}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <s.icon className="h-5 w-5" />
              </div>
            </div>
            <Badge variant="secondary" className="mt-4 bg-success/10 text-success">{s.delta}</Badge>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Classifications this week</h2>
            <Badge variant="outline">Last 7 days</Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-display text-base font-semibold">Class distribution</h2>
          {distribution.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {distribution.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Legend iconType="circle" />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base font-semibold">Recent activity</h2>
        </div>
        {recentLogs.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">No recent activity</div>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-3">
                <span>
                  <span className="font-medium">{log.users?.fullname || "System"}</span>{" "}
                  <span className="text-muted-foreground">{log.activity} - {log.description}</span>
                </span>
                <span className="text-xs text-muted-foreground shrink-0 ml-4">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
