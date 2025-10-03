"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import DirectPayPalCheckout from "@/components/payments/PaypalCheckout";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  word_limit: number;
  features: any[];
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
}

export default function PaymentModal({ isOpen, onClose, plan }: PaymentModalProps) {
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePaymentSuccess = (details: any) => {
    setPaymentStatus('success');
    
    // Check if we need to refresh the page or just show success UI
    const shouldRefresh = details && (details.status === "completed_now" || details.status === "already_processed");
    
    // After a successful payment, we can redirect or show success UI
    setTimeout(() => {
      onClose();
      // Either redirect or refresh the current page to reflect the changes
      if (shouldRefresh) {
        window.location.href = '/profile?success=payment_successful';
      } else {
        router.push('/profile?success=payment_successful');
      }
    }, 2000);
  };

  const handlePaymentError = (error: any) => {
    setPaymentStatus('error');
    setErrorMessage(error?.message || "Payment failed. Please try again.");
  };

  const handlePaymentCancel = () => {
    setPaymentStatus('idle');
    // Just close the modal
    onClose();
  };

  if (!plan) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {paymentStatus === 'success' ? (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              </div>
              <DialogTitle>Payment Successful!</DialogTitle>
              <DialogDescription>
                Thank you for your purchase. Your account has been updated.
              </DialogDescription>
            </>
          ) : paymentStatus === 'error' ? (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <DialogTitle>Payment Failed</DialogTitle>
              <DialogDescription>
                {errorMessage || "There was an issue processing your payment."}
              </DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle>Complete Your Purchase</DialogTitle>
              <DialogDescription>
                You&apos;re purchasing the {plan.name} plan for ${plan.price.toFixed(2)}.
              </DialogDescription>
            </>
          )}
        </DialogHeader>
        
        {paymentStatus === 'idle' && (
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/40">
              <h3 className="font-medium mb-2">{plan.name} Plan Summary</h3>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-medium">${plan.price.toFixed(2)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Word Limit:</span>
                  <span className="font-medium">{plan.word_limit.toLocaleString()} words</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Pay with PayPal:</h3>
              <DirectPayPalCheckout 
                planId={plan.id}
                amount={plan.price}
                planName={plan.name}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            </div>
          </div>
        )}
        
        {paymentStatus === 'processing' && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mr-2" />
            <span>Processing your payment...</span>
          </div>
        )}
        
        <DialogFooter className="flex justify-between sm:justify-between mt-4 sticky bottom-0 bg-background pt-2 pb-1">
          {paymentStatus !== 'success' && (
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={paymentStatus === 'processing'}
            >
              Cancel
            </Button>
          )}
          
          {paymentStatus === 'error' && (
            <div className="flex gap-2">
              <Button onClick={() => setPaymentStatus('idle')}>
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/payment-check?plan=' + plan.id)}
              >
                Check Payment Status
              </Button>
            </div>
          )}
          
          {paymentStatus === 'success' && (
            <Button onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}