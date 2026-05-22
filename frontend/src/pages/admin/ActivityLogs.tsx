import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, Upload, UserCog, Cpu, AlertTriangle, Loader2, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: number;
  user_id: string;
  activity: string;
  description: string;
  created_at: string;
  users?: {
    fullname: string;
  };
}

const getIconForActivity = (activity: string) => {
  const act = activity.toLowerCase();
  if (act.includes("upload") || act.includes("scan")) return Upload;
  if (act.includes("login") || act.includes("sign in")) return LogIn;
  if (act.includes("user") || act.includes("account")) return UserCog;
  if (act.includes("model") || act.includes("system")) return Cpu;
  if (act.includes("error") || act.includes("failed")) return AlertTriangle;
  return Activity;
};

const getToneForActivity = (activity: string): string => {
  const act = activity.toLowerCase();
  if (act.includes("upload") || act.includes("scan")) return "primary";
  if (act.includes("model") || act.includes("system") || act.includes("success")) return "success";
  if (act.includes("user") || act.includes("account")) return "warning";
  if (act.includes("error") || act.includes("failed")) return "destructive";
  return "muted";
};

const dot: Record<string, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          *,
          users (
            fullname
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50); // Get latest 50 logs

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-sm text-muted-foreground">Chronological audit of system and user activity.</p>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No activity logs found.
          </div>
        ) : (
          <ol className="relative space-y-6 border-l border-border pl-6">
            {logs.map((log) => {
              const Icon = getIconForActivity(log.activity);
              const tone = getToneForActivity(log.activity);
              
              return (
                <li key={log.id} className="relative">
                  <span className={`absolute -left-[34px] flex h-8 w-8 items-center justify-center rounded-full ${dot[tone]}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {log.users?.fullname || "System"} 
                        <span className="ml-2 font-normal text-muted-foreground">
                          {log.activity}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">{log.description}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}
