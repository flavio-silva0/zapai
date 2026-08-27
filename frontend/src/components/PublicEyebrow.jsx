import React from "react";

export default function PublicEyebrow({ children, variant = "pill", className = "" }) {
  if (variant === "text") {
    return (
      <div className={`text-xs font-semibold text-teal-600 uppercase tracking-wider ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-semibold uppercase tracking-wider ${className}`}>
      {children}
    </div>
  );
}
