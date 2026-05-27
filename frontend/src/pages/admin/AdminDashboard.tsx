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
  BarChart,
  Bar,
} from "recharts";

const CLASS_CONFIG: Record<string, { label: string; color: string }> = {
  glioma:     { label: "Glioma",     color: "hsl(0 72% 51%)" },
  meningioma: { label: "Meningioma", color: "hsl(262 83% 58%)" },
  pituitary:  { label: "Pituitary",  color: "hsl(38 92% 50%)" },
  notumor:    { label: "No Tumor",   color: "hsl(142 71% 45%)" },
};

const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value, percent } = payload[0].payload;
    return (
      <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-md">
        <div className="font-semibold">{name}</div>
        <div className="text-muted-foreground">
          {value} scan{value !== 1 ? "s" : ""} &middot;{" "}
          <span className="font-medium text-foreground">{percent}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value, percent } = payload[0].payload;
    return (
      <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-md">
        <div className="font-semibold">{name}</div>
        <div className="text-muted-foreground">
          {value} scan{value !== 1 ? "s" : ""} &middot;{" "}
          <span className="font-medium text-foreground">{percent}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    classifications: 0,
    activeModel: "None",
    avgConfidence: 0,
  });
  const [series, setSeries] = useState<{ d: string; scans: number }[]>([]);
  const [distribution, setDistribution] = useState<
    { name: string; value: number; color: string; percent: string }[]
  >([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { count: usersCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });

        const { data: classData } = await supabase
          .from("classification_results")
          .select("confidence_score, predicted_class, created_at");

        const totalScans = classData?.length || 0;
        let avgConf = 0;
        if (totalScans > 0) {
          avgConf =
            classData!.reduce((acc, curr) => acc + curr.confidence_score, 0) /
            totalScans;
        }

        const { data: modelData } = await supabase
          .from("models")
          .select("version, model_name")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        setStats({
          users: usersCount || 0,
          classifications: totalScans,
          activeModel: modelData
            ? `${modelData.model_name} (${modelData.version})`
            : "None",
          avgConfidence: avgConf,
        });

        if (classData) {
          const distCount: Record<string, number> = {
            glioma: 0,
            meningioma: 0,
            pituitary: 0,
            notumor: 0,
          };

          classData.forEach((c) => {
            const raw = (c.predicted_class || "")
              .toLowerCase()
              .replace(/[^a-z]/g, "");
            const key = raw === "notumor" || raw === "notumour" ? "notumor" : raw;
            if (key in distCount) {
              distCount[key]++;
            }
          });

          const distArr = Object.entries(distCount)
            .map(([key, count]) => ({
              name: CLASS_CONFIG[key]?.label ?? key,
              value: count,
              color: CLASS_CONFIG[key]?.color ?? "hsl(var(--primary))",
              percent:
                totalScans > 0
                  ? ((count / totalScans) * 100).toFixed(1)
                  : "0.0",
            }))
            .filter((d) => d.value > 0);

          setDistribution(distArr);

          const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = subDays(new Date(), 6 - i);
            return {
              dateStr: format(d, "yyyy-MM-dd"),
              label: format(d, "EEE"),
              scans: 0,
            };
          });

          classData.forEach((c) => {
            const dateStr = c.created_at.split("T")[0];
            const dayObj = last7Days.find((d) => d.dateStr === dateStr);
            if (dayObj) dayObj.scans++;
          });

          setSeries(last7Days.map((d) => ({ d: d.label, scans: d.scans })));
        }

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
    { label: "Total Users",         value: stats.users.toString(),                        delta: "Live",       icon: Users },
    { label: "Total Classifications", value: stats.classifications.toString(),             delta: "Live",       icon: FileScan },
    { label: "Active Model",         value: stats.activeModel,                             delta: "Production", icon: Cpu },
    { label: "Avg. Confidence",      value: `${(stats.avgConfidence * 100).toFixed(1)}%`, delta: "Live",       icon: TrendingUp },
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
        <p className="text-sm text-muted-foreground">
          Overview of platform usage and model performance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
                <div className="mt-2 font-display text-2xl font-bold">{s.value}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <s.icon className="h-5 w-5" />
              </div>
            </div>
            <Badge variant="secondary" className="mt-4 bg-success/10 text-success">
              {s.delta}
            </Badge>
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
                  <stop offset="0%"   stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
              <Area
                type="monotone"
                dataKey="scans"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#g)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="mb-1 font-display text-base font-semibold">Class distribution</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            {stats.classifications} total scan{stats.classifications !== 1 ? "s" : ""}
          </p>
          {distribution.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {distribution.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value, entry: any) => (
                    <span className="text-xs text-foreground">
                      {value}{" "}
                      <span className="text-muted-foreground">
                        ({entry.payload.percent}%)
                      </span>
                    </span>
                  )}
                />
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold">
              Tumor Class Breakdown
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Number of scans per predicted class (all time)
            </p>
          </div>
          <Badge variant="outline">All time</Badge>
        </div>
        {distribution.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No classification data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={distribution}
              barSize={40}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {distribution.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {distribution.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {distribution.map((d) => (
              <div
                key={d.name}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.value} &middot; {d.percent}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base font-semibold">Recent activity</h2>
        </div>
        {recentLogs.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No recent activity
          </div>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-3">
                <span>
                  <span className="font-medium">{log.users?.fullname || "System"}</span>{" "}
                  <span className="text-muted-foreground">
                    {log.activity} - {log.description}
                  </span>
                </span>
                <span className="ml-4 shrink-0 text-xs text-muted-foreground">
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

