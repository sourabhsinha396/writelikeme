"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Settings, Loader2 } from "lucide-react";
import PlanUsage from "@/components/payments/PlanUsage";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Loading component to use as fallback
function ProfileLoading() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );
}

// Component that uses useSearchParams
function ProfileContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [statusMessage, setStatusMessage] = useState<{type: "success" | "error", message: string} | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for success/error messages in URL parameters
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      if (success === "payment_successful") {
        setStatusMessage({
          type: "success",
          message: "Your payment was successful! Your plan has been updated."
        });
      } else {
        setStatusMessage({
          type: "success",
          message: decodeURIComponent(success)
        });
      }
    } else if (error) {
      if (error === "payment_failed") {
        setStatusMessage({
          type: "error",
          message: "Your payment could not be processed. Please try again."
        });
      } else if (error === "invalid_payment") {
        setStatusMessage({
          type: "error",
          message: "Invalid payment request. Please try again."
        });
      } else {
        setStatusMessage({
          type: "error",
          message: decodeURIComponent(error)
        });
      }
    }
  }, [searchParams]);

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (!isAuthenticated) {
    router.push("/login?redirect=/profile");
    return null;
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account details and subscription.
        </p>
      </div>

      {statusMessage && (
        <Alert 
          variant={statusMessage.type === "error" ? "destructive" : "default"}
          className="mb-6"
        >
          <AlertTitle>
            {statusMessage.type === "success" ? "Success" : "Error"}
          </AlertTitle>
          <AlertDescription>
            {statusMessage.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">{user?.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Edit Account Settings
            </Button>
          </CardFooter>
        </Card>
        
        <PlanUsage />
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Writing Profiles</CardTitle>
            <CardDescription>Manage your saved writing style profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push("/profiles")}
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              View All Profiles
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent />
    </Suspense>
  );
}