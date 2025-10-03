import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PlanData {
  plan_id: string;
  plan_name: string;
  word_limit: number;
  words_used: number;
  words_remaining: number;
  purchase_date: string | null;
  features: string[];
}

export default function PlanUsage() {
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    async function fetchPlanData() {
      try {
        const response = await fetch(`${apiUrl}/payments/my-plan`, {
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch plan data");
        }
        
        const data = await response.json();
        setPlanData(data.plan);
      } catch (err) {
        setError("Failed to load plan information");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlanData();
  }, [apiUrl]);

  const usagePercentage = planData 
    ? Math.round((planData.words_used / planData.word_limit) * 100) 
    : 0;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!planData) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground">Unable to load plan information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Plan: {planData.plan_name}</CardTitle>
        {planData.purchase_date && (
          <CardDescription>
            Purchased on {formatDate(planData.purchase_date)}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Word Usage</span>
              <span className="text-sm font-medium">
                {planData.words_used.toLocaleString()} / {planData.word_limit.toLocaleString()}
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Words Remaining</p>
              <p className="text-2xl font-bold">{planData.words_remaining.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Word Limit</p>
              <p className="text-2xl font-bold">{planData.word_limit.toLocaleString()}</p>
            </div>
          </div>
          
          {planData.features && planData.features.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Plan Features:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {planData.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/payment-history')}
        >
          Payment History
        </Button>
        <Button 
          size="sm"
          onClick={() => router.push('/pricing')}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Upgrade Plan
        </Button>
      </CardFooter>
    </Card>
  );
}