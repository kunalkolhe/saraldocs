import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Redirect } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Eye, FileText, Calendar, Languages, Clock, History as HistoryIcon } from "lucide-react";

interface FileHistoryRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  original_text: string;
  simplified_text: string;
  glossary: { term: string; definition: string }[];
  sections: { heading: string; content: string }[];
  source_language: string;
  target_language: string;
  created_at: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  pa: "Punjabi",
  or: "Odia",
  ur: "Urdu",
};

export default function History() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRecord, setSelectedRecord] = useState<FileHistoryRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: history, isLoading } = useQuery<FileHistoryRecord[]>({
    queryKey: ["/api/history"],
    queryFn: async () => {
      const res = await fetch("/api/history", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          setLocation("/login");
          return [];
        }
        throw new Error("Failed to fetch history");
      }
      return res.json();
    },
    enabled: !!user,
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/history", {});
      if (!res.ok) throw new Error("Failed to clear history");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      toast({
        title: "History Cleared",
        description: "All your file history has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear history. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/history/${id}`, {});
      if (!res.ok) throw new Error("Failed to delete record");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      toast({
        title: "Record Deleted",
        description: "The history record has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const getDaysRemaining = (dateString: string) => {
    const date = new Date(dateString);
    const expiryDate = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return Math.max(0, diffDays);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/20">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user && !authLoading) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Header />

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <HistoryIcon className="h-6 w-6" />
                File History
              </h1>
              <p className="text-muted-foreground mt-1">
                Your processed documents from the last 7 days
              </p>
            </div>

            {history && history.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All History?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your file history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => clearHistoryMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {clearHistoryMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Delete All"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !history || history.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No History Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your processed documents will appear here for 7 days
                </p>
                <Button onClick={() => setLocation("/upload")}>
                  Upload a Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <Card key={record.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{record.file_name}</span>
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(record.created_at)}
                          </span>
                          <span className="text-muted-foreground">|</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getTimeAgo(record.created_at)}
                          </span>
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        {getDaysRemaining(record.created_at)} days left
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Languages className="h-3 w-3" />
                        {LANGUAGE_NAMES[record.source_language] || record.source_language}
                        {" → "}
                        {LANGUAGE_NAMES[record.target_language] || record.target_language}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {record.simplified_text.substring(0, 150)}...
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(record);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{record.file_name}" from your history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteRecordMutation.mutate(record.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedRecord?.file_name}
            </DialogTitle>
            <DialogDescription>
              Processed on {selectedRecord && formatDate(selectedRecord.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <Tabs defaultValue="simplified" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="simplified">Simplified</TabsTrigger>
                <TabsTrigger value="original">Original</TabsTrigger>
                <TabsTrigger value="glossary">Glossary ({selectedRecord.glossary?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="simplified" className="mt-4">
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  {selectedRecord.sections && selectedRecord.sections.length > 0 ? (
                    <div className="space-y-4">
                      {selectedRecord.sections.map((section, index) => (
                        <div key={index}>
                          <h3 className="font-semibold text-lg mb-2">{section.heading}</h3>
                          <p className="text-muted-foreground whitespace-pre-wrap">{section.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{selectedRecord.simplified_text}</p>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="original" className="mt-4">
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <p className="whitespace-pre-wrap text-sm">{selectedRecord.original_text}</p>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="glossary" className="mt-4">
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  {selectedRecord.glossary && selectedRecord.glossary.length > 0 ? (
                    <div className="space-y-3">
                      {selectedRecord.glossary.map((item, index) => (
                        <div key={index} className="border-b pb-3 last:border-0">
                          <dt className="font-medium">{item.term}</dt>
                          <dd className="text-muted-foreground text-sm mt-1">{item.definition}</dd>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No glossary items</p>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
