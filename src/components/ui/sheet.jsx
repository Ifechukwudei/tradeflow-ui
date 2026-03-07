import * as React from "react";
import { cn } from "../../lib/utils";

const Sheet = ({ open, onOpenChange, children }) => {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80"
          onClick={() => onOpenChange(false)}
        />
      )}
      {children}
    </>
  );
};

const SheetContent = React.forwardRef(({ className, children, side = "left", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "fixed z-50 gap-4 bg-gray-900 p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
        side === "left" && "inset-y-0 left-0 h-full w-3/4 border-r border-gray-800 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SheetContent.displayName = "SheetContent";

export { Sheet, SheetContent };
