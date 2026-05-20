import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Brain, FileScan, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import mri from "@/assets/mri-sample.jpg";

export default function UserHome() {
  const { profile } = useAuth();
  
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 lg:p-16 shadow-soft">
        <Badge className="mb-4 bg-primary-soft text-primary hover:bg-primary-soft">
          <Sparkles className="mr-1 h-3 w-3" /> Model v3.2 · Active
        </Badge>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Welcome back, {profile?.fullname || "User"}.
        </h1>
        <p className="mt-3 max-w-xl text-lg text-muted-foreground">
          Upload a brain MRI and receive an instant, evidence-backed classification with calibrated confidence.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-gradient-primary shadow-glow hover:opacity-95">
            <Link to="/app/classify">
              Start MRI Classification <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/app/history">View history</Link>
          </Button>
        </div>
      </section>

      {/* Explanation */}
      <section className="grid gap-6 md:grid-cols-3">
        {[
          { icon: FileScan, title: "1. Upload MRI", text: "Drag & drop a T1/T2 axial scan. JPG, PNG or DICOM." },
          { icon: Brain, title: "2. AI Analysis", text: "Our deep learning model evaluates tissue patterns in seconds." },
          { icon: Shield, title: "3. Get a Report", text: "Receive a calibrated diagnosis with downloadable PDF." },
        ].map((s) => (
          <Card key={s.title} className="p-6 transition-smooth hover:shadow-soft hover:-translate-y-0.5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <s.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
          </Card>
        ))}
      </section>

      {/* Recent */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">Recent result</h2>
          <Link to="/app/history" className="text-sm text-primary hover:underline">See all →</Link>
        </div>
        <Card className="flex flex-col items-stretch gap-6 overflow-hidden p-4 md:flex-row md:items-center md:p-6">
          <img src={mri} alt="Recent MRI" loading="lazy" className="h-32 w-32 rounded-xl object-cover" />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">May 3, 2026 · 14:22</div>
            <div className="mt-1 font-display text-xl font-semibold">Glioma · <span className="text-success">94% confidence</span></div>
            <p className="mt-1 text-sm text-muted-foreground">Patient ID #A-1093 · Axial T1-weighted</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/app/history">View details</Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}
