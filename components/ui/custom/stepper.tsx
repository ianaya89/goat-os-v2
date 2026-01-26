"use client";

import { CheckIcon } from "lucide-react";
import type * as React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface Step {
	id: number;
	title: string;
	description?: string;
}

export interface StepperProps {
	steps: Step[];
	currentStep: number;
	onStepClick?: (step: number) => void;
	allowNavigation?: boolean;
	className?: string;
}

function Stepper({
	steps,
	currentStep,
	onStepClick,
	allowNavigation = false,
	className,
}: StepperProps): React.JSX.Element {
	const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

	const handleStepClick = (stepNumber: number) => {
		if (!allowNavigation || !onStepClick) return;
		// Only allow clicking on completed steps
		if (stepNumber < currentStep) {
			onStepClick(stepNumber);
		}
	};

	return (
		<div className={cn("w-full", className)}>
			{/* Desktop: Horizontal stepper */}
			<div className="hidden sm:block">
				<div className="relative">
					{/* Connection lines */}
					<div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
					<div
						className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-300"
						style={{ width: `${progressPercentage}%` }}
					/>

					{/* Steps */}
					<div className="relative flex justify-between">
						{steps.map((step) => {
							const isCompleted = step.id < currentStep;
							const isCurrent = step.id === currentStep;
							const isPending = step.id > currentStep;
							const isClickable = allowNavigation && isCompleted;

							return (
								<div
									key={step.id}
									className="flex flex-col items-center"
									style={{ width: `${100 / steps.length}%` }}
								>
									<button
										type="button"
										onClick={() => handleStepClick(step.id)}
										disabled={!isClickable}
										className={cn(
											"relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200",
											isCompleted &&
												"border-primary bg-primary text-primary-foreground",
											isCurrent &&
												"border-primary bg-background text-primary ring-4 ring-primary/20",
											isPending &&
												"border-muted bg-background text-muted-foreground",
											isClickable &&
												"cursor-pointer hover:ring-4 hover:ring-primary/20",
											!isClickable && "cursor-default",
										)}
										aria-current={isCurrent ? "step" : undefined}
										aria-label={`${step.title}${isCompleted ? " (completado)" : isCurrent ? " (actual)" : ""}`}
									>
										{isCompleted ? (
											<CheckIcon className="h-5 w-5" />
										) : (
											<span className="text-sm font-semibold">{step.id}</span>
										)}
									</button>

									<div className="mt-2 text-center">
										<p
											className={cn(
												"text-sm font-medium",
												isCurrent && "text-primary",
												isPending && "text-muted-foreground",
											)}
										>
											{step.title}
										</p>
										{step.description && (
											<p className="mt-0.5 text-xs text-muted-foreground">
												{step.description}
											</p>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Progress bar below */}
				<div className="mt-6">
					<Progress value={progressPercentage} className="h-1.5" />
				</div>
			</div>

			{/* Mobile: Vertical stepper */}
			<div className="sm:hidden">
				<div className="space-y-4">
					{steps.map((step, index) => {
						const isCompleted = step.id < currentStep;
						const isCurrent = step.id === currentStep;
						const isPending = step.id > currentStep;
						const isLast = index === steps.length - 1;
						const isClickable = allowNavigation && isCompleted;

						return (
							<div key={step.id} className="relative flex gap-3">
								{/* Vertical line */}
								{!isLast && (
									<div
										className={cn(
											"absolute left-5 top-10 h-full w-0.5 -translate-x-1/2",
											isCompleted ? "bg-primary" : "bg-muted",
										)}
									/>
								)}

								{/* Step circle */}
								<button
									type="button"
									onClick={() => handleStepClick(step.id)}
									disabled={!isClickable}
									className={cn(
										"relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
										isCompleted &&
											"border-primary bg-primary text-primary-foreground",
										isCurrent &&
											"border-primary bg-background text-primary ring-4 ring-primary/20",
										isPending &&
											"border-muted bg-background text-muted-foreground",
										isClickable &&
											"cursor-pointer hover:ring-4 hover:ring-primary/20",
										!isClickable && "cursor-default",
									)}
									aria-current={isCurrent ? "step" : undefined}
									aria-label={`${step.title}${isCompleted ? " (completado)" : isCurrent ? " (actual)" : ""}`}
								>
									{isCompleted ? (
										<CheckIcon className="h-5 w-5" />
									) : (
										<span className="text-sm font-semibold">{step.id}</span>
									)}
								</button>

								{/* Step content */}
								<div className="pt-2 pb-4">
									<p
										className={cn(
											"text-sm font-medium",
											isCurrent && "text-primary",
											isPending && "text-muted-foreground",
										)}
									>
										{step.title}
									</p>
									{step.description && (
										<p className="mt-0.5 text-xs text-muted-foreground">
											{step.description}
										</p>
									)}
								</div>
							</div>
						);
					})}
				</div>

				{/* Progress indicator for mobile */}
				<div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
					<span>
						Paso {currentStep} de {steps.length}
					</span>
					<span>{Math.round(progressPercentage)}% completado</span>
				</div>
				<Progress value={progressPercentage} className="mt-2 h-1.5" />
			</div>
		</div>
	);
}

export { Stepper };
