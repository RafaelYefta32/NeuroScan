import { Link } from "react-router-dom";
import { ArrowLeft, Download, AlertTriangle, Activity, Stethoscope, BookOpen, Brain, MapPin, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import mri from "@/assets/mri-sample.jpg";

export default function Details() {
  const prediction = {
    label: "Glioma",
    confidence: 94,
    scannedAt: "May 7, 2026 · 10:42 AM",
  };

  const probabilities = [
    { name: "Glioma", v: 94 },
    { name: "Meningioma", v: 4 },
    { name: "Pituitary", v: 1.5 },
    { name: "No tumor", v: 0.5 },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <Link
        to="/app/result"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to result
      </Link>

      {/* Header */}
      <Card className="overflow-hidden border-0 bg-gradient-primary text-primary-foreground shadow-glow">
        <div className="grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <Badge className="bg-white/20 text-primary-foreground hover:bg-white/20">
              Detailed report
            </Badge>
            <h1 className="mt-3 font-display text-4xl font-bold">{prediction.label}</h1>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/80">
              In-depth interpretation of the MRI scan analysis, including tumor characteristics,
              clinical context, and recommended next steps.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/15 px-3 py-1">Confidence {prediction.confidence}%</span>
              <span className="rounded-full bg-white/15 px-3 py-1">{prediction.scannedAt}</span>
            </div>
          </div>
          <Button size="lg" variant="secondary" className="shrink-0">
            <Download className="mr-2 h-4 w-4" /> Download Report
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Image + classes */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <img src={mri} alt="MRI scan" className="w-full bg-black object-contain" />
            <div className="p-4 text-xs text-muted-foreground">
              Highlighted region indicates the area with strongest activation by the model.
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold">Class probabilities</h3>
            <div className="mt-4 space-y-3">
              {probabilities.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{c.name}</span>
                    <span className="font-medium">{c.v}%</span>
                  </div>
                  <Progress value={c.v} className="h-1.5" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Explanation */}
        <div className="space-y-6 lg:col-span-3">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">About Glioma</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Gliomas are tumors that originate from glial cells in the brain or spinal cord.
              They represent one of the most common types of primary brain tumors and can range
              from low-grade (slow growing) to high-grade (aggressive). Accurate identification
              and grading are essential to guide treatment planning.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">Tumor characteristics</h3>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail icon={<Brain className="h-4 w-4" />} label="Predicted class" value={prediction.label} />
              <Detail icon={<Activity className="h-4 w-4" />} label="Confidence" value={`${prediction.confidence}%`} />
              <Detail icon={<Stethoscope className="h-4 w-4" />} label="Origin" value="Glial cell origin" />
              <Detail icon={<MapPin className="h-4 w-4" />} label="Scan date" value={prediction.scannedAt} />
            </div>
            <Separator className="my-5" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              The model classifies this scan as <strong>{prediction.label}</strong> with a confidence of {prediction.confidence}%.
              This classification is based on patterns the model learned from training data.
              It does not determine tumor grade, exact location, size, or invasiveness.
              Further clinical evaluation and imaging by a radiologist are essential.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">Common symptoms</h3>
            </div>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                "Persistent headaches, often worse in the morning",
                "Seizures (new onset in adults)",
                "Cognitive or personality changes",
                "Motor weakness on one side of the body",
                "Speech or language difficulties",
                "Nausea and vomiting",
              ].map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">Recommended next steps</h3>
            </div>
            <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
              {[
                "Share this report with a qualified neurologist or neuro-oncologist for clinical review.",
                "Confirm findings with contrast-enhanced MRI or advanced sequences (MRS, perfusion).",
                "Discuss biopsy or surgical consultation to establish definitive histopathology.",
                "Evaluate treatment options: surgery, radiotherapy, and/or chemotherapy as indicated.",
              ].map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="border-warning/40 bg-warning/5 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
              <div>
                <h3 className="font-display text-base font-semibold">Medical disclaimer</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  This AI-generated analysis is intended to assist clinical decision-making and
                  must not replace professional medical diagnosis. Always consult a qualified
                  healthcare provider for interpretation and treatment.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
