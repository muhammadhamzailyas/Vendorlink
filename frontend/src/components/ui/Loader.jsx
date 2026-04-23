import React from "react";
import { ClipLoader } from "react-spinners";

export const Spinner = ({ size = 40, color = "var(--foreground)" }) => (
  <ClipLoader color={color} size={size} speedMultiplier={0.8} />
);

const Loader = () => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--background)]">
    <Spinner />
  </div>
);

export default Loader;
