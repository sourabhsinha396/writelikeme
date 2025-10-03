"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { FileText, Calendar, ArrowRight, PlusCircle } from "lucide-react";
import Link from "next/link";

interface Profile {
  id: string;
  name: string;
  created_at: string;
  sample_count: number;
}

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [alert, setAlert] = useState<{ message: string; variant: 'default' | 'destructive' } | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch(`${apiUrl}/profiles`, {
          credentials: "include",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message);
        }

        const data = await response.json();
        setProfiles(data.profiles);
      } catch (error) {
        setAlert({
          message: "Failed to load profiles. Please try again later.",
          variant: "destructive"
        });
      }
    };

    fetchProfiles();
  }, [apiUrl]);

  const handleCreateProfile = () => {
    router.push("/profiles/create");
  };

  if (alert) {
    return (
      <div>
        <Alert variant={alert.variant} className="mb-6">
          {alert.message}
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 mt-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Writing Profiles</h1>
          <p className="text-muted-foreground">
            View and manage your analyzed writing styles
          </p>
        </div>
        <Button onClick={handleCreateProfile} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Profiles Yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first writing profile to get started
          </p>
          <Button onClick={handleCreateProfile} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Profile
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{profile.name || "Untitled Profile"}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(profile.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {profile.sample_count} samples
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2" asChild>
                    <Link href={`/profiles/${profile.id}`}>
                      View Profile
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}