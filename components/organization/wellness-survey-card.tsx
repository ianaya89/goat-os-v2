"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	AlertCircleIcon,
	BatteryIcon,
	BedIcon,
	CheckCircle2Icon,
	HeartPulseIcon,
} from "lucide-react";
import { WellnessSurveyModal } from "@/components/organization/wellness-survey-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

// Helper to get color based on value (1-10 scale)
function getScoreColor(value: number, inverse = false): string {
	const score = inverse ? 11 - value : value;
	if (score <= 3) return "text-red-600";
	if (score <= 5) return "text-yellow-600";
	if (score <= 7) return "text-blue-600";
	return "text-green-600";
}

function getScoreBgColor(value: number, inverse = false): string {
	const score = inverse ? 11 - value : value;
	if (score <= 3) return "bg-red-100 dark:bg-red-950";
	if (score <= 5) return "bg-yellow-100 dark:bg-yellow-950";
	if (score <= 7) return "bg-blue-100 dark:bg-blue-950";
	return "bg-green-100 dark:bg-green-950";
}

export function WellnessSurveyCard() {
	const { data, isLoading, error } =
		trpc.organization.athleteWellness.getMyToday.useQuery();

	if (isLoading) {
		return (
			<Card>
				<CardHeader className="pb-3">
					<Skeleton className="h-5 w-40" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-16 w-full" />
				</CardContent>
			</Card>
		);
	}

	// User is not an athlete
	if (!data || error) {
		return null;
	}

	const { survey } = data;

	// Survey not completed today
	if (!survey) {
		return (
			<Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						<HeartPulseIcon className="size-5 text-red-500" />
						Daily Wellness Check
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-2">
							<AlertCircleIcon className="mt-0.5 size-5 text-yellow-600" />
							<div>
								<p className="font-medium text-yellow-800 dark:text-yellow-200">
									Not completed today
								</p>
								<p className="text-muted-foreground text-sm">
									Track your wellness to monitor recovery and readiness
								</p>
							</div>
						</div>
						<Button
							onClick={() => NiceModal.show(WellnessSurveyModal)}
							className="shrink-0"
						>
							Complete Survey
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Survey completed - show summary
	const sleepHours = survey.sleepHours / 60; // Convert minutes to hours

	return (
		<Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center justify-between text-base">
					<div className="flex items-center gap-2">
						<HeartPulseIcon className="size-5 text-red-500" />
						Daily Wellness Check
					</div>
					<div className="flex items-center gap-1.5 text-green-700 text-sm dark:text-green-300">
						<CheckCircle2Icon className="size-4" />
						<span>
							Completed at {format(new Date(survey.createdAt), "h:mm a")}
						</span>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-4">
					{/* Sleep */}
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"flex size-8 items-center justify-center rounded-lg",
								getScoreBgColor(survey.sleepQuality),
							)}
						>
							<BedIcon className={cn("size-4", getScoreColor(survey.sleepQuality))} />
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Sleep</p>
							<p className="font-medium text-sm">
								{sleepHours.toFixed(1)}h{" "}
								<span className={cn("text-xs", getScoreColor(survey.sleepQuality))}>
									({survey.sleepQuality}/10)
								</span>
							</p>
						</div>
					</div>

					{/* Energy */}
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"flex size-8 items-center justify-center rounded-lg",
								getScoreBgColor(survey.energy),
							)}
						>
							<BatteryIcon className={cn("size-4", getScoreColor(survey.energy))} />
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Energy</p>
							<p className={cn("font-medium text-sm", getScoreColor(survey.energy))}>
								{survey.energy}/10
							</p>
						</div>
					</div>

					{/* Fatigue (inverse - lower is better) */}
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"flex size-8 items-center justify-center rounded-lg",
								getScoreBgColor(survey.fatigue, true),
							)}
						>
							<span className={cn("text-sm", getScoreColor(survey.fatigue, true))}>
								{survey.fatigue <= 3 ? "💪" : survey.fatigue <= 6 ? "😮‍💨" : "😴"}
							</span>
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Fatigue</p>
							<p
								className={cn(
									"font-medium text-sm",
									getScoreColor(survey.fatigue, true),
								)}
							>
								{survey.fatigue}/10
							</p>
						</div>
					</div>

					{/* Mood */}
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"flex size-8 items-center justify-center rounded-lg",
								getScoreBgColor(survey.mood),
							)}
						>
							<span className="text-sm">
								{survey.mood <= 2
									? "😫"
									: survey.mood <= 4
										? "😕"
										: survey.mood <= 6
											? "😐"
											: survey.mood <= 8
												? "🙂"
												: "😊"}
							</span>
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Mood</p>
							<p className={cn("font-medium text-sm", getScoreColor(survey.mood))}>
								{survey.mood}/10
							</p>
						</div>
					</div>

					{/* Soreness (inverse) */}
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"flex size-8 items-center justify-center rounded-lg",
								getScoreBgColor(survey.muscleSoreness, true),
							)}
						>
							<span
								className={cn("text-sm", getScoreColor(survey.muscleSoreness, true))}
							>
								{survey.muscleSoreness <= 3
									? "✓"
									: survey.muscleSoreness <= 6
										? "~"
										: "!"}
							</span>
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Soreness</p>
							<p
								className={cn(
									"font-medium text-sm",
									getScoreColor(survey.muscleSoreness, true),
								)}
							>
								{survey.muscleSoreness}/10
							</p>
						</div>
					</div>
				</div>

				{survey.notes && (
					<p className="mt-3 text-muted-foreground text-sm">
						<span className="font-medium">Notes:</span> {survey.notes}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
