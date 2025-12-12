import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function SuggestionForm() {
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      return apiRequest("POST", "/api/suggestions", data);
    },
    onSuccess: () => {
      toast({
        title: "Thank you!",
        description: "Your suggestion has been submitted successfully.",
        className: "bg-green-500 text-white border-green-600",
      });
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit suggestion. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) {
      toast({
        title: "Message too short",
        description: "Please provide at least 10 characters.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ message });
  };

  return (
    <section className="bg-muted/50 py-16">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="mb-3 text-2xl font-bold sm:text-3xl" data-testid="text-suggestions-title">
          Share Your Suggestions
        </h2>
        <p className="mb-8 text-muted-foreground">
          Help us improve SaralDocs with your valuable feedback
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your suggestion here..."
            className="min-h-32 resize-none border-border bg-card"
            data-testid="input-suggestion"
          />
          <Button
            type="submit"
            className="gap-2"
            disabled={mutation.isPending}
            data-testid="button-submit-suggestion"
          >
            <Send className="h-4 w-4" />
            {mutation.isPending ? "Sending..." : "Send Suggestion"}
          </Button>
        </form>
      </div>
    </section>
  );
}
