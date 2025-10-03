"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileIcon, X, Calendar, RefreshCw, Trash2, Wand2, Plus, ArrowLeft } from "lucide-react";
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
import Link from "next/link";

interface Sample {
  id: string;
  filename: string;
  source_type: string;
  created_at: string;
}

interface ProfileData {
  profile: {
    id: string;
    name: string;
    created_at: string;
    profile_data: Record<string, any>;
  };
  samples: Sample[];
}

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params?.id as string;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ 
    message: string; 
    variant: 'default' | 'destructive' | 'success' 
  } | null>(null);
  
  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Content generation states
  const [topic, setTopic] = useState("");
  const [length, setLength] = useState("medium");
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  
  // Add sample states
  const [newSampleText, setNewSampleText] = useState("");
  const [newSampleName, setNewSampleName] = useState("");
  const [addingSample, setAddingSample] = useState(false);
  
  // Retraining state
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        console.log(`Fetching profile data for ID: ${profileId}`);
        const response = await fetch(`${apiUrl}/profiles/${profileId}`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data.error || "Failed to fetch profile data";
          throw new Error(errorMessage);
        }

        
        console.log("Profile data received:", data);
        setProfileData(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        console.log("type of error:", typeof error);
        console.log("error:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      fetchProfileData();
    } else {
      setError("No profile ID provided");
      setLoading(false);
    }
  }, [apiUrl, profileId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFiles(e.target.files);
      setAlert(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    if (!uploadedFiles) return;
    
    // FileList is immutable, so we need to create a new DataTransfer object
    const dt = new DataTransfer();
    
    Array.from(uploadedFiles).forEach((file, i) => {
      if (i !== index) {
        dt.items.add(file);
      }
    });
    
    setUploadedFiles(dt.files);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      setAlert({
        message: "Please select at least one file to upload.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setAlert(null);

    const formData = new FormData();
    // Add the profile name as the name field for the API
    formData.append("name", profileData?.profile.name || "");
    formData.append("profile_id", profileId);
    
    Array.from(uploadedFiles).forEach(file => {
      formData.append("files", file);
    });

    try {
      console.log("Uploading files to profile:", profileId);
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

      // Refresh the profile data
      const refreshResponse = await fetch(`${apiUrl}/profiles/${profileId}`, {
        credentials: "include",
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setProfileData(data);
      }

      setAlert({
        message: "Files uploaded successfully!",
        variant: "success"
      });
      
      // Clear files after successful upload
      setUploadedFiles(null);
    } catch (error) {
      console.error("Error during upload:", error);
      setAlert({
        message: (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!topic) {
      setAlert({
        message: "Please enter a topic for generation.",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    setAlert(null);

    try {
      const formData = new URLSearchParams();
      formData.append("profile_id", profileId);
      formData.append("topic", topic);
      formData.append("length", length);

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
    } catch (error) {
      setAlert({
        message: "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleAddSample = async () => {
    if (!newSampleText.trim()) {
      setAlert({
        message: "Please enter some text for the sample.",
        variant: "destructive"
      });
      return;
    }

    setAddingSample(true);
    setAlert(null);

    try {
      const formData = new URLSearchParams();
      formData.append("profile_id", profileId);
      formData.append("sample_text", newSampleText);
      formData.append("sample_name", newSampleName || "Manual Entry");

      const response = await fetch(`${apiUrl}/add-sample`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to add sample");
      }

      // Refresh the profile data
      const refreshResponse = await fetch(`${apiUrl}/profiles/${profileId}`, {
        credentials: "include",
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setProfileData(data);
      }

      setAlert({
        message: "Sample added successfully.",
        variant: "success"
      });
      
      // Clear form
      setNewSampleText("");
      setNewSampleName("");
    } catch (error) {
      setAlert({
        message: "Failed to add sample. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAddingSample(false);
    }
  };

  const handleDeleteSample = async (sampleId: string) => {
    if (!confirm("Are you sure you want to delete this sample?")) {
      return;
    }

    setAlert(null);

    try {
      const response = await fetch(`${apiUrl}/delete-sample/${sampleId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete sample");
      }

      // Update the UI by removing the deleted sample
      if (profileData) {
        setProfileData({
          ...profileData,
          samples: profileData.samples.filter(sample => sample.id !== sampleId)
        });
      }

      setAlert({
        message: "Sample deleted successfully.",
        variant: "success"
      });
    } catch (error) {
      setAlert({
        message: "Failed to delete sample. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setAlert(null);

    try {
      const formData = new URLSearchParams();
      formData.append("profile_id", profileId);

      const response = await fetch(`${apiUrl}/retrain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Retraining failed");
      }

      // Refresh the profile data
      const refreshResponse = await fetch(`${apiUrl}/profiles/${profileId}`, {
        credentials: "include",
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setProfileData(data);
      }

      setAlert({
        message: "Profile retrained successfully.",
        variant: "success"
      });
    } catch (error) {
      setAlert({
        message: "Failed to retrain profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Alert variant="destructive">
          {error || "Failed to load profile. Please try again."}
        </Alert>
        <div className="mt-4 text-center">
          <Button asChild>
            <Link href="/profiles">Back to Profiles</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 pl-0 flex items-center gap-2"
        onClick={() => router.push("/profiles")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profiles
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{profileData.profile.name || "Untitled Profile"}</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <Calendar className="h-4 w-4" />
            <span>Created on {new Date(profileData.profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetrain}
            disabled={retraining || profileData.samples.length === 0}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {retraining ? "Retraining..." : "Retrain"}
          </Button>
        </div>
      </div>

      {alert && (
        <Alert variant={alert.variant} className="mb-6">
          {alert.message}
        </Alert>
      )}

      <Tabs defaultValue="samples">
        <TabsList className="mb-6 grid grid-cols-4">
          <TabsTrigger id="samples-tab" value="samples">Samples ({profileData.samples.length})</TabsTrigger>
          <TabsTrigger id="add-tab" value="add">Add Text</TabsTrigger>
          <TabsTrigger id="upload-tab" value="upload">Upload Files</TabsTrigger>
          <TabsTrigger id="generate-tab" value="generate">Generate</TabsTrigger>
        </TabsList>
        
        <TabsContent value="samples">
          {profileData.samples.length === 0 ? (
            <div className="text-center py-12">
              <FileIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Samples Yet</h2>
              <p className="text-muted-foreground mb-6">
                Add some writing samples to train your style profile
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {profileData.samples.map((sample) => (
                <Card key={sample.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{sample.filename}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSample(sample.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>
                      {sample.source_type === "upload" ? "Uploaded" : "Manually Added"} on{" "}
                      {new Date(sample.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate Content in Your Style</CardTitle>
              <CardDescription>
                Create new content that matches your unique writing style
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic or Prompt</Label>
                <Textarea
                  id="topic"
                  placeholder="Enter a topic or prompt for your content..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Length</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={length === "short" ? "default" : "outline"} 
                    onClick={() => setLength("short")}
                    size="sm"
                  >
                    Short
                  </Button>
                  <Button 
                    variant={length === "medium" ? "default" : "outline"} 
                    onClick={() => setLength("medium")}
                    size="sm"
                  >
                    Medium
                  </Button>
                  <Button 
                    variant={length === "long" ? "default" : "outline"} 
                    onClick={() => setLength("long")}
                    size="sm"
                  >
                    Long
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setTopic("")}>
                Clear
              </Button>
              <Button 
                onClick={handleGenerateContent} 
                disabled={generating || !topic.trim()} 
                className="gap-2"
              >
                <Wand2 className="h-4 w-4" />
                {generating ? "Generating..." : "Generate"}
              </Button>
            </CardFooter>
          </Card>
          
          {generatedContent && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Generated Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
                  {generatedContent}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add a New Sample</CardTitle>
              <CardDescription>
                Add another writing sample to refine your style profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sample-name">Sample Name (Optional)</Label>
                <Input
                  id="sample-name"
                  placeholder="Give this sample a name"
                  value={newSampleName}
                  onChange={(e) => setNewSampleName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sample-text">Sample Text</Label>
                <Textarea
                  id="sample-text"
                  placeholder="Paste your text here..."
                  className="min-h-[200px]"
                  value={newSampleText}
                  onChange={(e) => setNewSampleText(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => {
                setNewSampleText("");
                setNewSampleName("");
              }}>
                Clear
              </Button>
              <Button 
                onClick={handleAddSample} 
                disabled={addingSample || !newSampleText.trim()} 
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {addingSample ? "Adding..." : "Add Sample"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="upload">
          <div className="container max-w-4xl mx-auto px-4">
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              <div className="border-2 border-dashed border-green-200 dark:border-green-900 rounded-lg p-8">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Upload className="h-12 w-12 text-green-500" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Drag and drop your files here, or click to select files
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

              {uploadedFiles && uploadedFiles.length > 0 && (
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-medium mb-2">Selected Files:</h3>
                  <ul className="space-y-2">
                    {Array.from(uploadedFiles).map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-background rounded p-2"
                      >
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={uploading || !uploadedFiles || uploadedFiles.length === 0}
              >
                {uploading ? "Uploading..." : "Upload and Analyze"}
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}