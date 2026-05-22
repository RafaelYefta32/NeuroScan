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
  async login(
    email: string,
    password: string
  ): Promise<{ session: Session; roleId: number; status: string }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("role_id, status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profileData) {
      await supabase.auth.signOut();
      throw new Error(
        `Profil tidak ditemukan. (${profileError?.message || "Diblokir oleh RLS / Data tidak ada"}). Hubungi admin.`
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
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
    });

    if (error) throw new Error(error.message);
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

    if (error) throw new Error(error.message);
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw new Error(error.message);
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profile picture")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage
      .from("profile picture")
      .getPublicUrl(fileName);

    const publicUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("users")
      .update({ profile_image: publicUrl })
      .eq("id", userId);

    if (updateError) throw new Error(updateError.message);

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

    if (error) throw new Error(error.message);
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
