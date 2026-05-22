import { supabase } from "@/lib/supabase";

export interface ActivityLog {
  id?: number;
  user_id: string;
  activity: string;
  description: string;
  created_at?: string;
}
class ActivityLogService {
  /**
   * Mencatat aktivitas user ke tabel activity_logs di Supabase.
   *
   * @param userId - UUID user yang melakukan aktivitas
   * @param activity - Nama singkat aktivitas (contoh: 'User Login')
   * @param description - Deskripsi detail aktivitas
   * @returns Promise<boolean> - true jika berhasil, false jika gagal
   */
  async recordLog(
    userId: string,
    activity: string,
    description: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from("activity_logs").insert([
        {
          user_id: userId,
          activity,
          description,
        } satisfies Omit<ActivityLog, "id" | "created_at">,
      ]);

      if (error) {
        console.error("[ActivityLogService] Gagal mencatat log:", error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error("[ActivityLogService] Error tidak terduga:", err);
      return false;
    }
  }

  /**
   * Mengambil semua log aktivitas milik user tertentu dari Supabase.
   *
   * @param userId - UUID user
   * @returns Promise<ActivityLog[]> - Daftar log aktivitas
   */
  async getLogs(userId: string): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as ActivityLog[]) || [];
    } catch (err) {
      console.error("[ActivityLogService] Gagal mengambil log:", err);
      return [];
    }
  }
}

/** Singleton instance ActivityLogService untuk digunakan di seluruh aplikasi. */
export const activityLogService = new ActivityLogService();
