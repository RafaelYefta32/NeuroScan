import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileScan, Cpu, TrendingUp, Activity } from "lucide-react";
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

const stats = [
  { label: "Total Users", value: "2,847", delta: "+12.4%", icon: Users },
  { label: "Total Classifications", value: "48,219", delta: "+8.1%", icon: FileScan },
  { label: "Active Model", value: "v3.2", delta: "98.4% acc", icon: Cpu },
  { label: "Avg. Confidence", value: "92.7%", delta: "+1.2%", icon: TrendingUp },
];

const series = [
  { d: "Mon", scans: 320 }, { d: "Tue", scans: 410 }, { d: "Wed", scans: 380 },
  { d: "Thu", scans: 520 }, { d: "Fri", scans: 610 }, { d: "Sat", scans: 290 }, { d: "Sun", scans: 340 },
];

const distribution = [
  { name: "Glioma", value: 38, color: "hsl(var(--primary))" },
  { name: "Meningioma", value: 24, color: "hsl(var(--primary-glow))" },
  { name: "Pituitary", value: 18, color: "hsl(var(--warning))" },
  { name: "No tumor", value: 20, color: "hsl(var(--success))" },
];

export default function AdminDashboard() {
  const { profile } = useAuth();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of platform usage and model performance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
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
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {distribution.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Legend iconType="circle" />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base font-semibold">Recent activity</h2>
        </div>
        <ul className="divide-y divide-border text-sm">
          {[
            ["Dr. Reyes", "uploaded scan #A-1093", "2m ago"],
            ["System", "promoted model v3.2 to active", "1h ago"],
            ["Dr. Tan", "classified 4 scans", "3h ago"],
            ["Admin", "disabled user account #u-441", "5h ago"],
          ].map(([who, what, when]) => (
            <li key={who + when} className="flex items-center justify-between py-3">
              <span><span className="font-medium">{who}</span> <span className="text-muted-foreground">{what}</span></span>
              <span className="text-xs text-muted-foreground">{when}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
