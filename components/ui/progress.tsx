"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import type * as React from "react";
import { cn } from "@/lib/utils";

export type ProgressElement = React.ComponentRef<typeof ProgressPrimitive.Root>;
export type ProgressProps = React.ComponentPropsWithoutRef<
	typeof ProgressPrimitive.Root
> & {
	indicatorClassName?: string;
};

function Progress({
	className,
	indicatorClassName,
	value,
	...props
}: ProgressProps): React.JSX.Element {
	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			className={cn(
				"relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
				className,
			)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				data-slot="progress-indicator"
				className={cn(
					"h-full w-full flex-1 bg-primary transition-all",
					indicatorClassName,
				)}
				style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
			/>
		</ProgressPrimitive.Root>
	);
}

export { Progress };
