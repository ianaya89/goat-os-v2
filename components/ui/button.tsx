import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	// Sharp & Bold: semibold font, snappy transitions, press effect
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md cursor-pointer text-sm font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md",
				destructive:
					"bg-destructive text-white shadow-sm hover:bg-destructive/90 hover:shadow-md focus-visible:ring-destructive/50",
				outline:
					"border border-border bg-background shadow-sm hover:bg-accent hover:border-border-strong dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
				secondary:
					"bg-secondary text-secondary-foreground border border-border/50 shadow-sm hover:bg-secondary/80 hover:border-border",
				ghost:
					"hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
				link: "text-primary underline-offset-4 hover:underline font-medium",
			},
			size: {
				default: "h-10 px-5 py-2 has-[>svg]:px-4",
				sm: "h-8 rounded-md gap-1.5 px-3.5 has-[>svg]:px-2.5 text-xs",
				lg: "h-12 rounded-md px-8 has-[>svg]:px-6 text-base",
				icon: "size-10",
				"icon-sm": "size-8",
				"icon-lg": "size-12",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export type ButtonElement = React.ComponentRef<"button">;
export type ButtonProps = React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		loading?: boolean;
	};

function Button({
	className,
	variant = "default",
	size = "default",
	asChild = false,
	loading = false,
	children,
	disabled,
	...props
}: ButtonProps): React.JSX.Element {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			disabled={disabled || loading}
			{...props}
		>
			{asChild ? (
				children
			) : (
				<>
					{loading && <Loader2Icon className="size-4 animate-spin" />}
					{children}
				</>
			)}
		</Comp>
	);
}

export { Button, buttonVariants };
