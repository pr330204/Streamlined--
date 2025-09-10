
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { checkMovieLinkAction } from "@/lib/actions";
import { Loader2 } from "lucide-react";
import type { Movie } from "@/lib/types";
import { getYouTubeEmbedUrl, getYouTubeVideoId } from "@/lib/utils";

const formSchema = z.object({
  movieTitle: z.string().min(1, "Movie title is required."),
  movieLink: z.string().url("Please enter a valid URL."),
  thumbnailUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

type AddMovieFormValues = z.infer<typeof formSchema>;

interface AddMovieDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMovieAdded: (movie: Omit<Movie, "id" | "votes" | "createdAt" | "duration">) => void;
}

const ADMIN_PASSWORD = "Prashant"; // Simple hardcoded password

export function AddMovieDialog({ isOpen, onOpenChange, onMovieAdded }: AddMovieDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"password" | "form">("password");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const form = useForm<AddMovieFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      movieTitle: "",
      movieLink: "",
      thumbnailUrl: "",
    },
  });

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      form.reset();
      setPassword("");
      setView("password"); // Reset to password view on close
    }
    onOpenChange(open);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setView("form");
    } else {
      toast({
        variant: "destructive",
        title: "Incorrect Password",
        description: "Please try again.",
      });
    }
    setPassword("");
  };

  const onSubmit = (values: AddMovieFormValues) => {
    startTransition(async () => {
      const result = await checkMovieLinkAction(values);
      if (result.success) {
        toast({
          title: "Success!",
          description: result.message,
        });
        
        const isYouTubeVideo = !!getYouTubeVideoId(values.movieLink);
        
        onMovieAdded({ 
            title: values.movieTitle, 
            url: values.movieLink,
            thumbnailUrl: isYouTubeVideo ? undefined : values.thumbnailUrl || undefined,
        });
        handleDialogClose(false);
      } else {
        toast({
          variant: "destructive",
          title: "Validation Failed",
          description: result.message,
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        {view === "password" ? (
          <>
            <DialogHeader>
              <DialogTitle>Admin Access</DialogTitle>
              <DialogDescription>
                Please enter the password to add a new video.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                />
              </div>
              <DialogFooter>
                 <Button type="button" variant="ghost" onClick={() => handleDialogClose(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit</Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add a New Video</DialogTitle>
              <DialogDescription>
                Enter the video title and a valid link.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="movieTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., The Social Network Trailer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="movieLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://youtube.com/watch?v=..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="thumbnailUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.png" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => handleDialogClose(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Video
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
