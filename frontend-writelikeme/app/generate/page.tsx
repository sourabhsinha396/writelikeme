"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wand2, Copy, CheckCircle, Waves } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Profile {
  id: string;
  name: string;
}

export default function GeneratePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [length, setLength] = useState<string>("medium");
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [alert, setAlert] = useState<{ message: string; variant: 'default' | 'destructive' | 'success' } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [useStreamingMode, setUseStreamingMode] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const generatedContentCardRef = useRef<HTMLDivElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/profiles`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profiles");
        }

        const data = await response.json();
        
        if (data.profiles && data.profiles.length > 0) {
          setProfiles(data.profiles);
          // Automatically select the first profile if there is one
          setSelectedProfileId(data.profiles[0].id);
        }
      } catch (error) {
        setAlert({
          message: "Failed to load profiles. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [apiUrl]);

  // Auto-scroll to the bottom of content when streaming
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamingContent, isStreaming]);
  
  const scrollToGeneratedContent = () => {
    // Scroll to the generated content section with a smooth animation
    if (generatedContentCardRef.current) {
      generatedContentCardRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleGenerate = async () => {
    if (!selectedProfileId) {
      setAlert({
        message: "Please select a writing profile.",
        variant: "destructive"
      });
      return;
    }

    if (!topic.trim()) {
      setAlert({
        message: "Please enter a topic for generation.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setAlert(null);
    
    // Clear any previous content
    setGeneratedContent(null);
    setStreamingContent("");

    try {
      const formData = new URLSearchParams();
      formData.append("profile_id", selectedProfileId);
      formData.append("topic", topic);
      formData.append("length", length);
      formData.append("stream", useStreamingMode.toString());

      if (useStreamingMode) {
        // Handle streaming response
        setIsStreaming(true);
        
        const response = await fetch(`${apiUrl}/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error);
        }
        
        setTimeout(scrollToGeneratedContent, 100);
        
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Failed to get response reader");
        }
        
        const decoder = new TextDecoder();
        let accumulatedContent = "";
        let done = false;
        
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          const eventLines = chunk.split('\n\n');
          
          for (const line of eventLines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              
              if (data === '[DONE]') {
                done = true;
                break;
              }
              
              // Add to accumulated content
              accumulatedContent += data;
              setStreamingContent(accumulatedContent);
            }
          }
        }
        
        // When streaming is done, set the final content
        setGeneratedContent(accumulatedContent);
        setIsStreaming(false);
        
        // Scroll to the generated content
        scrollToGeneratedContent();
        
      } else {
        // Original non-streaming approach
        const response = await fetch(`${apiUrl}/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error);
        }

        const data = await response.json();
        setGeneratedContent(data.generated_content);
        
        // Scroll to the generated content
        scrollToGeneratedContent();
      }
      
      setAlert({
        message: "Content generated successfully!",
        variant: "success"
      });
      
    } catch (error) {
      console.error("Generation error:", error);
      setAlert({
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  const copyToClipboard = () => {
    const contentToCopy = isStreaming ? streamingContent : generatedContent;
    if (contentToCopy) {
      navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setAlert({
        message: "Content copied to clipboard.",
        variant: "success"
      });
      
      // Reset copy status after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-3">Loading profiles...</span>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">

      {alert && (
        <Alert variant={alert.variant} className="mb-6">
          {alert.message}
        </Alert>
      )}

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">No Writing Profiles Available</h2>
            <p className="text-muted-foreground mb-6">
              You need to create a writing profile before you can generate content.
            </p>
            <Button asChild>
              <a href="/profiles/create">Create Profile</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Generate New Content</CardTitle>
              <CardDescription>
                Create content that matches your unique writing style
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="profile-select">Writing Profile</Label>
                <Select 
                  value={selectedProfileId}
                  onValueChange={setSelectedProfileId}
                >
                  <SelectTrigger id="profile-select" className="w-full">
                    <SelectValue placeholder="Select a writing profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic-input">Topic or Prompt</Label>
                <Textarea
                  id="topic-input"
                  placeholder="Enter a topic or prompt for your content..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Content Length</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={length === "short" ? "default" : "outline"}
                    onClick={() => setLength("short")}
                    className="flex-1 sm:flex-none"
                  >
                    Short
                  </Button>
                  <Button
                    type="button"
                    variant={length === "medium" ? "default" : "outline"}
                    onClick={() => setLength("medium")}
                    className="flex-1 sm:flex-none"
                  >
                    Medium
                  </Button>
                  <Button
                    type="button"
                    variant={length === "long" ? "default" : "outline"}
                    onClick={() => setLength("long")}
                    className="flex-1 sm:flex-none"
                  >
                    Long
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="streaming-mode"
                  checked={useStreamingMode}
                  onCheckedChange={setUseStreamingMode}
                />
                <Label htmlFor="streaming-mode" className="flex items-center gap-1">
                  <Waves className="h-4 w-4" />
                  Streaming mode
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedProfileId || !topic.trim()}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isStreaming ? "Generating..." : "Generating..."}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {(generatedContent || streamingContent) && (
            <Card ref={generatedContentCardRef}>
              <CardHeader>
                <CardTitle>Generated Content</CardTitle>
                {isStreaming && (
                  <CardDescription className="flex items-center gap-1 text-green-500">
                    <span className="animate-pulse inline-block rounded-full h-2 w-2 bg-green-500"></span>
                    Content is being generated in real-time...
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div 
                  ref={contentRef}
                  className="bg-muted p-4 rounded-md whitespace-pre-wrap overflow-auto max-h-[500px]"
                >
                  {isStreaming ? streamingContent : generatedContent}
                  {isStreaming && <span className="animate-pulse ml-1">▌</span>}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </>
      )}
    </div>
  );
}