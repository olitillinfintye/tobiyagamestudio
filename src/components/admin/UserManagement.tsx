import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Shield, User, Crown, Pencil, Check, X, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";

type AdminPermission = 'messages' | 'blog' | 'projects' | 'team' | 'awards' | 'settings' | 'analytics' | 'users' | 'services';

interface AdminUser {
  id: string;
  user_id: string;
  is_super_admin: boolean;
  created_at: string;
  email?: string;
  permissions: AdminPermission[];
}

const AVAILABLE_PERMISSIONS: { value: AdminPermission; label: string; description: string }[] = [
  { value: 'analytics', label: 'Analytics', description: 'View site analytics and statistics' },
  { value: 'messages', label: 'Messages', description: 'View and manage contact messages' },
  { value: 'blog', label: 'Blog', description: 'Create, edit, and delete blog posts' },
  { value: 'projects', label: 'Projects', description: 'Manage portfolio projects' },
  { value: 'team', label: 'Team', description: 'Manage team members' },
  { value: 'awards', label: 'Awards', description: 'Manage awards and achievements' },
  { value: 'services', label: 'Services', description: 'Manage services offered' },
  { value: 'settings', label: 'Settings', description: 'Manage site settings and partners' },
  { value: 'users', label: 'Users', description: 'Manage admin users (Super Admin only)' },
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', description: 'Limited permissions based on assigned roles' },
  { value: 'super_admin', label: 'Super Admin', description: 'Full access to all features' },
];

