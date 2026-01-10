"use client";

import { StarIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface RatingInputProps {
	value: number | null;
	onChange: (value: number | null) => void;
	max?: number;
	disabled?: boolean;
	size?: "sm" | "md" | "lg";
}

const sizeClasses = {
	sm: "size-4",
	md: "size-5",
	lg: "size-6",
};

export function RatingInput({
	value,
	onChange,
	max = 5,
	disabled = false,
	size = "md",
}: RatingInputProps) {
	const [hoveredValue, setHoveredValue] = React.useState<number | null>(null);

	const displayValue = hoveredValue ?? value ?? 0;

	const handleClick = (rating: number) => {
		if (disabled) return;
		// If clicking on the same value, clear it
		if (rating === value) {
			onChange(null);
		} else {
			onChange(rating);
		}
	};

	return (
		<div
			className="flex gap-0.5"
			onMouseLeave={() => setHoveredValue(null)}
		>
			{Array.from({ length: max }, (_, i) => i + 1).map((rating) => {
				const isFilled = displayValue >= rating;
				return (
					<button
						key={rating}
						type="button"
						disabled={disabled}
						onClick={() => handleClick(rating)}
						onMouseEnter={() => !disabled && setHoveredValue(rating)}
						className={cn(
							"transition-colors",
							disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110",
						)}
					>
						<StarIcon
							className={cn(
								sizeClasses[size],
								"transition-colors",
								isFilled
									? "fill-yellow-400 text-yellow-400"
									: "fill-transparent text-muted-foreground/50",
							)}
						/>
					</button>
				);
			})}
		</div>
	);
}
