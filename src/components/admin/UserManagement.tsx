import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Shield, User, Crown } from "lucide-react";

type AdminPermission = 'messages' | 'blog' | 'projects' | 'team' | 'awards' | 'settings' | 'analytics' | 'users';

interface AdminUser {
  id: string;
  user_id: string;
  is_super_admin: boolean;
  created_at: string;
  email?: string;
  permissions: AdminPermission[];
}

const AVAILABLE_PERMISSIONS: { value: AdminPermission; label: string }[] = [
  { value: 'messages', label: 'Messages' },
  { value: 'blog', label: 'Blog' },
  { value: 'projects', label: 'Projects' },
  { value: 'team', label: 'Team' },
  { value: 'awards', label: 'Awards' },
  { value: 'settings', label: 'Settings' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'users', label: 'Users' },
];

export default function UserManagement() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<AdminPermission[]>([]);
  const [makeSuperAdmin, setMakeSuperAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkSuperAdmin();
    fetchAdminUsers();
  }, []);

  const checkSuperAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
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

      // Add to admin_users table
      const { error: adminError } = await supabase
        .from("admin_users")
        .insert({
          user_id: authData.user.id,
          is_super_admin: makeSuperAdmin,
        });

      if (adminError) throw adminError;

      // Add permissions if not super admin
      if (!makeSuperAdmin && selectedPermissions.length > 0) {
        const permissionInserts = selectedPermissions.map((permission) => ({
          user_id: authData.user!.id,
          permission,
        }));

        const { error: permError } = await supabase
          .from("admin_permissions")
          .insert(permissionInserts);

        if (permError) throw permError;
      }

      toast.success("Admin user created successfully!");
      setDialogOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setSelectedPermissions([]);
      setMakeSuperAdmin(false);
      fetchAdminUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isSuperAdmin) {
      toast.error("Only super admins can delete users");
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

  const handleTogglePermission = async (userId: string, permission: AdminPermission, hasPermission: boolean) => {
    if (!isSuperAdmin) {
      toast.error("Only super admins can modify permissions");
      return;
    }

    try {
      if (hasPermission) {
        // Remove permission
        const { error } = await supabase
          .from("admin_permissions")
          .delete()
          .eq("user_id", userId)
          .eq("permission", permission);

        if (error) throw error;
      } else {
        // Add permission
        const { error } = await supabase
          .from("admin_permissions")
          .insert({ user_id: userId, permission });

        if (error) throw error;
      }

      fetchAdminUsers();
      toast.success("Permission updated");
    } catch (error) {
      console.error("Error updating permission:", error);
      toast.error("Failed to update permission");
    }
  };

  const handleToggleSuperAdmin = async (userId: string, currentStatus: boolean) => {
    if (!isSuperAdmin) {
      toast.error("Only super admins can modify admin status");
      return;
    }

    try {
      const { error } = await supabase
        .from("admin_users")
        .update({ is_super_admin: !currentStatus })
        .eq("user_id", userId);

      if (error) throw error;

      fetchAdminUsers();
      toast.success(currentStatus ? "Super admin status removed" : "User promoted to super admin");
    } catch (error) {
      console.error("Error updating super admin status:", error);
      toast.error("Failed to update admin status");
    }
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
            Manage admin users and their permissions
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Admin User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Admin User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="superAdmin"
                  checked={makeSuperAdmin}
                  onCheckedChange={(checked) => setMakeSuperAdmin(checked as boolean)}
                />
                <Label htmlFor="superAdmin" className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Make Super Admin (all permissions)
                </Label>
              </div>

              {!makeSuperAdmin && (
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_PERMISSIONS.filter(p => p.value !== 'users').map((perm) => (
                      <div key={perm.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={perm.value}
                          checked={selectedPermissions.includes(perm.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPermissions([...selectedPermissions, perm.value]);
                            } else {
                              setSelectedPermissions(selectedPermissions.filter((p) => p !== perm.value));
                            }
                          }}
                        />
                        <Label htmlFor={perm.value}>{perm.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating..." : "Create Admin User"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
                  <TableHead>User ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-mono text-xs max-w-[150px] truncate">
                      {admin.user_id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {admin.is_super_admin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">
                            <Crown className="w-3 h-3" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/20 text-primary">
                            <User className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.is_super_admin ? (
                        <span className="text-muted-foreground text-sm">All permissions</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {AVAILABLE_PERMISSIONS.filter(p => p.value !== 'users').map((perm) => {
                            const hasPermission = admin.permissions.includes(perm.value);
                            return (
                              <button
                                key={perm.value}
                                onClick={() => handleTogglePermission(admin.user_id, perm.value, hasPermission)}
                                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                                  hasPermission
                                    ? "bg-primary/20 text-primary hover:bg-primary/30"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                              >
                                {perm.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleSuperAdmin(admin.user_id, admin.is_super_admin)}
                          title={admin.is_super_admin ? "Demote to Admin" : "Promote to Super Admin"}
                        >
                          <Crown className={`w-4 h-4 ${admin.is_super_admin ? "text-amber-400" : "text-muted-foreground"}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(admin.user_id)}
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
    </div>
  );
}
