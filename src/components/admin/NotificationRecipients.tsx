import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, RefreshCw, Mail, Plus, Trash2 } from "lucide-react";

export function NotificationRecipients() {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", "notification_recipients")
      .maybeSingle();

    if (data) {
      try {
        setRecipients(JSON.parse(data.value));
      } catch {
        setRecipients([]);
      }
    } else {
      // Default recipient
      setRecipients(["oliyadtesfaye2020@gmail.com"]);
    }
    setLoading(false);
  };

  const addRecipient = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (recipients.includes(email)) {
      toast.error("This email is already in the list");
      return;
    }
    setRecipients([...recipients, email]);
    setNewEmail("");
  };

  const removeRecipient = (email: string) => {
    if (recipients.length <= 1) {
      toast.error("You must have at least one recipient");
      return;
    }
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleSave = async () => {
    if (recipients.length === 0) {
      toast.error("Add at least one recipient");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert(
          {
            key: "notification_recipients",
            value: JSON.stringify(recipients),
            label: "Notification Recipients",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );
      if (error) throw error;
      toast.success("Notification recipients saved!");
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Notification Recipients</h2>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <p className="text-muted-foreground text-sm mb-6">
        Manage the email addresses that receive notifications when someone submits the contact form.
      </p>

      {/* Add new recipient */}
      <div className="flex gap-2 mb-4">
        <Input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Enter email address"
          type="email"
          className="bg-background/50"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRecipient())}
        />
        <Button onClick={addRecipient} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Recipients list */}
      <div className="space-y-2">
        {recipients.map((email) => (
          <div
            key={email}
            className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium">{email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeRecipient(email)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
