import React from "react";

const Loader = ({ text }) => (
  <div className="flex h-screen items-center justify-center bg-[var(--muted)]">
    <div className="flex flex-col items-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-foreground/80"
        role="status"
      />
      {text && <span className="mt-3 text-sm text-[var(--muted-foreground)]">{text}</span>}
    </div>
  </div>
);

export default Loader;
