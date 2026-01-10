import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
	// Sharp & Bold: semibold font, sharper default corners
	"inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-colors overflow-hidden",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground shadow-sm [a&]:hover:bg-primary/90",
				secondary:
					"border-border bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",
				destructive:
					"border-transparent bg-destructive text-white shadow-sm [a&]:hover:bg-destructive/90",
				outline:
					"border-border text-foreground bg-transparent [a&]:hover:bg-accent",
				success:
					"border-transparent bg-success text-success-foreground shadow-sm [a&]:hover:bg-success/90",
				warning:
					"border-transparent bg-warning text-warning-foreground shadow-sm [a&]:hover:bg-warning/90",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export type BadgeElement = React.ComponentRef<"span">;
export type BadgeProps = React.ComponentPropsWithoutRef<"span"> &
	VariantProps<typeof badgeVariants> & {
		asChild?: boolean;
		rounded?: "md" | "full";
	};

function Badge({
	className,
	variant,
	asChild = false,
	rounded = "md",
	...props
}: BadgeProps): React.JSX.Element {
	const Comp = asChild ? Slot : "span";

	return (
		<Comp
			data-slot="badge"
			className={cn(
				badgeVariants({ variant }),
				rounded === "full" ? "rounded-full" : "rounded-md",
				className,
			)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