export default function UserManagement() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<AdminPermission[]>([]);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'super_admin'>('admin');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkSuperAdmin();
    fetchAdminUsers();
  }, []);

  const checkSuperAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data } = await supabase
        .from("admin_users")
        .select("is_super_admin")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsSuperAdmin(data?.is_super_admin || false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const { data: admins, error } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch permissions for each admin
      const adminsWithPermissions = await Promise.all(
        (admins || []).map(async (admin) => {
          const { data: permissions } = await supabase
            .from("admin_permissions")
            .select("permission")
            .eq("user_id", admin.user_id);

          return {
            ...admin,
            permissions: (permissions || []).map((p) => p.permission as AdminPermission),
          };
        })
      );

      setAdminUsers(adminsWithPermissions);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      toast.error("Failed to load admin users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error("Only super admins can create users");
      return;
    }

    setSubmitting(true);
    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      const isSuperAdminRole = selectedRole === 'super_admin';

      // Add to admin_users table
      const { error: adminError } = await supabase
        .from("admin_users")
        .insert({
          user_id: authData.user.id,
          is_super_admin: isSuperAdminRole,
        });

      if (adminError) throw adminError;

      // Add permissions if not super admin
      if (!isSuperAdminRole && selectedPermissions.length > 0) {
        const permissionInserts = selectedPermissions.map((permission) => ({
          user_id: authData.user!.id,
          permission: permission as any,
        }));

        const { error: permError } = await supabase
          .from("admin_permissions")
          .insert(permissionInserts);

        if (permError) throw permError;
      }

      toast.success("Admin user created successfully!");
      resetForm();
      fetchAdminUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDialogOpen(false);
    setNewUserEmail("");
    setNewUserPassword("");
    setSelectedPermissions([]);
    setSelectedRole('admin');
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isSuperAdmin) {
      toast.error("Only super admins can delete users");
      return;
    }

    if (userId === currentUserId) {
      toast.error("You cannot delete your own account");
      return;
    }

    if (!confirm("Are you sure you want to remove this admin user?")) return;

    try {
      // Delete from admin_permissions first
      await supabase
        .from("admin_permissions")
        .delete()
        .eq("user_id", userId);

      // Delete from admin_users
      const { error } = await supabase
        .from("admin_users")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Admin user removed");
      fetchAdminUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setSelectedPermissions(user.permissions);
    setSelectedRole(user.is_super_admin ? 'super_admin' : 'admin');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !isSuperAdmin) return;

    setSubmitting(true);
    try {
      const isSuperAdminRole = selectedRole === 'super_admin';

      // Update admin_users
      const { error: adminError } = await supabase
        .from("admin_users")
        .update({ is_super_admin: isSuperAdminRole })
        .eq("user_id", editingUser.user_id);

      if (adminError) throw adminError;

      // Delete all existing permissions
      await supabase
        .from("admin_permissions")
        .delete()
        .eq("user_id", editingUser.user_id);

      // Add new permissions if not super admin
      if (!isSuperAdminRole && selectedPermissions.length > 0) {
        const permissionInserts = selectedPermissions.map((permission) => ({
          user_id: editingUser.user_id,
          permission: permission as any,
        }));

        const { error: permError } = await supabase
          .from("admin_permissions")
          .insert(permissionInserts);

        if (permError) throw permError;
      }

      toast.success("User updated successfully!");
      setEditDialogOpen(false);
      setEditingUser(null);
      fetchAdminUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePermission = (permission: AdminPermission) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permission));
    } else {
      setSelectedPermissions([...selectedPermissions, permission]);
    }
  };

  const handleSelectAllPermissions = () => {
    const allNonUserPermissions = AVAILABLE_PERMISSIONS
      .filter(p => p.value !== 'users')
      .map(p => p.value);
    setSelectedPermissions(allNonUserPermissions);
  };

  const handleClearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            Only super admins can manage users and permissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">User Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage admin users, roles, and permissions
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Admin User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Admin User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'admin' | 'super_admin')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          {role.value === 'super_admin' ? (
                            <Crown className="w-4 h-4 text-accent-foreground" />
                          ) : (
                            <User className="w-4 h-4 text-primary" />
                          )}
                          <span>{role.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {ROLE_OPTIONS.find(r => r.value === selectedRole)?.description}
                </p>
              </div>

              {selectedRole !== 'super_admin' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Permissions</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={handleSelectAllPermissions}>
                        Select All
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={handleClearAllPermissions}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                    {AVAILABLE_PERMISSIONS.filter(p => p.value !== 'users').map((perm) => (
                      <div
                        key={perm.value}
                        className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`create-${perm.value}`}
                          checked={selectedPermissions.includes(perm.value)}
                          onCheckedChange={() => handleTogglePermission(perm.value)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`create-${perm.value}`} className="cursor-pointer font-medium">
                            {perm.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{perm.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adminUsers.length}</p>
              <p className="text-sm text-muted-foreground">Total Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-accent">
              <Crown className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adminUsers.filter(u => u.is_super_admin).length}</p>
              <p className="text-sm text-muted-foreground">Super Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-secondary/10">
              <Shield className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adminUsers.filter(u => !u.is_super_admin).length}</p>
              <p className="text-sm text-muted-foreground">Regular Admins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Admin Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {admin.is_super_admin ? (
                            <Crown className="w-4 h-4 text-accent-foreground" />
                          ) : (
                            <User className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[200px]" title={admin.user_id}>
                            {admin.user_id.slice(0, 8)}...
                          </p>
                          {admin.user_id === currentUserId && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.is_super_admin ? (
                        <Badge variant="default" className="bg-accent text-accent-foreground">
                          <Crown className="w-3 h-3 mr-1" />
                          Super Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <User className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {admin.is_super_admin ? (
                        <span className="text-muted-foreground text-sm italic">All permissions</span>
                      ) : admin.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[250px]">
                          {admin.permissions.slice(0, 3).map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                          {admin.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{admin.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No permissions</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(admin.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(admin)}
                          title="Edit User"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(admin.user_id)}
                          disabled={admin.user_id === currentUserId}
                          title={admin.user_id === currentUserId ? "Cannot delete yourself" : "Delete User"}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-sm truncate">{editingUser.user_id}</p>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={selectedRole} 
                  onValueChange={(v) => setSelectedRole(v as 'admin' | 'super_admin')}
                  disabled={editingUser.user_id === currentUserId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          {role.value === 'super_admin' ? (
                            <Crown className="w-4 h-4 text-accent-foreground" />
                          ) : (
                            <User className="w-4 h-4 text-primary" />
                          )}
                          <span>{role.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingUser.user_id === currentUserId && (
                  <p className="text-xs text-destructive">You cannot change your own role</p>
                )}
              </div>

              {selectedRole !== 'super_admin' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Permissions</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={handleSelectAllPermissions}>
                        Select All
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={handleClearAllPermissions}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                    {AVAILABLE_PERMISSIONS.filter(p => p.value !== 'users').map((perm) => (
                      <div
                        key={perm.value}
                        className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`edit-${perm.value}`}
                          checked={selectedPermissions.includes(perm.value)}
                          onCheckedChange={() => handleTogglePermission(perm.value)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`edit-${perm.value}`} className="cursor-pointer font-medium">
                            {perm.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{perm.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}