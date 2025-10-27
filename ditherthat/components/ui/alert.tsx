import * as React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean };

export function Alert({ className, style, children, ...props }: DivProps) {
  return (
    <div
      role="status"
      className={className}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px",
        border: "2px solid #111",
        background: "#f6f6f6",
        color: "#111",
        boxShadow: "4px 4px 0 #111",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ className, style, children, ...props }: DivProps) {
  return (
    <div
      className={className}
      style={{ fontWeight: 700, marginBottom: 4, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDescription({ className, style, children, ...props }: DivProps) {
  return (
    <div className={className} style={{ lineHeight: 1.3, ...style }} {...props}>
      {children}
    </div>
  );
}
