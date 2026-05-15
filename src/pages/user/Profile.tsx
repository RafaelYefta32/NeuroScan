import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your account details.</p>
      </header>

      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg font-semibold">DR</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-display text-lg font-semibold">Dr. Maria Reyes</div>
            <div className="text-sm text-muted-foreground">Neuroradiologist · St. Luke's Medical</div>
          </div>
        </div>

        <Separator className="my-6" />

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input defaultValue="Maria Reyes" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="dr.reyes@neuroscan.io" />
            </div>
            <div className="space-y-2">
              <Label>Specialty</Label>
              <Input defaultValue="Neuroradiology" />
            </div>
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input defaultValue="St. Luke's Medical" />
            </div>
          </div>
          <Button className="bg-gradient-primary hover:opacity-95">Save changes</Button>
        </form>
      </Card>

      <Card className="p-6 md:p-8">
        <h2 className="font-display text-lg font-semibold">Change password</h2>
        <form className="mt-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <Label>Current password</Label>
            <Input type="password" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" />
            </div>
            <div className="space-y-2">
              <Label>Confirm password</Label>
              <Input type="password" />
            </div>
          </div>
          <Button variant="outline">Update password</Button>
        </form>
      </Card>
    </div>
  );
}
