"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export default function AnalyzePage() {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [alert, setAlert] = useState<{ message: string; variant: 'default' | 'destructive' | 'success' } | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      setAlert({
        message: "Please enter some text to analyze.",
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
          sample_name: name || "Untitled Sample",
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
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Analyze Your Writing</h1>
        <p className="text-muted-foreground">
          Paste your text below to analyze your writing style
        </p>
      </div>

      {alert && (
        <Alert variant={alert.variant} className="mb-6">
          {alert.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Input
            placeholder="Sample name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="Paste your text here..."
            className="min-h-[300px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={!text.trim()}>
          Analyze Text
        </Button>
      </form>
    </div>
  );
}