
import { supabase } from "@/lib/supabase";
import { activityLogService } from "./ActivityLogService";

const BACKEND_URL = "http://localhost:8000";

export interface ModelRecord {
  id: number;
  admin_id: string | null;
  model_name: string;
  version: string;
  file_path: string;
  is_active: boolean;
  created_at: string;
}

export interface UploadModelParams {
  modelName: string;
  version: string;
  file: File;
  adminId: string;
  onProgress?: (percent: number) => void;
}

class ModelService {
  async uploadModel(params: UploadModelParams): Promise<ModelRecord> {
    const filePath = await this._uploadFileToBackend(
      params.file,
      params.version,
      params.onProgress
    );

    const { data, error } = await supabase.from("models").insert([
      {
        model_name: params.modelName,
        version: params.version,
        file_path: filePath,
        admin_id: params.adminId,
      },
    ]).select().single();

    if (error) throw new Error(error.message);

    await activityLogService.recordLog(
      params.adminId,
      "Model Uploaded",
      `Uploaded new model ${params.modelName} ${params.version}`
    );

    return data as ModelRecord;
  }

  private _uploadFileToBackend(
    file: File,
    version: string,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BACKEND_URL}/upload-model`, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          resolve(res.file_path);
        } else {
          reject(new Error(`Upload backend gagal: ${xhr.responseText}`));
        }
      };

      xhr.onerror = () =>
        reject(
          new Error(
            "Network error saat upload ke backend. Apakah Python server berjalan?"
          )
        );

      const formData = new FormData();
      const safeVersion = version.replace(/[^a-zA-Z0-9.-]/g, "_");
      formData.append("file", file, `${safeVersion}-${file.name}`);
      xhr.send(formData);
    });
  }

  async setActiveModel(modelId: number, adminId: string): Promise<void> {
    await supabase.from("models").update({ is_active: false }).neq("id", 0);

    const { error } = await supabase
      .from("models")
      .update({ is_active: true })
      .eq("id", modelId);

    if (error) throw new Error(error.message);

    try {
      const response = await fetch(`${BACKEND_URL}/reload`, { method: "POST" });
      if (!response.ok) {
        console.warn("[ModelService] Backend reload gagal:", await response.text());
      }
    } catch (err) {
      console.warn("[ModelService] Backend tidak dapat dijangkau:", err);
    }

    await activityLogService.recordLog(
      adminId,
      "Model Activated",
      `Model ID ${modelId} set to active`
    );
  }

  async getModels(): Promise<ModelRecord[]> {
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data as ModelRecord[]) || [];
  }

  async getActiveModel(): Promise<ModelRecord | null> {
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[ModelService] Gagal mengambil model aktif:", error.message);
      return null;
    }

    return data as ModelRecord | null;
  }
}

export const modelService = new ModelService();
