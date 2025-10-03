"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Mail, BrainCircuit, AntennaIcon } from "lucide-react";
import PlanCard from "@/components/payments/PlanCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PaymentModal from "@/components/payments/PaymentModal";

// Define types for plans
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

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  // Fetch available plans
  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch(`${apiUrl}/payments/plans`, {
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch plans");
        }
        
        const data = await response.json();
        const plansList = Object.entries(data.plans).map(([id, planData]: [string, any]) => ({
          id,
          name: planData.name,
          description: planData.description || "",
          price: planData.price,
          word_limit: planData.word_limit,
          features: Array.isArray(planData.features) 
            ? planData.features.map((feature: string) => ({ name: feature, included: true }))
            : [],
          popular: planData.popular || false
        }));
        
        setPlans(plansList);
      } catch (err) {
        setError("Failed to load pricing plans");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, [apiUrl]);

  // Fetch current user's plan
  useEffect(() => {
    async function fetchCurrentPlan() {
      if (!isAuthenticated) return;
      
      try {
        const response = await fetch(`${apiUrl}/payments/my-plan`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          setCurrentPlan(data.plan);
        }
      } catch (err) {
        console.error("Failed to fetch current plan:", err);
      }
    }

    if (!isLoading) {
      fetchCurrentPlan();
    }
  }, [apiUrl, isAuthenticated, isLoading]);

  const handleSelectPlan = (plan: Plan) => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/login?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }

    // Don't process if it's the free plan or current plan
    if (plan.id === 'free' || (currentPlan && currentPlan.plan_id === plan.id)) {
      return;
    }
    
    // Open payment modal with the selected plan
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose the plan that fits your needs. Upgrade or downgrade anytime.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {currentPlan && (
        <div className="mb-8 p-4 border rounded-lg bg-muted/50">
          <h2 className="text-lg font-semibold mb-2">Your Current Plan: {currentPlan.plan_name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Words Remaining</p>
              <p className="text-2xl font-bold">{currentPlan.words_remaining.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Limit</p>
              <p className="text-2xl font-bold">{currentPlan.word_limit.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Words Used</p>
              <p className="text-2xl font-bold">{currentPlan.words_used.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id}>
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
                  variant={currentPlan?.plan_id === plan.id ? "outline" : (plan.id === "free" ? "outline" : "default")}
                  disabled={currentPlan?.plan_id === plan.id || processingPayment}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : currentPlan?.plan_id === plan.id ? (
                    "Current Plan"
                  ) : plan.id === "free" ? (
                    "Free Plan"
                  ) : (
                    "Select Plan"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        ))}
        <div className="col-span-full mt-8 p-6 bg-muted/30 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Need something else?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Mail className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-medium">Custom Plan</h4>
                <p className="text-sm text-muted-foreground">Need a different word limit or features?</p>
                <a href="mailto:team@writelikeme.io" className="text-sm text-emerald-500 hover:text-emerald-600 inline-flex items-center mt-1">
                  Contact us
                  <Mail className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BrainCircuit className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-medium">API Access</h4>
                <p className="text-sm text-muted-foreground">Want to integrate with your application?</p>
                <a href="mailto:team@writelikeme.io" className="text-sm text-emerald-500 hover:text-emerald-600 inline-flex items-center mt-1">
                  Get in touch
                  <Mail className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          plan={selectedPlan}
        />
      )}
    </div>
  );
}