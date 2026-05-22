import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, Plus, UploadCloud, Cpu, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

interface ModelRecord {
  id: number;
  model_name: string;
  version: string;
  file_path: string;
  is_active: boolean;
  created_at: string;
}

export default function ModelManagement() {
  const { user } = useAuth();
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modelName, setModelName] = useState("");
  const [modelVersion, setModelVersion] = useState("");
  const [modelFile, setModelFile] = useState<File | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("models")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setModels(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch models");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const setActive = async (id: number) => {
    try {
      await supabase.from("models").update({ is_active: false }).neq("id", 0);
      
      const { error } = await supabase.from("models").update({ is_active: true }).eq("id", id);
      
      if (error) throw error;
      
      try {
        const response = await fetch("http://localhost:8000/reload", { method: "POST" });
        if (!response.ok) {
          console.warn("Backend reload failed", await response.text());
          toast.warning("Database updated, but failed to reload model on the Python server.");
        } else {
          toast.success("Active model updated and loaded into memory!");
        }
      } catch (err) {
        console.warn("Backend is offline or unreachable", err);
        toast.warning("Database updated, but Python backend is unreachable.");
      }

      await supabase.from("activity_logs").insert([{
        user_id: user?.id,
        activity: "Model Activated",
        description: `Model ID ${id} set to active`
      }]);

      await fetchModels();
    } catch (err: any) {
      toast.error(err.message || "Failed to set active model");
    }
  };

  const handleUpload = async () => {
    if (!modelName || !modelVersion || !modelFile) {
      toast.error("Please fill all fields and select a file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const uploadedFilePath = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:8000/upload-model", true);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percent);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const res = JSON.parse(xhr.responseText);
            resolve(res.file_path);
          } else {
            console.error("Backend upload failed.", xhr.responseText);
            reject(new Error(`Backend upload failed: ${xhr.responseText}`)); 
          }
        };
        
        xhr.onerror = () => {
           console.error("Network error during backend upload.");
           reject(new Error("Network error during backend upload. Is the Python server running?"));
        };
        
        const formData = new FormData();
        const safeVersion = modelVersion.replace(/[^a-zA-Z0-9.-]/g, '_');
        formData.append("file", modelFile, `${safeVersion}-${modelFile.name}`);
        xhr.send(formData);
      });

      const { error: dbError } = await supabase.from("models").insert([
        {
          model_name: modelName,
          version: modelVersion,
          file_path: uploadedFilePath,
          admin_id: user?.id
        }
      ]);

      if (dbError) throw dbError;

      await supabase.from("activity_logs").insert([{
        user_id: user?.id,
        activity: "Model Uploaded",
        description: `Uploaded new model ${modelName} ${modelVersion}`
      }]);

      toast.success("Model uploaded successfully!");
      setOpen(false);
      fetchModels();
      
      setModelName("");
      setModelVersion("");
      setModelFile(null);
      setUploadProgress(0);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload model");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Model Management</h1>
          <p className="text-sm text-muted-foreground">Upload, version and activate classification models.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-95">
              <Plus className="mr-2 h-4 w-4" /> Upload model
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload new model</DialogTitle>
              <DialogDescription>Add a new .keras or .h5 model to the registry.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Model name</Label>
                <Input 
                  placeholder="e.g. ResNet-MRI" 
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Version</Label>
                <Input 
                  placeholder="v3.3" 
                  value={modelVersion}
                  onChange={(e) => setModelVersion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Model file</Label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-6 py-8 text-center hover:border-primary/50 hover:bg-muted/40">
                  <UploadCloud className="mb-2 h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">
                    {modelFile ? modelFile.name : "Click to select"}
                  </span>
                  <span className="text-xs text-muted-foreground">Up to 500MB</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => setModelFile(e.target.files ? e.target.files[0] : null)}
                  />
                </label>
                {uploading && uploadProgress > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span>Uploading to Server...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5" />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={uploading}>Cancel</Button>
              <Button className="bg-gradient-primary" onClick={handleUpload} disabled={uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Upload Model
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : models.length === 0 ? (
        <Card className="flex h-32 flex-col items-center justify-center text-muted-foreground">
          <p>No models found.</p>
          <p className="text-sm">Click "Upload model" to add one.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {models.map((m) => (
            <Card key={m.id} className={`p-5 transition-smooth ${m.is_active ? "ring-2 ring-primary shadow-soft" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display text-lg font-semibold">{m.model_name} <span className="text-muted-foreground">{m.version}</span></div>
                    <div className="text-xs text-muted-foreground">Uploaded {format(new Date(m.created_at), "MMM d, yyyy")}</div>
                  </div>
                </div>
                {m.is_active && (
                  <Badge className="bg-success/15 text-success">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                  </Badge>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">File path</div>
                  <div className="font-mono text-xs font-semibold truncate mt-1">{m.file_path.split('/').pop()}</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="font-display text-lg font-semibold">{m.is_active ? "Serving" : "Idle"}</div>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <Button
                  variant={m.is_active ? "outline" : "default"}
                  className={!m.is_active ? "flex-1 bg-gradient-primary hover:opacity-95" : "flex-1"}
                  disabled={m.is_active}
                  onClick={() => setActive(m.id)}
                >
                  {m.is_active ? "Currently active" : "Set Active"}
                </Button>
                <Button variant="outline">Details</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
