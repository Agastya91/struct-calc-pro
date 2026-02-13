import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, size, variant, ...props }, ref) => {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50";
  const variants = { 
    default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90 shadow", 
    ghost: "hover:bg-slate-100 hover:text-slate-900", 
    destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90 shadow-sm" 
  };
  const sizes = { 
    default: "h-9 px-4 py-2", 
    sm: "h-8 rounded-md px-3 text-xs", 
    lg: "h-10 rounded-md px-8" 
  };
  return (
    <button 
      ref={ref}
      className={`${base} ${variants[variant || 'default']} ${sizes[size || 'default']} ${className || ''}`} 
      {...props} 
    />
  );
});
Button.displayName = "Button";