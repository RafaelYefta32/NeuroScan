import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, Upload, UserCog, Cpu, AlertTriangle } from "lucide-react";

const events = [
  { icon: Upload, who: "Dr. Reyes", what: "Uploaded scan SC-2104", time: "Today · 14:22", tone: "primary" },
  { icon: Cpu, who: "System", what: "Promoted model v3.2 to active", time: "Today · 09:11", tone: "success" },
  { icon: LogIn, who: "Sara Khan", what: "Signed in from new device", time: "Yesterday · 18:40", tone: "muted" },
  { icon: UserCog, who: "Admin", what: "Disabled user account j.cole@hospital.org", time: "Yesterday · 15:02", tone: "warning" },
  { icon: AlertTriangle, who: "System", what: "High inference latency detected (p95 1.4s)", time: "May 2 · 23:11", tone: "destructive" },
  { icon: Upload, who: "Dr. Tan", what: "Uploaded scan SC-2099", time: "May 2 · 10:24", tone: "primary" },
];

const dot: Record<string, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export default function ActivityLogs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-sm text-muted-foreground">Chronological audit of system and user activity.</p>
      </div>

      <Card className="p-6">
        <ol className="relative space-y-6 border-l border-border pl-6">
          {events.map((e, i) => (
            <li key={i} className="relative">
              <span className={`absolute -left-[34px] flex h-8 w-8 items-center justify-center rounded-full ${dot[e.tone]}`}>
                <e.icon className="h-4 w-4" />
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{e.who}</div>
                  <div className="text-sm text-muted-foreground">{e.what}</div>
                </div>
                <Badge variant="outline" className="text-xs">{e.time}</Badge>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
