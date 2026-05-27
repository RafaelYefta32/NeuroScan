import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Search, Download, Loader2, Brain, User, CalendarDays, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { PaginationBar } from "@/components/ui/pagination-bar";

interface Classification {
  id: number;
  user_id: string;
  image_mri: string;
  predicted_class: string;
  confidence_score: number;
  explanation?: string | null;
  created_at: string;
  users?: { fullname: string; email: string };
  models?: { model_name: string; version: string } | null;
}

const tone = (r: string) => {
  const cls = r.toLowerCase().replace(/[^a-z]/g, "");
  if (cls === "notumor") return "bg-success/15 text-success";
  if (cls === "glioma") return "bg-destructive/15 text-destructive";
  return "bg-warning/15 text-warning";
};

const barColor: Record<string, string> = {
  glioma: "bg-red-500",
  meningioma: "bg-purple-500",
  pituitary: "bg-amber-500",
  notumor: "bg-emerald-500",
};

const PAGE_SIZE = 10;

function ClassificationDetailDialog({ item, onClose }: { item: Classification | null; onClose: () => void }) {
  if (!item) return null;
  let allScores: Record<string, number> = {};
  try { allScores = item.explanation ? JSON.parse(item.explanation) : {}; } catch { allScores = {}; }

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Scan Detail — SC-{item.id}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {item.image_mri && !item.image_mri.includes("placeholder") && (
            <div className="overflow-hidden rounded-xl border border-border">
              <img src={item.image_mri} alt="MRI Scan" className="w-full max-h-56 object-contain bg-black/5" />
            </div>
          )}
          <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
            <div>
              <div className="text-xs text-muted-foreground">Predicted Class</div>
              <div className="mt-0.5"><Badge className={tone(item.predicted_class)}>{item.predicted_class}</Badge></div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Confidence</div>
              <div className="font-display text-2xl font-bold tabular-nums">{(item.confidence_score * 100).toFixed(1)}%</div>
            </div>
          </div>
          {Object.keys(allScores).length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <BarChart3 className="h-3.5 w-3.5" /> Class Scores
              </div>
              <div className="space-y-2">
                {Object.entries(allScores).sort(([, a], [, b]) => b - a).map(([cls, score]) => {
                  const pct = (score * 100).toFixed(1);
                  const key = cls.toLowerCase().replace(/[^a-z]/g, "");
                  return (
                    <div key={cls}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="capitalize">{cls}</span>
                        <span className="font-medium tabular-nums">{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${barColor[key] ?? "bg-primary"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><User className="h-3.5 w-3.5" /> Uploaded by</div>
              <div className="font-medium">{item.users?.fullname || "Unknown"}</div>
              <div className="text-xs text-muted-foreground">{item.users?.email || "—"}</div>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><CalendarDays className="h-3.5 w-3.5" /> Date</div>
              <div className="font-medium">{format(new Date(item.created_at), "MMM d, yyyy")}</div>
              <div className="text-xs text-muted-foreground">{format(new Date(item.created_at), "HH:mm:ss")}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Classifications() {
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<Classification | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("classification_results")
          .select("*, users(fullname, email), models(model_name, version)")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setClassifications(data || []);
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch classifications");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search, classFilter]);

  const filtered = classifications.filter((c) => {
    const matchSearch = c.id.toString().includes(search) || (c.users?.fullname || "").toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === "all" || (c.predicted_class || "").toLowerCase().includes(classFilter.toLowerCase());
    return matchSearch && matchClass;
  });

  // ── Export data yang sedang difilter ke file CSV ──────────────────────────
  const exportToCSV = () => {
    if (filtered.length === 0) {
      toast.error("No data to export.");
      return;
    }

    const headers = ["Scan ID", "User", "Email", "Predicted Class", "Confidence (%)", "Date", "Time"];
    const rows = filtered.map((c) => [
      `SC-${c.id}`,
      c.users?.fullname || "Unknown",
      c.users?.email || "-",
      c.predicted_class,
      (c.confidence_score * 100).toFixed(2),
      format(new Date(c.created_at), "yyyy-MM-dd"),
      format(new Date(c.created_at), "HH:mm:ss"),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `classifications_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filtered.length} records to CSV.`);
  };

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Classifications</h1>
          <p className="text-sm text-muted-foreground">All MRI predictions made on the platform.</p>
        </div>
        <Button variant="outline" onClick={exportToCSV} disabled={loading}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
          {filtered.length > 0 && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
              {filtered.length}
            </span>
          )}
        </Button>
      </div>
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 pb-4">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by scan ID or user…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              <SelectItem value="glioma">Glioma</SelectItem>
              <SelectItem value="meningioma">Meningioma</SelectItem>
              <SelectItem value="pituitary">Pituitary</SelectItem>
              <SelectItem value="notumor">No Tumor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scan ID</TableHead>
                <TableHead>Uploaded by</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No classification records found.</TableCell></TableRow>
              ) : (
                paginated.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setSelectedItem(r)}>
                    <TableCell className="font-mono text-xs">SC-{r.id}</TableCell>
                    <TableCell>{r.users?.fullname || "Unknown User"}</TableCell>
                    <TableCell><Badge className={tone(r.predicted_class)}>{r.predicted_class}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{(r.confidence_score * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedItem(r); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {!loading && filtered.length > 0 && (
          <PaginationBar currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
        )}
      </Card>
      <ClassificationDetailDialog item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
