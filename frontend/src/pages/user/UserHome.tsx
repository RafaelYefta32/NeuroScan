import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Brain, FileScan, Shield, Sparkles, Loader2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

export default function UserHome() {
  const { profile, user } = useAuth();
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [recentScan, setRecentScan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: models } = await supabase.from('models').select('*').eq('is_active', true).limit(1);
        if (models && models.length > 0) {
          setActiveModel(`${models[0].model_name} ${models[0].version}`);
        }
        if (user) {
          const { data: scans } = await supabase
            .from('classification_results')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (scans && scans.length > 0) {
            setRecentScan(scans[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch UserHome data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);
  
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 lg:p-16 shadow-soft">
        <Badge className="mb-4 bg-primary-soft text-primary hover:bg-primary-soft">
          <Sparkles className="mr-1 h-3 w-3" /> Model {activeModel || "Loading..."} · Active
        </Badge>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Welcome back, {profile?.fullname || "User"}.
        </h1>
        <p className="mt-3 max-w-xl text-lg text-muted-foreground">
          Upload a brain MRI and receive an instant, evidence-backed classification with calibrated confidence.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-gradient-primary shadow-glow hover:opacity-95">
            <Link to="/user/classify">
              Start MRI Classification <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/user/history">View history</Link>
          </Button>
        </div>
      </section>

      {/* Explanation */}
      <section className="grid gap-6 md:grid-cols-3">
        {[
          { icon: FileScan, title: "1. Upload MRI", text: "Drag & drop a MRI scan. JPG or PNG." },
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
          <Link to="/user/history" className="text-sm text-primary hover:underline">See all →</Link>
        </div>
        
        {loading ? (
          <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : recentScan ? (
          <Card className="flex flex-col items-stretch gap-6 overflow-hidden p-4 md:flex-row md:items-center md:p-6">
            <img src={recentScan.image_mri} alt="Recent MRI" loading="lazy" className="h-32 w-32 rounded-xl bg-black object-cover" />
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {format(new Date(recentScan.created_at), "MMM d, yyyy · HH:mm")}
              </div>
              <div className="mt-1 font-display text-xl font-semibold">
                {recentScan.predicted_class.charAt(0).toUpperCase() + recentScan.predicted_class.slice(1)} · 
                <span className="text-success ml-1">{Math.round(recentScan.confidence_score * 100)}% confidence</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Saved to your history</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/user/result" state={{ 
                resultData: {
                  predicted_class: recentScan.predicted_class,
                  confidence_score: recentScan.confidence_score,
                  all_scores: recentScan.explanation ? JSON.parse(recentScan.explanation) : {},
                  image_url: recentScan.image_mri,
                  created_at: recentScan.created_at
                } 
              }}>View details</Link>
            </Button>
          </Card>
        ) : (
          <Card className="flex h-32 flex-col items-center justify-center text-muted-foreground">
            <ImageOff className="mb-2 h-6 w-6 opacity-30" />
            <p className="text-sm">No recent scans found.</p>
          </Card>
        )}
      </section>
    </div>
  );
}
