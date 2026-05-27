import { useState, useEffect } from "react";
import { modelService, ModelRecord } from "@/services/ModelService";
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
import { CheckCircle2, Plus, UploadCloud, Cpu, Loader2, FileText, CalendarDays, HardDrive, Hash, User } from "lucide-react";

import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";


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
  const [detailModel, setDetailModel] = useState<ModelRecord | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const data = await modelService.getModels();
      setModels(data);
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
    if (!user) return;

    // ── Optimistic update: langsung ubah state lokal sebelum API selesai ──
    const previous = models; // simpan state lama untuk rollback jika gagal
    setModels((prev) =>
      prev.map((m) => ({ ...m, is_active: m.id === id }))
    );
    // Sync detailModel jika sedang terbuka
    setDetailModel((prev) =>
      prev ? { ...prev, is_active: prev.id === id } : prev
    );

    try {
      await modelService.setActiveModel(id, user.id);
      toast.success("Active model updated and loaded into memory!");
    } catch (err: any) {
      // Rollback jika gagal
      setModels(previous);
      setDetailModel((prev) =>
        prev ? previous.find((m) => m.id === prev.id) ?? prev : prev
      );
      toast.error(err.message || "Failed to set active model");
    }
  };


  const handleUpload = async () => {
    if (!modelName || !modelVersion || !modelFile || !user) {
      toast.error("Please fill all fields and select a file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      await modelService.uploadModel({
        modelName,
        version: modelVersion,
        file: modelFile,
        adminId: user.id,
        onProgress: (percent) => setUploadProgress(percent),
      });

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
                    <div className="text-xs text-muted-foreground">
                      Uploaded {format(new Date(m.created_at), "MMM d, yyyy")}
                      {m.users?.fullname && (
                        <span> by <span className="font-medium text-foreground">{m.users.fullname}</span></span>
                      )}
                    </div>
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
                <Button variant="outline" onClick={() => setDetailModel(m)}>Details</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Model Detail Dialog */}
      <Dialog open={!!detailModel} onOpenChange={(o) => !o && setDetailModel(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              {detailModel?.model_name} — {detailModel?.version}
            </DialogTitle>
          </DialogHeader>
          {detailModel && (
            <div className="space-y-4">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <Badge className={detailModel.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>
                  {detailModel.is_active ? (
                    <><CheckCircle2 className="mr-1 h-3 w-3" /> Active — Serving</>  
                  ) : "Idle"}
                </Badge>
                <span className="text-xs text-muted-foreground">Model ID #{detailModel.id}</span>
              </div>

              {/* Detail info grid */}
              <div className="grid gap-3">
                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <FileText className="h-3.5 w-3.5" /> Model Name
                  </div>
                  <div className="font-semibold">{detailModel.model_name}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Hash className="h-3.5 w-3.5" /> Version
                    </div>
                    <div className="font-semibold">{detailModel.version}</div>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <CalendarDays className="h-3.5 w-3.5" /> Uploaded
                    </div>
                    <div className="font-semibold">{format(new Date(detailModel.created_at), "MMM d, yyyy")}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(detailModel.created_at), "HH:mm")}</div>
                  </div>
                </div>

                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <User className="h-3.5 w-3.5" /> Admin
                  </div>
                  <div className="font-semibold">{detailModel.users?.fullname || "Unknown"}</div>
                </div>

                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <HardDrive className="h-3.5 w-3.5" /> File Path
                  </div>
                  <div className="font-mono text-xs break-all">{detailModel.file_path}</div>
                </div>
              </div>

              {/* Activate button */}
              {!detailModel.is_active && (
                <Button
                  className="w-full bg-gradient-primary hover:opacity-95"
                  onClick={() => { setActive(detailModel.id); setDetailModel(null); }}
                >
                  Set as Active Model
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
