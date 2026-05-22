
import { supabase } from "@/lib/supabase";
import { activityLogService } from "./ActivityLogService";

const BACKEND_URL = "http://localhost:8000";

export interface ClassificationResult {
  id?: number;
  user_id: string;
  model_id?: number | null;
  image_mri: string;
  predicted_class: string;
  confidence_score: number;
  explanation?: string | null;
  created_at?: string;
  models?: { model_name: string; version: string } | null;
}

interface BackendPredictionResult {
  filename: string;
  predicted_class: string;
  confidence_score: number;
  all_scores: Record<string, number>;
  image_url?: string;
  result_id?: number;
  message: string;
}

class ClassificationService {
  async analyzeImage(
    file: File,
    userId: string
  ): Promise<ClassificationResult> {
    const { data: models } = await supabase
      .from("models")
      .select("*")
      .eq("is_active", true)
      .limit(1);
    const activeModel = models && models.length > 0 ? models[0] : null;
    const modelId: number | null = activeModel ? activeModel.id : null;

    const imageUrl = await this._uploadScanToStorage(file);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BACKEND_URL}/predict`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(
        errData?.detail || `Backend error: ${response.statusText}`
      );
    }

    const prediction: BackendPredictionResult = await response.json();

    const result = await this._saveResultToDb({
      userId,
      modelId,
      imageUrl,
      prediction,
    });

    await activityLogService.recordLog(
      userId,
      "MRI Scan Upload",
      `Uploaded an MRI scan. Predicted: ${prediction.predicted_class}`
    );

    return result;
  }
  private async _uploadScanToStorage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("scans")
        .upload(fileName, file);

      if (uploadError || !uploadData) {
        console.warn(
          "[ClassificationService] Upload ke Storage gagal:",
          uploadError
        );
        return "https://via.placeholder.com/150";
      }

      const { data: urlData } = supabase.storage
        .from("scans")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (e) {
      console.error(
        "[ClassificationService] Error upload Storage (bucket 'scans' mungkin tidak ada):",
        e
      );
      return "https://via.placeholder.com/150";
    }
  }

  private async _saveResultToDb(params: {
    userId: string;
    modelId: number | null;
    imageUrl: string;
    prediction: BackendPredictionResult;
  }): Promise<ClassificationResult> {
    const insertPayload = {
      user_id: params.userId,
      model_id: params.modelId,
      image_mri: params.imageUrl,
      predicted_class: params.prediction.predicted_class,
      confidence_score: params.prediction.confidence_score,
      explanation: JSON.stringify(params.prediction.all_scores),
    };

    try {
      const { data, error } = await supabase
        .from("classification_results")
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        console.error("[ClassificationService] Gagal menyimpan hasil:", error);
      } else if (data) {
        return data as ClassificationResult;
      }
    } catch (e) {
      console.error(
        "[ClassificationService] Error tidak terduga saat menyimpan hasil:",
        e
      );
    }

    return {
      user_id: params.userId,
      model_id: params.modelId,
      image_mri: params.imageUrl,
      predicted_class: params.prediction.predicted_class,
      confidence_score: params.prediction.confidence_score,
      explanation: JSON.stringify(params.prediction.all_scores),
    };
  }

  async getHistory(userId: string): Promise<ClassificationResult[]> {
    const { data, error } = await supabase
      .from("classification_results")
      .select("*, models(model_name, version)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data as ClassificationResult[]) || [];
  }

  async viewResultDetails(
    resultId: number
  ): Promise<ClassificationResult | null> {
    const { data, error } = await supabase
      .from("classification_results")
      .select("*, models(model_name, version)")
      .eq("id", resultId)
      .maybeSingle();

    if (error) {
      console.error("[ClassificationService] Gagal mengambil detail:", error);
      return null;
    }

    return data as ClassificationResult | null;
  }

  downloadPDFReport(result: ClassificationResult): void {
    const confidence = Math.round(result.confidence_score * 100);
    const tumorDetected = result.predicted_class.toLowerCase() !== "notumor";

    const reportContent = [
      "============================================",
      "       NEUROSCAN CLASSIFICATION REPORT      ",
      "============================================",
      "",
      `Date & Time     : ${result.created_at ? new Date(result.created_at).toLocaleString() : new Date().toLocaleString()}`,
      `Predicted Class : ${result.predicted_class.charAt(0).toUpperCase() + result.predicted_class.slice(1)}`,
      `Confidence Score: ${confidence}%`,
      `Tumor Detected  : ${tumorDetected ? "Yes" : "No"}`,
      "",
      "All Class Scores:",
      ...(result.explanation
        ? Object.entries(JSON.parse(result.explanation)).map(
            ([cls, score]) =>
              `  - ${cls.padEnd(15)}: ${Math.round((score as number) * 100)}%`
          )
        : []),
      "",
      "============================================",
      "Report generated by NeuroScan System",
    ].join("\n");

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `neuroscan-report-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const classificationService = new ClassificationService();
