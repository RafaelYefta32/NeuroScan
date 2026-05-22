import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import mri from "@/assets/mri-sample.jpg";

const items = [
  { id: 1, result: "Glioma", confidence: 94, date: "May 3, 2026", patient: "A-1093", tone: "destructive" },
  { id: 2, result: "No Tumor", confidence: 99, date: "May 1, 2026", patient: "A-1088", tone: "success" },
  { id: 3, result: "Meningioma", confidence: 88, date: "Apr 28, 2026", patient: "A-1071", tone: "warning" },
  { id: 4, result: "Pituitary", confidence: 91, date: "Apr 22, 2026", patient: "A-1065", tone: "warning" },
  { id: 5, result: "No Tumor", confidence: 97, date: "Apr 15, 2026", patient: "A-1041", tone: "success" },
] as const;

const toneClass = (t: string) =>
  t === "success" ? "bg-success/15 text-success"
  : t === "warning" ? "bg-warning/15 text-warning"
  : "bg-destructive/15 text-destructive";

export default function History() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Your scan history</h1>
        <p className="mt-1 text-muted-foreground">A simple log of your previous MRI classifications.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by patient or result…" />
      </div>

      <div className="space-y-3">
        {items.map((it) => (
          <Link key={it.id} to="/app/result">
            <Card className="flex items-center gap-4 p-4 transition-smooth hover:shadow-soft hover:-translate-y-0.5">
              <img src={mri} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-semibold">{it.result}</span>
                  <Badge className={toneClass(it.tone)}>{it.confidence}%</Badge>
                </div>
                <div className="text-sm text-muted-foreground">Patient #{it.patient} · {it.date}</div>
              </div>
              <span className="text-sm text-primary">View →</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
