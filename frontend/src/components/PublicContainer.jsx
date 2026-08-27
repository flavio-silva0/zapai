import React from "react";

export default function PublicContainer({ className = "", children, ...props }) {
  return (
    <div className={`max-w-6xl mx-auto px-5 ${className}`} {...props}>
      {children}
    </div>
  );
}
