"use client";

import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';

export default function CrispChat() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Initialize Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID; // Replace with your actual Crisp Website ID
    
    // Load the Crisp script
    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);
    
    // Cleanup on unmount
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Set user data in Crisp when authenticated user changes
  useEffect(() => {
    if (window.$crisp && isAuthenticated && user) {
      // Set user information in Crisp
      window.$crisp.push(["set", "user:email", user.email]);
      window.$crisp.push(["set", "user:nickname", user.username]);
      window.$crisp.push(["set", "session:data", [[
        ["user_id", user.id],
        ["account_type", "registered"]
      ]]]);
    }
  }, [user, isAuthenticated]);

  return null; // This component doesn't render anything
}