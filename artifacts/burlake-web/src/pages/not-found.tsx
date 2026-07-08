import React from "react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] bg-background pt-32 pb-24 text-center px-6">
      <div className="max-w-md">
        <h1 className="text-6xl font-serif text-primary mb-6">404</h1>
        <h2 className="text-2xl font-serif text-foreground mb-4">Page not found</h2>
        <p className="text-muted-foreground font-light mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link href="/" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider bg-primary text-primary-foreground hover:bg-transparent hover:text-primary border border-primary h-12 px-8 py-2">
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}
