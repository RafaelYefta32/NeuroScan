import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/UserService";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, Camera, X } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullname, setFullname] = useState("");
  const [profession, setProfession] = useState("");
  const [institution, setInstitution] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullname(profile.fullname || "");
      setProfession(profile.profession || "");
      setInstitution(profile.institution || "");
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoadingProfile(true);
    try {
      await userService.updateProfile(user.id, { fullname, profession, institution });
      await refreshProfile();
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      if (!user) throw new Error("User not found.");

      const file = event.target.files[0];

      await userService.uploadAvatar(user.id, file);
      await refreshProfile();
      toast.success("Profile picture updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      if (!profile?.profile_image || !user) return;

      await userService.removeAvatar(user.id, profile.profile_image);
      await refreshProfile();
      toast.success("Profile picture removed!");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoadingPassword(true);
    try {
      await userService.updatePassword(newPassword);
      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password.");
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your account details.</p>
      </header>

      <Card className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <Avatar className="h-24 w-24 transition-opacity group-hover:opacity-80 ring-4 ring-background shadow-sm">
                <AvatarImage src={profile?.profile_image || undefined} className="object-cover" />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-semibold">
                  {profile?.fullname?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {uploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
                disabled={uploadingAvatar}
              />
            </div>
            
            {profile?.profile_image && !uploadingAvatar && (
              <button 
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute 0 right-0 top-0 rounded-full bg-destructive p-1.5 text-white shadow-sm transition-transform hover:scale-110 hover:bg-destructive/90"
                title="Remove profile picture"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left space-y-1 mt-2 sm:mt-4">
            <div className="font-display text-2xl font-semibold tracking-tight">{profile?.fullname || "User"}</div>
            <div className="text-sm text-muted-foreground font-medium">{profile?.profession || "User"} · {profile?.institution || "-"}</div>
          </div>
        </div>

        <Separator className="my-6" />

        <form className="space-y-4" onSubmit={handleUpdateProfile}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
               <Label htmlFor="fullname">Full name</Label>
               <Input 
                 id="fullname"
                 value={fullname} 
                 onChange={(e) => setFullname(e.target.value)} 
               />
             </div>
             <div className="space-y-2">
               <Label>Email</Label>
               <Input defaultValue={user?.email || ""} readOnly className="bg-muted text-muted-foreground" />
             </div>
             <div className="space-y-2">
               <Label htmlFor="profession">Profession</Label>
               <Input 
                 id="profession"
                 value={profession} 
                 onChange={(e) => setProfession(e.target.value)} 
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="institution">Institution</Label>
               <Input 
                 id="institution"
                 value={institution} 
                 onChange={(e) => setInstitution(e.target.value)} 
               />
             </div>
           </div>
          <Button type="submit" disabled={loadingProfile} className="bg-gradient-primary hover:opacity-95">
            {loadingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </form>
      </Card>

      <Card className="p-6 md:p-8">
        <h2 className="font-display text-lg font-semibold">Change password</h2>
        <form className="mt-4 space-y-4" onSubmit={handleUpdatePassword}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input 
                id="newPassword"
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input 
                id="confirmPassword"
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" variant="outline" disabled={loadingPassword}>
            {loadingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update password
          </Button>
        </form>
      </Card>
    </div>
  );
}
