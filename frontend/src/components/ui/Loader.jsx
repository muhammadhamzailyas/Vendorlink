import React from "react";

export const Spinner = ({ size = 40, className = "" }) => (
  <div 
    className={`animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    style={{ width: size, height: size }}
    role="status"
    aria-label="loading"
  />
);

const Loader = () => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
    <Spinner size={40} className="text-foreground" />
  </div>
);

export default Loader;
