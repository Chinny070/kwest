"use client";

import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, className = "", children, ...props }, ref) => {
    const base = "bg-slate-800/60 border border-slate-700/50 rounded-xl backdrop-blur-sm";
    const hoverClass = hover ? "hover:border-slate-600 hover:bg-slate-800/80 transition-all duration-200" : "";

    return (
      <div ref={ref} className={`${base} ${hoverClass} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
export default Card;
