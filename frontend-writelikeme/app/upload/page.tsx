"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, File, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [alert, setAlert] = useState<{ message: string; variant: 'default' | 'destructive' | 'success' } | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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
    
    if (files.length === 0) {
      setAlert({
        message: "Please select at least one file to upload.",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
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
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setAlert({
        message: "Files uploaded successfully.",
        variant: "success"
      });

      // Redirect to profile page after a short delay
      setTimeout(() => {
        window.location.href = `/profiles/${data.profile_id}`;
      }, 1500);
    } catch (error) {
      setAlert({
        message: (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Your Writing Samples</h1>
        <p className="text-muted-foreground">
          Upload text files (.txt, .doc, .docx, .pdf) containing your writing samples
        </p>
      </div>

      {alert && (
        <Alert variant={alert.variant} className="mb-6">
          {alert.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {files.length > 0 && (
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-medium mb-2">Selected Files:</h3>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between bg-background rounded p-2"
                >
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-green-500" />
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

        <Button type="submit" className="w-full" disabled={files.length === 0}>
          Upload and Analyze
        </Button>
      </form>
    </div>
  );
}