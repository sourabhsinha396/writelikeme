"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, File, X, FileText } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [alert, setAlert] = useState<{ 
    message: string; 
    variant: 'default' | 'destructive' | 'success' 
  } | null>(null);
  
  // Make sure this is defined correctly in your environment variables
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setAlert(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === "upload") {
      if (files.length === 0) {
        setAlert({
          message: "Please select at least one file to upload.",
          variant: "destructive"
        });
        return;
      }

      if (!name.trim()) {
        setAlert({
          message: "Please enter a profile name.",
          variant: "destructive"
        });
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      files.forEach(file => {
        formData.append("files", file);
      });

      try {
        const response = await fetch(`${apiUrl}/samples/upload`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Upload error:", errorText);
          throw new Error(`Upload failed: ${errorText}`);
        }

        const data = await response.json();
        setAlert({
          message: "Files uploaded successfully!",
          variant: "success"
        });
        
        // Redirect to profile page after a short delay
        setTimeout(() => {
          window.location.href = `/profiles/${data.profile_id}`;
        }, 1500);
      } catch (error) {
        console.error("Error during upload:", error);
        setAlert({
          message: (error instanceof Error ? error.message : "Unknown error"),
          variant: "destructive"
        });
      }
    } else if (activeTab === "paste") {
      if (!text.trim()) {
        setAlert({
          message: "Please enter some text to analyze.",
          variant: "destructive"
        });
        return;
      }

      if (!name.trim()) {
        setAlert({
          message: "Please enter a profile name.",
          variant: "destructive"
        });
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/samples/analyze-text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sample_name: name,
            sample_text: text,
          }),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Analysis failed");
        }

        const data = await response.json();
        setAlert({
          message: "Text analyzed successfully.",
          variant: "success"
        });

        // Redirect to profile page after a short delay
        setTimeout(() => {
          window.location.href = `/profiles/${data.profile_id}`;
        }, 1500);
      } catch (error) {
        setAlert({
          message: "Failed to analyze text. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <ProtectedRoute>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Writing Profile</h1>
          <p className="text-muted-foreground">
            Upload files or paste text to analyze your writing style
          </p>
        </div>

        {alert && (
          <Alert variant={alert.variant} className="mb-6">
            {alert.message}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Create Writing Profile</CardTitle>
            <CardDescription>
              Upload your writing samples or paste text to create a style profile
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form id="upload-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-base">
                  Profile Name
                </Label>
                <Input
                  id="profile-name"
                  name="name"
                  placeholder="Enter a name for this style profile"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              
              <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload Files</TabsTrigger>
                  <TabsTrigger value="paste">Paste Text</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4 mt-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Upload className="h-12 w-12 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Drag and drop your files here, or click to select
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supported formats: TXT, DOC, DOCX, PDF
                        </p>
                      </div>
                      <Input
                        type="file"
                        multiple
                        accept=".txt,.doc,.docx,.pdf"
                        className="hidden"
                        onChange={handleFileChange}
                        id="file-upload"
                      />
                      <Button asChild variant="outline">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Select Files
                        </label>
                      </Button>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="bg-muted rounded-lg p-4">
                      <h3 className="font-medium mb-2">Selected Files ({files.length}):</h3>
                      <ul className="space-y-2">
                        {files.map((file, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between bg-background rounded p-2"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{file.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFile(index)}
                              title="Remove file"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="paste" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="paste-text">Your Text</Label>
                    <Textarea
                      id="paste-text"
                      placeholder="Paste your text here..."
                      className="min-h-[300px]"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="upload-form"
              disabled={
                (activeTab === "upload" && (files.length === 0 || !name.trim())) ||
                (activeTab === "paste" && (!text.trim() || !name.trim()))
              }
            >
              {activeTab === "upload" ? "Upload and Analyze" : "Analyze Text"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </ProtectedRoute>
  );
}