import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  
  // Profile State
  const [fullname, setFullname] = useState("");
  const [profession, setProfession] = useState("");
  const [institution, setInstitution] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Password State
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
      const { error } = await supabase
        .from("users")
        .update({
          fullname,
          profession,
          institution,
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setLoadingProfile(false);
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
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

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
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg font-semibold">
              {profile?.fullname?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-display text-lg font-semibold">{profile?.fullname || "User"}</div>
            <div className="text-sm text-muted-foreground">{profile?.profession || "User"} · {profile?.institution || "-"}</div>
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
