import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface WordLimitInfoProps {
  currentLength?: number;
}

export default function WordLimitInfo({ currentLength = 0 }: WordLimitInfoProps) {
  const [planData, setPlanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    async function fetchPlanData() {
      try {
        const response = await fetch(`${apiUrl}/payments/my-plan`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          setPlanData(data.plan);
        }
      } catch (err) {
        console.error("Failed to load plan information:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlanData();
  }, [apiUrl]);

  if (loading || !planData) {
    return null;
  }

  const wordsRemaining = planData.words_remaining;
  const percentageUsed = Math.min(100, (currentLength / wordsRemaining) * 100);
  const isLowWords = wordsRemaining < 500;
  const isExceeded = currentLength > wordsRemaining;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">
          Words Remaining: {wordsRemaining.toLocaleString()}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-7 px-2"
          onClick={() => router.push('/pricing')}
        >
          <CreditCard className="h-3 w-3 mr-1" />
          Upgrade
        </Button>
      </div>
      
      {isLowWords && (
        <div className="flex items-center text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          Running low on words! Consider upgrading your plan.
        </div>
      )}
      
      {isExceeded && (
        <div className="flex items-center text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          Word limit exceeded by {(currentLength - wordsRemaining).toLocaleString()} words!
        </div>
      )}
      
      <div>
        <Progress 
          value={percentageUsed} 
          className={`h-1 ${isExceeded ? "bg-red-200 [&>div]:bg-red-600" : ""}`}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Current: {currentLength.toLocaleString()}</span>
          <span>Limit: {wordsRemaining.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}