import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";

interface Feature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  word_limit: number;
  features: Feature[];
  popular?: boolean;
}

interface PlanCardProps {
  plan: Plan;
  isCurrentPlan: boolean;
  onSelect: () => void;
  processing: boolean;
}

export default function PlanCard({ plan, isCurrentPlan, onSelect, processing }: PlanCardProps) {
  return (
    <Card className={`flex flex-col ${plan.popular ? 'border-emerald-500 shadow-lg' : ''}`}>
      {plan.popular && (
        <div className="bg-emerald-500 text-white text-xs font-medium px-2 py-1 rounded-t-md text-center">
          Most Popular
        </div>
      )}
      
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="mb-4">
          {plan.price === 0 ? (
            <div className="text-4xl font-bold">Free</div>
          ) : (
            <div>
              <span className="text-4xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground ml-1">one-time</span>
            </div>
          )}
          <p className="text-muted-foreground mt-1">{plan.word_limit.toLocaleString()} words</p>
        </div>
        
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
              <span>{feature.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          variant={isCurrentPlan ? "outline" : (plan.id === "free" ? "outline" : "default")}
          disabled={isCurrentPlan || processing}
          onClick={onSelect}
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : isCurrentPlan ? (
            "Current Plan"
          ) : plan.id === "free" ? (
            "Free Plan"
          ) : (
            "Select Plan"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}