import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Trash2, Eye, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function ContactSubmissions() {
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const queryClient = useQueryClient();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['contact-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ContactSubmission[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ read: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      toast.success("Submission deleted");
      setSelectedSubmission(null);
    },
    onError: () => {
      toast.error("Failed to delete submission");
    },
  });

  const handleViewSubmission = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    if (!submission.read) {
      markAsReadMutation.mutate(submission.id);
    }
  };

  // Real-time subscription for new submissions
  useEffect(() => {
    const channel = supabase
      .channel('contact-submissions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_submissions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const unreadCount = submissions?.filter(s => !s.read).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Contact Submissions</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} new</Badge>
          )}
        </div>
      </div>

      {submissions?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No contact submissions yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions?.map((submission) => (
            <Card 
              key={submission.id} 
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${!submission.read ? 'border-primary/50 bg-primary/5' : ''}`}
              onClick={() => handleViewSubmission(submission)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{submission.name}</span>
                      {!submission.read && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{submission.email}</p>
                    <p className="text-sm font-medium mt-1 truncate">{submission.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{submission.message}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(submission.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Submission Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Message
            </DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">From</label>
                  <p className="font-medium">{selectedSubmission.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-medium">
                    <a href={`mailto:${selectedSubmission.email}`} className="text-primary hover:underline">
                      {selectedSubmission.email}
                    </a>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Subject</label>
                <p className="font-medium">{selectedSubmission.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Message</label>
                <div className="mt-1 p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Received: {format(new Date(selectedSubmission.created_at), 'MMMM d, yyyy at h:mm a')}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = `mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject}`}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Reply
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(selectedSubmission.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
