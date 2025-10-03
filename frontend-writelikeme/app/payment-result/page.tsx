"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowLeft, Home, Loader2 } from "lucide-react";

// Loading component for Suspense fallback
function PaymentResultLoading() {
  return (
    <div className="container max-w-md py-16">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Loader2 className="h-16 w-16 animate-spin text-emerald-500" />
          </div>
          <CardTitle className="text-2xl">
            Processing Payment Result
          </CardTitle>
          <CardDescription>
            Please wait while we verify your payment status...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

// Component that uses useSearchParams
function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Get status from URL query parameters
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    
    if (success) {
      setStatus("success");
      setMessage(decodeURIComponent(success));
    } else if (error) {
      setStatus("error");
      setMessage(decodeURIComponent(error));
    } else {
      // Default success message if no parameters
      setStatus("success");
      setMessage("Your payment was successful!");
    }
  }, [searchParams]);

  return (
    <div className="container max-w-md py-16">
      <Card className="text-center">
        <CardHeader>
          {status === "success" ? (
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
          )}
          
          <CardTitle className="text-2xl">
            {status === "success" ? "Payment Successful" : "Payment Failed"}
          </CardTitle>
          
          <CardDescription>
            {message || (status === "success" 
              ? "Your payment has been processed successfully." 
              : "There was an issue processing your payment.")}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {status === "success" ? (
            <p>
              Thank you for your purchase. Your account has been updated with your new word limit.
              You can now continue using WriteLikeMe with your new plan.
            </p>
          ) : (
            <p>
              We encountered an issue while processing your payment. Please try again or contact
              support if the issue persists.
            </p>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => router.push("/")}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Main component with Suspense
export default function PaymentResultPage() {
  return (
    <Suspense fallback={<PaymentResultLoading />}>
      <PaymentResultContent />
    </Suspense>
  );
}