import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, Plus, UploadCloud, Cpu } from "lucide-react";

const initial = [
  { id: 1, name: "ResNet-MRI", version: "v3.2", acc: 98.4, size: "82 MB", uploaded: "May 1, 2026", active: true },
  { id: 2, name: "ResNet-MRI", version: "v3.1", acc: 97.6, size: "82 MB", uploaded: "Apr 11, 2026", active: false },
  { id: 3, name: "EfficientNet-B0", version: "v2.4", acc: 96.1, size: "44 MB", uploaded: "Mar 18, 2026", active: false },
  { id: 4, name: "VGG-MRI", version: "v1.0", acc: 93.2, size: "210 MB", uploaded: "Feb 02, 2026", active: false },
];

export default function ModelManagement() {
  const [models, setModels] = useState(initial);
  const [open, setOpen] = useState(false);

  const setActive = (id: number) => setModels((m) => m.map((x) => ({ ...x, active: x.id === id })));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Model Management</h1>
          <p className="text-sm text-muted-foreground">Upload, version and activate classification models.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-95"><Plus className="mr-2 h-4 w-4" /> Upload model</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload new model</DialogTitle>
              <DialogDescription>Add a new .keras model to the registry.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Model name</Label>
                <Input placeholder="e.g. ResNet-MRI" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Version</Label>
                  <Input placeholder="v3.3" />
                </div>
                <div className="space-y-2">
                  <Label>Accuracy (%)</Label>
                  <Input type="number" placeholder="98.5" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Model file (.keras)</Label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-6 py-8 text-center hover:border-primary/50 hover:bg-muted/40">
                  <UploadCloud className="mb-2 h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Click to upload</span>
                  <span className="text-xs text-muted-foreground">.keras up to 500MB</span>
                  <input type="file" accept=".keras" className="hidden" />
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-primary" onClick={() => setOpen(false)}>Set Active</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {models.map((m) => (
          <Card key={m.id} className={`p-5 transition-smooth ${m.active ? "ring-2 ring-primary shadow-soft" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-lg font-semibold">{m.name} <span className="text-muted-foreground">{m.version}</span></div>
                  <div className="text-xs text-muted-foreground">Uploaded {m.uploaded} · {m.size}</div>
                </div>
              </div>
              {m.active && (
                <Badge className="bg-success/15 text-success">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                </Badge>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-xs text-muted-foreground">Accuracy</div>
                <div className="font-display text-lg font-semibold">{m.acc}%</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="font-display text-lg font-semibold">{m.active ? "Serving" : "Idle"}</div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                variant={m.active ? "outline" : "default"}
                className={!m.active ? "flex-1 bg-gradient-primary hover:opacity-95" : "flex-1"}
                disabled={m.active}
                onClick={() => setActive(m.id)}
              >
                {m.active ? "Currently active" : "Set Active"}
              </Button>
              <Button variant="outline">Details</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
