import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui";

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center px-6">
    <p className="text-8xl font-black text-muted-foreground/20 tracking-tighter">404</p>
    <h1 className="mt-4 text-2xl font-extrabold text-foreground uppercase tracking-tight">
      Page not found
    </h1>
    <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <Button asChild className="mt-8 rounded-xl font-semibold uppercase tracking-widest text-[10px] h-11 px-8 shadow-sm">
      <Link to="/">Go Home</Link>
    </Button>
  </div>
);

export default NotFound;

