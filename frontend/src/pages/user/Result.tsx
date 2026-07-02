import { Link, useLocation, Navigate } from "react-router-dom";
import { Download, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { printMedicalReport } from "@/utils/reportGenerator";

export default function Result() {
  const location = useLocation();
  const { profile, user } = useAuth();
  const resultData = location.state?.resultData;

  if (!resultData) {
    return <Navigate to="/user/classify" replace />;
  }

  const { predicted_class, confidence_score, all_scores, image_url, created_at, models } = resultData;
  console.log("Result page resultData:", resultData);
  const confidencePercent = parseFloat((confidence_score * 100).toFixed(2)); // number for Progress
  const confidenceLabel = confidencePercent.toFixed(2);                      // string for display

  const formattedClass = predicted_class.charAt(0).toUpperCase() + predicted_class.slice(1);

  const sortedScores = Object.entries(all_scores || {})
    .map(([key, val]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), v: parseFloat(((val as number) * 100).toFixed(2)), vLabel: ((val as number) * 100).toFixed(2) }))
    .sort((a, b) => b.v - a.v);

  const handleDownloadReport = () => {
    printMedicalReport({
      predictedClass: formattedClass,
      confidenceScore: confidence_score,
      allScores: all_scores || {},
      imageMri: image_url || "",
      createdAt: created_at,
      userName: profile?.fullname || "Clinical Clinician",
      userEmail: user?.email || "-",
      modelName: models?.model_name,
      modelVersion: models?.version,
    });
  };


  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/user/classify" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> New scan
      </Link>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="overflow-hidden lg:col-span-3">
          <img src={image_url} alt="Analyzed MRI" className="w-full h-full max-h-[500px] bg-black object-contain" />
        </Card>

        <Card className="flex flex-col justify-between p-6 lg:col-span-2">
          <div>
            <Badge className="bg-success/15 text-success hover:bg-success/15">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Analysis complete
            </Badge>
            <div className="mt-4 text-sm uppercase tracking-wider text-muted-foreground">Predicted class</div>
            <h1 className="font-display text-4xl font-bold leading-tight">{formattedClass}</h1>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-semibold text-foreground">{confidenceLabel}%</span>
              </div>
              <Progress value={confidencePercent} className="h-2" />
            </div>

            <div className="mt-6 space-y-3">
              {sortedScores.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{c.name}</span>
                    <span className="font-medium">{c.vLabel}%</span>
                  </div>
                  <Progress value={c.v} className="h-1.5" />
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Findings consistent with {formattedClass}. Please note that this is an AI prediction and should be verified by a medical professional.
              Clinical correlation and radiologist review are recommended.
            </p>
          </div>

          <div className="mt-6 flex gap-2">
            <Button
              className="flex-1 bg-gradient-primary hover:opacity-95"
              onClick={handleDownloadReport}
            >
              <Download className="mr-2 h-4 w-4" /> Download Report
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/user/details" state={{ resultData }}>View Explanation</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

