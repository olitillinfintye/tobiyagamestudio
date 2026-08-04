import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, ArrowLeft, Layers, Users, Trophy, Settings, BarChart3, Mail, FileText, UserCog, Briefcase, Handshake } from "lucide-react";
import { Link } from "react-router-dom";
import AdminAuth, { type AuthMode } from "@/components/admin/AdminAuth";
import { isPasswordRecoveryLink } from "@/lib/recoveryLink";
import { ProjectsManagement } from "@/components/admin/ProjectsManagement";
import { TeamManagement } from "@/components/admin/TeamManagement";
import { AwardsManagement } from "@/components/admin/AwardsManagement";
import { SettingsManagement } from "@/components/admin/SettingsManagement";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import ContactSubmissions from "@/components/admin/ContactSubmissions";
import BlogManagement from "@/components/admin/BlogManagement";
import UserManagement from "@/components/admin/UserManagement";
import { ServicesManagement } from "@/components/admin/ServicesManagement";
import { PartnersManagement } from "@/components/admin/PartnersManagement";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  // isPasswordRecoveryLink is captured in main.tsx before supabase-js strips the
  // hash; PASSWORD_RECOVERY below is the belt-and-braces path for the same thing.
  const [authMode, setAuthMode] = useState<AuthMode>(
    isPasswordRecoveryLink ? "reset" : "login",
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Recovery creates a real session, so this must be handled before the
      // normal signed-in path or the dashboard would render instead of the
      // "set a new password" form.
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("reset");
        setUser(session?.user ?? null);
        setLoading(false);
        return;
      }

      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user.id);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Strip the recovery tokens out of the address bar once they've been consumed.
  useEffect(() => {
    if (authMode === "reset" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [authMode]);

  const handleResetComplete = async () => {
    setAuthMode("login");
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) await checkAdmin(session.user.id);
  };

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.from("admin_users").select("*").eq("user_id", userId).maybeSingle();
    setIsAdmin(!!data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  // Recovery takes priority over the signed-in state: the email link creates a
  // session, but the user still has to choose a new password.
  if (authMode === "reset") {
    return (
      <AdminAuth
        mode="reset"
        onModeChange={setAuthMode}
        onResetComplete={handleResetComplete}
      />
    );
  }

  if (!user) {
    return (
      <AdminAuth
        mode={authMode}
        onModeChange={setAuthMode}
        onResetComplete={handleResetComplete}
      />
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="glass-card p-8 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have admin access.</p>
          <Button onClick={handleLogout} variant="outline">Logout</Button>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { hasPermission, isSuperAdmin, loading: permLoading } = useAdminPermissions();

  if (permLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading permissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-primary mb-2 hover:underline text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to site
            </Link>
            <h1 className="font-display text-3xl font-bold">Content Manager</h1>
          </div>
          <Button onClick={onLogout} variant="outline">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        <Tabs defaultValue="analytics" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-5 sm:grid-cols-10 gap-1 h-auto p-1">
            {hasPermission('analytics') && (
              <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            )}
            {hasPermission('messages') && (
              <TabsTrigger value="messages" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
            )}
            {hasPermission('blog') && (
              <TabsTrigger value="blog" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Blog</span>
              </TabsTrigger>
            )}
            {hasPermission('services') && (
              <TabsTrigger value="services" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Services</span>
              </TabsTrigger>
            )}
            {hasPermission('settings') && (
              <TabsTrigger value="partners" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
                <Handshake className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Partners</span>
              </TabsTrigger>
            )}
            {hasPermission('projects') && (
              <TabsTrigger value="projects" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
                <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Projects</span>
              </TabsTrigger>
            )}
            {hasPermission('team') && (
              <TabsTrigger value="team" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Team</span>
              </TabsTrigger>
            )}
            {hasPermission('awards') && (
              <TabsTrigger value="awards" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Awards</span>
              </TabsTrigger>
            )}
            {hasPermission('settings') && (
              <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            )}
            {hasPermission('users') && (
              <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
                <UserCog className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
            )}
          </TabsList>

          {hasPermission('analytics') && (
            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>
          )}

          {hasPermission('messages') && (
            <TabsContent value="messages">
              <ContactSubmissions />
            </TabsContent>
          )}

          {hasPermission('blog') && (
            <TabsContent value="blog">
              <BlogManagement />
            </TabsContent>
          )}

          {hasPermission('services') && (
            <TabsContent value="services">
              <ServicesManagement />
            </TabsContent>
          )}

          {hasPermission('settings') && (
            <TabsContent value="partners">
              <PartnersManagement />
            </TabsContent>
          )}

          {hasPermission('projects') && (
            <TabsContent value="projects">
              <ProjectsManagement />
            </TabsContent>
          )}

          {hasPermission('team') && (
            <TabsContent value="team">
              <TeamManagement />
            </TabsContent>
          )}

          {hasPermission('awards') && (
            <TabsContent value="awards">
              <AwardsManagement />
            </TabsContent>
          )}

          {hasPermission('settings') && (
            <TabsContent value="settings">
              <SettingsManagement />
            </TabsContent>
          )}

          {hasPermission('users') && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
