import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Trash2, Eye, Loader2, LogIn, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Document } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function History() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  const { data: documents, isLoading, refetch } = useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: async () => {
      const response = await fetch("/api/documents");
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
  });

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete");
      
      toast({
        title: "Document deleted",
        description: "The document has been removed from history.",
      });
      
      refetch();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete document.",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      const response = await fetch("/api/documents", {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to clear");
      
      const data = await response.json();
      toast({
        title: "All documents cleared",
        description: `${data.deletedCount || 0} documents have been removed from history.`,
      });
      
      setShowClearAllDialog(false);
      refetch();
    } catch {
      toast({
        title: "Error",
        description: "Failed to clear documents.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="mb-3 text-2xl font-bold sm:text-3xl" data-testid="text-history-title">
                Document History
              </h1>
              <p className="text-muted-foreground">
                Your previously simplified documents (stored for 7 days)
              </p>
            </div>
            {documents && documents.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearAllDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !user ? (
          <Card className="mx-auto max-w-md">
            <CardContent className="py-8 text-center">
              <LogIn className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Login Required</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Please sign in to view your document history
              </p>
              <Button asChild>
                <Link href="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In to Continue
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base font-medium">
                        {doc.fileName || "Untitled Document"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {doc.targetLanguage.toUpperCase()} • {doc.createdAt && formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {doc.simplifiedText?.substring(0, 200)}...
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-medium">No Documents Yet</h3>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Your simplified documents will appear here.
                <br />
                Documents are automatically deleted after 7 days.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Documents auto-delete after 7 days for your privacy
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.fileName || "Document Details"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div>
                <h4 className="font-medium mb-2">Simplified Text</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedDoc?.simplifiedText}
                </p>
              </div>
              {selectedDoc?.glossary && selectedDoc.glossary.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Glossary</h4>
                  <div className="space-y-2">
                    {selectedDoc.glossary.map((term, idx) => (
                      <div key={idx} className="bg-muted p-2 rounded">
                        <span className="font-medium">{term.term}:</span>{" "}
                        <span className="text-muted-foreground">{term.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Documents</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all documents from your history? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              disabled={isClearing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isClearing ? "Clearing..." : "Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Footer />
    </div>
  );
}
