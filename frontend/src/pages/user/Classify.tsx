import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, Image as ImageIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { classificationService } from "@/services/ClassificationService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Classify() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const analyze = async () => {
    if (!file || !user) return;
    setAnalyzing(true);

    try {
      const result = await classificationService.analyzeImage(file, user.id);

      toast.success("Analysis complete!");

      navigate("/user/result", {
        state: {
          resultData: {
            predicted_class: result.predicted_class,
            confidence_score: result.confidence_score,
            all_scores: result.explanation
              ? JSON.parse(result.explanation)
              : {},
            image_url: result.image_mri || preview,
            created_at: result.created_at || new Date().toISOString(),
          },
        },
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to analyze image.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">MRI Classification</h1>
        <p className="mt-2 text-muted-foreground">Upload an MRI scan to begin analysis.</p>
      </header>

      <Card className="p-6 md:p-8">
        {!preview ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-smooth ${
              dragOver ? "border-primary bg-primary-soft" : "border-border hover:border-primary/50 hover:bg-muted/40"
            }`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <UploadCloud className="h-8 w-8" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">Drag & drop your MRI scan</h3>
            <p className="mt-1 text-sm text-muted-foreground">or click to browse · JPG, PNG up to 25MB</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <img src={preview} alt="MRI preview" className="mx-auto max-h-[420px] w-full object-contain" />
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-3 top-3 shadow-md"
                onClick={() => { setFile(null); setPreview(null); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">{file?.name}</span>
              </div>
              <span className="text-muted-foreground">{((file?.size ?? 0) / 1024).toFixed(0)} KB</span>
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-center">
        <Button
          size="lg"
          disabled={!preview || analyzing}
          onClick={analyze}
          className="min-w-[220px] bg-gradient-primary shadow-glow hover:opacity-95"
        >
          {analyzing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…</>
          ) : (
            "Analyze MRI"
          )}
        </Button>
      </div>
    </div>
  );
}
