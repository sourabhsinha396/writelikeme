"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FileText, Wand2, ChevronRight } from "lucide-react";
import Link from "next/link";

// Typing animation component
const TypedText = ({ baseText, variations }: { baseText: string; variations: string[] }) => {
  const [displayText, setDisplayText] = useState(variations[0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);
  const [pauseDuration, setPauseDuration] = useState(2000);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Current complete word from variations
    const currentFullWord = variations[currentIndex];
    
    // If deleting
    if (isDeleting) {
      if (displayText === "") {
        setIsDeleting(false);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % variations.length);
        setTypingSpeed(100);
      } else {
        timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, typingSpeed / 2); // Faster deleting
      }
    } 
    // If typing
    else {
      if (displayText === currentFullWord) {
        // Pause at complete word
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      } else {
        timer = setTimeout(() => {
          setDisplayText(currentFullWord.slice(0, displayText.length + 1));
        }, typingSpeed);
      }
    }
    
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentIndex, variations, typingSpeed, pauseDuration]);
  
  return (
    <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter text-center sm:text-left">
      {baseText}<span className="text-emerald-500 dark:text-emerald-400">{displayText}</span>
      <span className="animate-pulse">|</span>
    </h1>
  );
};

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Background elements with simple aesthetic */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 bg-emerald-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-10 left-20 w-72 h-72 bg-purple-500 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="container mx-auto py-16">
        {/* Hero section */}
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-4 py-8 sm:flex-row sm:gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-40 animate-pulse"></div>
              <Image
                src="/writelikeme-fullsize.png"
                alt="A person studying online with a laptop"
                width={80}
                height={80}
                priority={true}
                className="relative border-r-4 border-emerald-500 object-cover rounded-full shadow-lg shadow-emerald-500 dark:bg-emerald-600 transition-all duration-300"
              />
            </div>
            
            <TypedText 
              baseText="WriteLike" 
              variations={["Me", "Shakespeare", "Hemingway", "Einstein", "Jobs"]} 
            />
          </div>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload your text samples and let AI analyze and replicate your unique writing style. 
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2 max-w-lg mx-auto">
            <Link href="/profiles" className="w-full group">
              <Button size="lg" className="w-full gap-2 transition-all duration-300 group-hover:bg-emerald-600">
                <FileText className="w-5 h-5" />
                Writing Profiles
                <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/generate" className="w-full group">
              <Button size="lg" variant="outline" className="w-full gap-2 transition-all duration-300 group-hover:border-emerald-500 group-hover:text-emerald-500">
                <Wand2 className="w-5 h-5" />
                Generate Content
                <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature cards section - simplified with direct visibility */}
        <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <FileText className="w-12 h-12 text-emerald-500 mb-4" />,
              title: "Create Writing Profile",
              description: "Upload your writing samples or paste text to create a unique style profile."
            },
            {
              icon: <Wand2 className="w-12 h-12 text-emerald-500 mb-4" />,
              title: "Generate Content",
              description: "Create new content that matches your style on any topic you choose."
            },
            {
              icon: <FileText className="w-12 h-12 text-emerald-500 mb-4" />,
              title: "Multiple Profiles",
              description: "Create different profiles for different writing styles and purposes."
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg"
            >
              {feature.icon}
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}