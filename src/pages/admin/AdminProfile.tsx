import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, Building2, KeyRound } from "lucide-react";

export default function AdminProfile() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Admin Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your admin account and security settings.</p>
      </header>

      {/* Identity Card */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-semibold">
              AD
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-display text-xl font-semibold">Admin</div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Shield className="mr-1 h-3 w-3" />
                Super Admin
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                admin@neuroscan.io
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                NeuroScan System
              </span>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Last login: May 7, 2026 · 09:14 AM
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6 md:p-8">
        <h2 className="font-display text-lg font-semibold">Personal Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">Update your name and contact details.</p>
        <Separator className="my-6" />
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input defaultValue="Admin" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="admin@neuroscan.io" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input defaultValue="Super Admin" disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input defaultValue="NeuroScan System" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="bg-gradient-primary hover:opacity-95">Save changes</Button>
          </div>
        </form>
      </Card>

      {/* Security */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Security</h2>
            <p className="text-sm text-muted-foreground">Change your password to keep your account secure.</p>
          </div>
        </div>
        <Separator className="my-6" />
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <Label>Current password</Label>
            <Input type="password" placeholder="Enter current password" />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <Label>Confirm new password</Label>
              <Input type="password" placeholder="Confirm new password" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline">Update password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
