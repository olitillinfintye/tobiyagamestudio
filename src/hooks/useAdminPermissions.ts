import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type AdminPermission = 'messages' | 'blog' | 'projects' | 'team' | 'awards' | 'settings' | 'analytics' | 'users' | 'services';

interface UseAdminPermissionsReturn {
  permissions: AdminPermission[];
  isSuperAdmin: boolean;
  loading: boolean;
  hasPermission: (permission: AdminPermission) => boolean;
}

export function useAdminPermissions(): UseAdminPermissionsReturn {
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Check if super admin
        const { data: adminData } = await supabase
          .from("admin_users")
          .select("is_super_admin")
          .eq("user_id", user.id)
          .maybeSingle();

        if (adminData?.is_super_admin) {
          setIsSuperAdmin(true);
          setPermissions(['messages', 'blog', 'projects', 'team', 'awards', 'settings', 'analytics', 'users', 'services']);
        } else {
          // Fetch specific permissions
          const { data: permData } = await supabase
            .from("admin_permissions")
            .select("permission")
            .eq("user_id", user.id);

          setPermissions((permData || []).map(p => p.permission as AdminPermission));
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchPermissions();
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasPermission = (permission: AdminPermission): boolean => {
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  };

  return { permissions, isSuperAdmin, loading, hasPermission };
}
