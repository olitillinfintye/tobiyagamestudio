import { useQuery } from "@tanstack/react-query";
import { FileText, Layers, Mail, Send } from "lucide-react";
import { request } from "@/integrations/cpanel/client";

type Overview = { projects: number; publishedPosts: number; unreadMessages: number; pendingEmails: number };

export default function CmsOverview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["cms-overview"],
    queryFn: async () => {
      const result = await request<Overview>("overview");
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    refetchInterval: 60000,
  });
  if (isLoading) return <p role="status">Loading overview...</p>;
  if (error || !data) return <p role="alert">Overview unavailable. Please try again.</p>;
  return (
    <section aria-label="CMS overview" className="space-y-6">
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-6 border-y border-border py-6">
        {[
          { label: "Projects", value: data.projects, icon: Layers },
          { label: "Published posts", value: data.publishedPosts, icon: FileText },
          { label: "Unread messages", value: data.unreadMessages, icon: Mail },
          { label: "Pending emails", value: data.pendingEmails, icon: Send },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="min-w-0">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4 shrink-0" />{label}</dt>
            <dd className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted-foreground">Visitor analytics unavailable.</p>
    </section>
  );
}