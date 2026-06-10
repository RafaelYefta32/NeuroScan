import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { activityLogService } from "./ActivityLogService";

export interface UserProfile {
  id: string;
  role_id: number;
  fullname: string | null;
  institution: string | null;
  profession: string | null;
  profile_image: string | null;
  status: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  fullname: string;
  institution?: string;
  profession?: string;
}

export interface UpdateProfileParams {
  fullname?: string;
  institution?: string;
  profession?: string;
}

class UserService {
  private getFriendlyAuthError(error: unknown, fallbackMessage: string): Error {
    const rawMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : fallbackMessage;

    const normalizedMessage = rawMessage.toLowerCase();

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return new Error("Tidak ada koneksi internet. Periksa jaringan lalu coba lagi.");
    }

    if (
      normalizedMessage.includes("failed to fetch") ||
      normalizedMessage.includes("network error") ||
      normalizedMessage.includes("network request failed") ||
      normalizedMessage.includes("fetch")
    ) {
      return new Error("Tidak ada koneksi internet. Periksa jaringan lalu coba lagi.");
    }

    if (
      normalizedMessage.includes("invalid login credentials") ||
      normalizedMessage.includes("email not found") ||
      normalizedMessage.includes("wrong password") ||
      normalizedMessage.includes("incorrect password") ||
      normalizedMessage.includes("incorrect email")
    ) {
      return new Error("Email atau password salah.");
    }

    if (normalizedMessage.includes("email not confirmed")) {
      return new Error("Email belum diverifikasi. Cek inbox atau folder spam lalu coba login lagi.");
    }

    if (
      normalizedMessage.includes("user already registered") ||
      normalizedMessage.includes("already been registered") ||
      normalizedMessage.includes("already registered")
    ) {
      return new Error("Email sudah terdaftar. Silakan gunakan halaman login.");
    }

    if (
      normalizedMessage.includes("password should be at least") ||
      normalizedMessage.includes("password length") ||
      normalizedMessage.includes("password must be")
    ) {
      return new Error("Password terlalu pendek. Gunakan password yang lebih kuat.");
    }

    if (
      normalizedMessage.includes("invalid email") ||
      normalizedMessage.includes("email address is invalid") ||
      normalizedMessage.includes("unable to validate email address")
    ) {
      return new Error("Format email tidak valid. Periksa kembali alamat email Anda.");
    }

    if (normalizedMessage.includes("profile not found")) {
      return new Error("Akun ditemukan, tetapi profil pengguna belum lengkap. Hubungi admin.");
    }

    if (normalizedMessage.includes("disabled")) {
      return new Error("Akun Anda telah dinonaktifkan. Hubungi tim dukungan.");
    }

    return new Error(rawMessage || fallbackMessage);
  }

  async login(
    email: string,
    password: string
  ): Promise<{ session: Session; roleId: number; status: string }> {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new Error("Tidak ada koneksi internet. Periksa jaringan lalu coba lagi.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw this.getFriendlyAuthError(error, "Gagal masuk. Silakan coba lagi.");

    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("role_id, status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profileData) {
      await supabase.auth.signOut();
      throw this.getFriendlyAuthError(
        profileError || new Error("profile not found"),
        "Akun ditemukan, tetapi profil pengguna belum lengkap. Hubungi admin."
      );
    }

    if (profileData.status === "disabled") {
      await supabase.auth.signOut();
      throw new Error("Akun Anda telah dinonaktifkan. Hubungi tim dukungan.");
    }

    await activityLogService.recordLog(
      data.user.id,
      "User Login",
      "User logged into the system"
    );

    return {
      session: data.session!,
      roleId: profileData.role_id,
      status: profileData.status,
    };
  }

  async register(params: RegisterParams): Promise<string> {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new Error("Tidak ada koneksi internet. Periksa jaringan lalu coba lagi.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
    });

    if (error) throw this.getFriendlyAuthError(error, "Registrasi gagal. Silakan coba lagi.");
    if (!data.user) throw new Error("Registrasi gagal. Silakan coba lagi.");

    const { error: dbError } = await supabase.from("users").insert([
      {
        id: data.user.id,
        role_id: 2, 
        email: params.email,
        fullname: params.fullname,
        institution: params.institution || null,
        profession: params.profession || null,
      },
    ]);

    if (!dbError) {
      await activityLogService.recordLog(
        data.user.id,
        "User Registration",
        "New user account created"
      );
    } else {
      console.error("[UserService] Gagal menyimpan profil ke DB:", dbError);
      await supabase.auth.signOut();
      throw this.getFriendlyAuthError(
        dbError,
        "Registrasi gagal saat menyimpan profil pengguna. Coba lagi atau hubungi admin."
      );
    }

    return data.user.id;
  }

  async logout(userId?: string): Promise<void> {
    if (userId) {
      await activityLogService.recordLog(
        userId,
        "User Logout",
        "User logged out of the system"
      );
    }
    await supabase.auth.signOut();
  }

  async updateProfile(userId: string, params: UpdateProfileParams): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({
        fullname: params.fullname,
        profession: params.profession,
        institution: params.institution,
      })
      .eq("id", userId);

    if (error) throw this.getFriendlyAuthError(error, "Gagal memperbarui profil.");
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw this.getFriendlyAuthError(error, "Gagal memperbarui password.");
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profile picture")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw this.getFriendlyAuthError(uploadError, "Gagal mengunggah avatar.");

    const { data } = supabase.storage
      .from("profile picture")
      .getPublicUrl(fileName);

    const publicUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("users")
      .update({ profile_image: publicUrl })
      .eq("id", userId);

    if (updateError) throw this.getFriendlyAuthError(updateError, "Gagal menyimpan avatar.");

    return publicUrl;
  }

  async removeAvatar(userId: string, currentImageUrl: string): Promise<void> {
    const fileName = currentImageUrl.split("/").pop();
    if (fileName) {
      await supabase.storage.from("profile picture").remove([fileName]);
    }

    const { error } = await supabase
      .from("users")
      .update({ profile_image: null })
      .eq("id", userId);

    if (error) throw this.getFriendlyAuthError(error, "Gagal menghapus avatar.");
  }
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[UserService] Gagal mengambil profil:", error.message);
      return null;
    }

    return data as UserProfile | null;
  }
}

export const userService = new UserService();
