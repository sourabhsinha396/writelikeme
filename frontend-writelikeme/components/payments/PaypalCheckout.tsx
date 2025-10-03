"use client";

import React, { useState } from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer
} from "@paypal/react-paypal-js";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PayPalCheckoutProps {
  planId: string;
  amount: number;
  planName: string;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel: () => void;
}

// Custom component to wrap the PayPalButtons and handle loading state
const ButtonWrapper = ({ 
  planId, 
  amount, 
  planName, 
  onSuccess, 
  onError, 
  onCancel 
}: PayPalCheckoutProps) => {
  const [{ isPending }] = usePayPalScriptReducer();
  const [error, setError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  // Style for the PayPal button
  const style = { 
    layout: "vertical",
    color: "blue",
    shape: "rect",
    label: "pay"
  };

  // Function to create the order
  const createOrder = () => {
    return fetch(`${apiUrl}/payments/create-paypal-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        plan_id: planId,
        amount: amount
      }),
    })
    .then((response) => response.json())
    .then((order) => {
      if (order.error) {
        setError(order.error);
        throw new Error(order.error);
      }
      
      // Save the full payment ID
      if (order.orderId) {
        sessionStorage.setItem('paypal_order_id', order.orderId);
      }
      
      // Return the EC token for PayPal
      return order.id;
    })
    .catch(err => {
      console.error("Error creating order:", err);
      setError(err.message || "Failed to create order");
      throw err;
    });
  };

  // Function to handle approval - directly execute the payment
  const onApprove = (data: any, actions: any) => {
    console.log("Payment approved by PayPal:", data);
    setError(null);
    
    // Call our backend to execute the payment directly
    return fetch(`${apiUrl}/payments/direct-execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        payment_id: sessionStorage.getItem('paypal_order_id'),
        payer_id: data.payerID,
        plan_id: planId
      }),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.error || "Payment execution failed");
        });
      }
      return response.json();
    })
    .then(result => {
      console.log("Payment execution result:", result);
      
      if (result.success) {
        // Clear session storage
        sessionStorage.removeItem('paypal_order_id');
        
        // Call success callback
        onSuccess(result);
        return result;
      } else {
        throw new Error(result.error || "Payment failed");
      }
    })
    .catch(err => {
      console.error("Error executing payment:", err);
      setError(err.message || "Failed to complete payment");
      onError(err);
      throw err;
    });
  };

  return (
    <div className="paypal-button-container">
      {isPending ? (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mr-2" />
          <span>Loading PayPal...</span>
        </div>
      ) : null}
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className={isPending ? "hidden" : ""}>
        <PayPalButtons
          style={style as any}
          disabled={false}
          forceReRender={[style, amount.toString(), planId]}
          fundingSource={undefined}
          createOrder={createOrder}
          onApprove={onApprove}
          onCancel={onCancel}
          onError={(err) => {
            console.error("PayPal Error:", err);
            setError("Failed to process payment. Please try again.");
            onError(err);
          }}
        />
      </div>
    </div>
  );
};

export default function DirectPayPalCheckout(props: PayPalCheckoutProps) {
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
  
  // Initial options for the PayPal SDK
  const initialOptions = {
    clientId: paypalClientId,
    currency: "USD",
    intent: "capture",
    components: "buttons",
    fundingEligibility: {
      card: {
        eligible: true
      }
    }
  };

  return (
    <div className="w-full">
      <PayPalScriptProvider options={initialOptions}>
        <ButtonWrapper {...props} />
      </PayPalScriptProvider>
    </div>
  );
}