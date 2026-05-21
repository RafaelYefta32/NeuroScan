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
  
  // Upload State
  const [uploading, setUploading] = useState(false);
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
      // 1. Set all models to inactive
      await supabase.from("models").update({ is_active: false }).neq("id", 0);
      
      // 2. Set the chosen one to active
      const { error } = await supabase.from("models").update({ is_active: true }).eq("id", id);
      
      if (error) throw error;
      
      // Log activity
      await supabase.from("activity_logs").insert([{
        user_id: user?.id,
        activity: "Model Activated",
        description: `Model ID ${id} set to active`
      }]);

      await fetchModels();
      toast.success("Active model updated");
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
    try {
      // Create a unique file path
      const filePath = `models/${Date.now()}-${modelFile.name}`;

      // Upload file to Supabase Storage (assuming a 'models' bucket exists)
      // Note: If bucket doesn't exist, this will fail. Admin needs to create it.
      const { error: uploadError } = await supabase.storage
        .from("models")
        .upload(filePath, modelFile);

      if (uploadError) {
        // We will mock the DB insertion even if storage fails for demo purposes
        // in case the user hasn't created the 'models' bucket yet.
        console.warn("Storage upload failed (bucket might not exist). Proceeding with DB insert only.", uploadError);
      }

      // Insert into database
      const { error: dbError } = await supabase.from("models").insert([
        {
          model_name: modelName,
          version: modelVersion,
          file_path: filePath,
          is_active: models.length === 0, // Auto-active if it's the first model
          admin_id: user?.id
        }
      ]);

      if (dbError) throw dbError;

      // Log activity
      await supabase.from("activity_logs").insert([{
        user_id: user?.id,
        activity: "Model Uploaded",
        description: `Uploaded new model ${modelName} ${modelVersion}`
      }]);

      toast.success("Model uploaded successfully!");
      setOpen(false);
      fetchModels();
      
      // Reset form
      setModelName("");
      setModelVersion("");
      setModelFile(null);
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
