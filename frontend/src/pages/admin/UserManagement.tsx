import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Search, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface DBUser {
  id: string;
  role_id: number;
  fullname: string | null;
  email: string | null;
  institution: string | null;
  profession: string | null;
  status: string;
  profile_image: string | null;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("any");

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DBUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    fullname: "",
    institution: "",
    profession: "",
    role_id: 2,
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [addForm, setAddForm] = useState({
    fullname: "",
    email: "",
    password: "",
    institution: "",
    profession: "",
    role_id: 2,
  });

  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset ke halaman 1 saat filter/search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter]);

  const handleToggleStatus = async (id: string, currentStatus: string, userFullName: string | null) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    try {
      const { error } = await supabase
        .from("users")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      
      setUsers(users.map((u) => (u.id === id ? { ...u, status: newStatus } : u)));
      
      if (currentUser) {
        await supabase.from("activity_logs").insert([{
          user_id: currentUser.id,
          activity: "User Status Changed",
          description: `Changed status of user ${userFullName || id} to ${newStatus}`
        }]);
      }
      
      toast.success(`User status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const openEditModal = (user: DBUser) => {
    setEditingUser(user);
    setEditForm({
      fullname: user.fullname || "",
      institution: user.institution || "",
      profession: user.profession || "",
      role_id: user.role_id,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const updates = {
        fullname: editForm.fullname,
        institution: editForm.institution,
        profession: editForm.profession,
        role_id: editForm.role_id,
      };

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", editingUser.id);

      if (error) throw error;

      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updates } : u));
      toast.success("User data updated successfully");
      setIsEditDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    if (!addForm.fullname || !addForm.email || !addForm.password) {
      toast.error("Name, email, and password are required.");
      return;
    }
    if (addForm.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setAddingUser(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const tempClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });

      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: addForm.email,
        password: addForm.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: dbError } = await tempClient.from("users").insert([
          {
            id: authData.user.id,
            role_id: addForm.role_id,
            email: addForm.email,
            fullname: addForm.fullname,
            institution: addForm.institution || null,
            profession: addForm.profession || null,
          },
        ]);

        if (dbError) throw dbError;

        toast.success("User created successfully!");
        setIsAddDialogOpen(false);
        setAddForm({
          fullname: "",
          email: "",
          password: "",
          institution: "",
          profession: "",
          role_id: 2,
        });
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setAddingUser(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.fullname || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "admin" && u.role_id === 1) ||
      (roleFilter === "user" && u.role_id === 2);

    const matchesStatus =
      statusFilter === "any" || (u.status || "active").toLowerCase() === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage clinicians, researchers, and admins.</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-95" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add user
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 pb-4">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              className="pl-9" 
              placeholder="Search users…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={u.profile_image || undefined} className="object-cover" />
                          <AvatarFallback className="bg-primary-soft text-primary text-xs">
                            {u.fullname ? u.fullname.substring(0, 2).toUpperCase() : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{u.fullname || "Unknown User"}</div>
                          <div className="text-xs text-muted-foreground">{u.email || "No email available"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{u.role_id === 1 ? "Admin" : "User"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          (u.status || "active") === "active"
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {u.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(u)}>
                            Edit user
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(u.id, u.status || "active", u.fullname)}>
                            {u.status === "active" ? "Disable user" : "Enable user"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && filteredUsers.length > 0 && (
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* Edit User Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editForm.fullname}
                onChange={(e) => setEditForm({ ...editForm, fullname: e.target.value })}
                placeholder="Dr. Jane Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input
                  value={editForm.institution}
                  onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                  placeholder="Hospital Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Profession</Label>
                <Input
                  value={editForm.profession}
                  onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
                  placeholder="Radiologist"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={editForm.role_id.toString()} 
                onValueChange={(val) => setEditForm({ ...editForm, role_id: parseInt(val) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Admin</SelectItem>
                  <SelectItem value="2">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="bg-gradient-primary" onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={addForm.fullname}
                onChange={(e) => setAddForm({ ...addForm, fullname: e.target.value })}
                placeholder="Dr. Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="jane@hospital.org"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input
                  value={addForm.institution}
                  onChange={(e) => setAddForm({ ...addForm, institution: e.target.value })}
                  placeholder="Hospital Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Profession</Label>
                <Input
                  value={addForm.profession}
                  onChange={(e) => setAddForm({ ...addForm, profession: e.target.value })}
                  placeholder="Radiologist"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={addForm.role_id.toString()} 
                onValueChange={(val) => setAddForm({ ...addForm, role_id: parseInt(val) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Admin</SelectItem>
                  <SelectItem value="2">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={addingUser}>
              Cancel
            </Button>
            <Button className="bg-gradient-primary" onClick={handleAddUser} disabled={addingUser}>
              {addingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
