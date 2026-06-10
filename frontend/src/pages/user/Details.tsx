import { Link, useLocation, Navigate } from "react-router-dom";
import { ArrowLeft, Download, AlertTriangle, Activity, Stethoscope, BookOpen, Brain, MapPin, Microscope, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { generateClinicalExplanation, printMedicalReport, getClinicalSymptoms, getClinicalNextSteps } from "@/utils/reportGenerator";


export default function Details() {
  const location = useLocation();
  const { profile, user } = useAuth();
  const resultData = location.state?.resultData;

  if (!resultData) {
    return <Navigate to="/user/history" replace />;
  }

  const { predicted_class, confidence_score, all_scores, image_url, created_at, models } = resultData;
  console.log("Details page resultData:", resultData);
  const formattedClass = predicted_class.charAt(0).toUpperCase() + predicted_class.slice(1);
  const confidencePercent = Math.round(confidence_score * 100);

  const scannedAt = created_at 
    ? format(new Date(created_at), "MMM d, yyyy · HH:mm")
    : "Just now";
  const probabilities = Object.entries(all_scores || {})
    .map(([key, val]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), v: Math.round((val as number) * 100) }))
    .sort((a, b) => b.v - a.v);

  const reportPayload = {
    predictedClass: formattedClass,
    confidenceScore: confidence_score,
    allScores: all_scores || {},
    imageMri: image_url || "",
    createdAt: created_at,
    userName: profile?.fullname || "Clinical Clinician",
    userEmail: user?.email || "-",
    modelName: models?.model_name,
    modelVersion: models?.version,
  };


  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <Link
        to="/user/result"
        state={{ resultData }}
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
            <h1 className="mt-3 font-display text-4xl font-bold">{formattedClass}</h1>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/80">
              In-depth interpretation of the MRI scan analysis, including tumor characteristics,
              clinical context, and recommended next steps.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/15 px-3 py-1">Confidence {confidencePercent}%</span>
              <span className="rounded-full bg-white/15 px-3 py-1">{scannedAt}</span>
            </div>
          </div>
          <Button
            size="lg"
            variant="secondary"
            className="shrink-0"
            onClick={() => printMedicalReport(reportPayload)}
          >
            <Download className="mr-2 h-4 w-4" /> Download Report
          </Button>
        </div>
      </Card>


      <div className="grid gap-6 lg:grid-cols-5">
        {/* Image + classes */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <img src={image_url || ""} alt="MRI scan" className="w-full max-h-[400px] bg-black object-contain" />
            <div className="p-4 text-xs text-muted-foreground">
              Analyzed region indicating potential abnormalities.
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
              <h3 className="font-display text-lg font-semibold">About {formattedClass}</h3>
            </div>
            <div 
              className="mt-3"
              dangerouslySetInnerHTML={{ 
                __html: generateClinicalExplanation(reportPayload) 
              }} 
            />
          </Card>


          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">Tumor characteristics</h3>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail icon={<Brain className="h-4 w-4" />} label="Predicted class" value={formattedClass} />
              <Detail icon={<Activity className="h-4 w-4" />} label="Confidence" value={`${confidencePercent}%`} />
              <Detail icon={<Stethoscope className="h-4 w-4" />} label="Origin" value={predicted_class.toLowerCase() === "notumor" ? "N/A" : "Unknown"} />
              <Detail icon={<MapPin className="h-4 w-4" />} label="Scan date" value={scannedAt} />
              <Detail icon={<Cpu className="h-4 w-4" />} label="Model engine" value={models ? `${models.model_name} (${models.version})` : "EfficientNet-B0 (v1.0)"} className="sm:col-span-2" />
            </div>
            <Separator className="my-5" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              The model classifies this scan as <strong>{formattedClass}</strong> with a confidence of {confidencePercent}%.
              This classification is based on patterns the <strong>{models?.model_name || "EfficientNet-B0"}</strong> model learned from training data.
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
              {getClinicalSymptoms(predicted_class).map((s) => (
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
              {getClinicalNextSteps(predicted_class).map((s, i) => (
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

function Detail({ icon, label, value, className = "" }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-lg border bg-muted/30 p-3 ${className}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
