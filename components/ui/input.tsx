import * as React from "react";
import { cn } from "@/lib/utils";

export type InputElement = React.ComponentRef<"input">;
export type InputProps = React.ComponentProps<"input">;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				data-slot="input"
				className={cn(
					// Sharp & Bold: taller input, cleaner borders, bold focus
					"flex h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-all duration-150",
					"selection:bg-primary selection:text-primary-foreground",
					"file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm",
					"placeholder:text-muted-foreground",
					"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
					"dark:bg-input/30 dark:border-border",
					// Focus state - bold ring
					"focus:border-primary focus:ring-2 focus:ring-primary/20",
					// Invalid state
					"aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
