import { Link } from "react-router-dom";
import { Download, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import mri from "@/assets/mri-sample.jpg";

export default function Result() {
  const confidence = 94;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/app/classify" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> New scan
      </Link>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="overflow-hidden lg:col-span-3">
          <img src={mri} alt="Analyzed MRI" className="w-full bg-black object-contain" />
        </Card>

        <Card className="flex flex-col justify-between p-6 lg:col-span-2">
          <div>
            <Badge className="bg-success/15 text-success hover:bg-success/15">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Analysis complete
            </Badge>
            <div className="mt-4 text-sm uppercase tracking-wider text-muted-foreground">Predicted class</div>
            <h1 className="font-display text-4xl font-bold leading-tight">Glioma</h1>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-semibold text-foreground">{confidence}%</span>
              </div>
              <Progress value={confidence} className="h-2" />
            </div>

            <div className="mt-6 space-y-3">
              {[
                { name: "Glioma", v: 94 },
                { name: "Meningioma", v: 4 },
                { name: "Pituitary", v: 1.5 },
                { name: "No tumor", v: 0.5 },
              ].map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{c.name}</span>
                    <span className="font-medium">{c.v}%</span>
                  </div>
                  <Progress value={c.v} className="h-1.5" />
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Findings consistent with a glioma. Irregular contrast enhancement detected in the left frontal lobe.
              Clinical correlation and radiologist review are recommended.
            </p>
          </div>

          <div className="mt-6 flex gap-2">
            <Button className="flex-1 bg-gradient-primary hover:opacity-95">
              <Download className="mr-2 h-4 w-4" /> Download Report
            </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/app/details">View Details</Link>
              </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
