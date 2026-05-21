import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Search, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Classification {
  id: number;
  user_id: string;
  image_mri: string;
  predicted_class: string;
  confidence_score: number;
  created_at: string;
  users?: {
    fullname: string;
    email: string;
  };
}

const tone = (r: string) =>
  r === "No Tumor" || r === "No_Tumor"
    ? "bg-success/15 text-success"
    : r === "Glioma"
    ? "bg-destructive/15 text-destructive"
    : "bg-warning/15 text-warning";

export default function Classifications() {
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const fetchClassifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("classification_results")
        .select(`
          *,
          users (
            fullname,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClassifications(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch classifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassifications();
  }, []);

  const filteredClassifications = classifications.filter((c) => {
    const matchesSearch =
      c.id.toString().includes(search) ||
      (c.users?.fullname || "").toLowerCase().includes(search.toLowerCase());

    const matchesClass =
      classFilter === "all" ||
      (c.predicted_class || "").toLowerCase().includes(classFilter.toLowerCase());

    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Classifications</h1>
          <p className="text-sm text-muted-foreground">All MRI predictions made on the platform.</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 pb-4">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              className="pl-9" 
              placeholder="Search by scan ID or user…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              <SelectItem value="glioma">Glioma</SelectItem>
              <SelectItem value="meningioma">Meningioma</SelectItem>
              <SelectItem value="pituitary">Pituitary</SelectItem>
              <SelectItem value="no tumor">No Tumor</SelectItem>
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
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredClassifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No classification records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClassifications.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">SC-{r.id}</TableCell>
                    <TableCell>{r.users?.fullname || "Unknown User"}</TableCell>
                    <TableCell>
                      <Badge className={tone(r.predicted_class)}>{r.predicted_class}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(r.confidence_score * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(r.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
