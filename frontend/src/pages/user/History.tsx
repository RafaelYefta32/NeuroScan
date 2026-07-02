import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ImageOff } from "lucide-react";
import { classificationService } from "@/services/ClassificationService";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { PaginationBar } from "@/components/ui/pagination-bar";

const toneClass = (result: string) => {
  const t = result.toLowerCase();
  if (t === "notumor" || t === "no tumor") return "bg-success/15 text-success";
  if (t === "glioma") return "bg-destructive/15 text-destructive";
  return "bg-warning/15 text-warning";
};

const PAGE_SIZE = 5;

export default function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      try {
        await classificationService.healHistoryModelIds(user.id);
        const data = await classificationService.getHistory(user.id);
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = history.filter(h => 
    h.predicted_class.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );


  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Your scan history</h1>
        <p className="mt-1 text-muted-foreground">A complete log of your previous MRI classifications.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          className="pl-9" 
          placeholder="Search by result (e.g. glioma)…" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card className="flex flex-col items-center p-8 text-center text-muted-foreground">
            <ImageOff className="mb-2 h-8 w-8 opacity-20" />
            <p>No scans found.</p>
          </Card>
        ) : (
          <>
            {paginated.map((it) => {
              const formattedClass = it.predicted_class.charAt(0).toUpperCase() + it.predicted_class.slice(1);
              const conf = (it.confidence_score * 100).toFixed(2);
              
              const resultState = {
                predicted_class: it.predicted_class,
                confidence_score: it.confidence_score,
                all_scores: it.explanation ? JSON.parse(it.explanation) : {},
                image_url: it.image_mri,
                created_at: it.created_at,
                models: it.models,
              };

              return (
                <Link key={it.id} to="/user/result" state={{ resultData: resultState }}>
                  <Card className="flex items-center gap-4 p-4 transition-smooth hover:shadow-soft hover:-translate-y-0.5">
                    <img src={it.image_mri || ""} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl bg-black object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-semibold">{formattedClass}</span>
                        <Badge className={toneClass(it.predicted_class)}>{conf}%</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(it.created_at), "MMM d, yyyy · HH:mm")} 
                        {it.models && ` · Model: ${it.models.model_name}`}
                      </div>
                    </div>
                    <span className="text-sm text-primary">View →</span>
                  </Card>
                </Link>
              );
            })}

            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

    </div>
  );
}
