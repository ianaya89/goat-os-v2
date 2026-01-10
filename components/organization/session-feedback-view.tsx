"use client";

import { format } from "date-fns";
import {
	ActivityIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	MessageSquareIcon,
	SmileIcon,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user/user-avatar";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface SessionFeedbackViewProps {
	sessionId: string;
}

// Helper to get color based on RPE value
function getRpeColor(value: number): string {
	if (value <= 2) return "text-green-600";
	if (value <= 4) return "text-blue-600";
	if (value <= 6) return "text-yellow-600";
	if (value <= 8) return "text-orange-600";
	return "text-red-600";
}

function getRpeBgColor(value: number): string {
	if (value <= 2) return "bg-green-100 dark:bg-green-950";
	if (value <= 4) return "bg-blue-100 dark:bg-blue-950";
	if (value <= 6) return "bg-yellow-100 dark:bg-yellow-950";
	if (value <= 8) return "bg-orange-100 dark:bg-orange-950";
	return "bg-red-100 dark:bg-red-950";
}

// Helper to get satisfaction emoji
function getSatisfactionEmoji(value: number): string {
	if (value <= 2) return "😫";
	if (value <= 4) return "😕";
	if (value <= 6) return "😐";
	if (value <= 8) return "🙂";
	return "😊";
}

function getSatisfactionColor(value: number): string {
	if (value <= 2) return "text-red-600";
	if (value <= 4) return "text-orange-600";
	if (value <= 6) return "text-yellow-600";
	if (value <= 8) return "text-blue-600";
	return "text-green-600";
}

// RPE descriptions
const rpeDescriptions: Record<number, string> = {
	1: "Very light",
	2: "Light",
	3: "Moderate",
	4: "Somewhat hard",
	5: "Hard",
	6: "Hard",
	7: "Very hard",
	8: "Very hard",
	9: "Extremely hard",
	10: "Maximum",
};

export function SessionFeedbackView({ sessionId }: SessionFeedbackViewProps) {
	const { data, isLoading, error } =
		trpc.organization.sessionFeedback.getSessionFeedback.useQuery({
			sessionId,
		});

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-24" />
				<Skeleton className="h-32" />
				<Skeleton className="h-32" />
			</div>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">Failed to load feedback.</p>
				</CardContent>
			</Card>
		);
	}

	if (!data || data.totalFeedback === 0) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<ActivityIcon className="mx-auto mb-4 size-10 text-muted-foreground" />
					<p className="text-muted-foreground">
						No athlete feedback submitted yet.
					</p>
					<p className="mt-1 text-muted-foreground text-sm">
						Athletes can submit their feedback after the session.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{/* Summary Card */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Feedback Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 sm:grid-cols-3">
						{/* Total Feedback */}
						<div className="text-center">
							<p className="font-bold text-2xl">{data.totalFeedback}</p>
							<p className="text-muted-foreground text-sm">
								{data.totalFeedback === 1
									? "athlete responded"
									: "athletes responded"}
							</p>
						</div>

						{/* Average RPE */}
						<div className="text-center">
							<div className="flex items-center justify-center gap-2">
								<ActivityIcon className="size-5 text-muted-foreground" />
								<span
									className={cn(
										"font-bold text-2xl",
										data.averageRpe && getRpeColor(Math.round(data.averageRpe)),
									)}
								>
									{data.averageRpe ? data.averageRpe.toFixed(1) : "-"}
								</span>
							</div>
							<p className="text-muted-foreground text-sm">Avg RPE</p>
						</div>

						{/* Average Satisfaction */}
						<div className="text-center">
							<div className="flex items-center justify-center gap-2">
								<span className="text-2xl">
									{data.averageSatisfaction
										? getSatisfactionEmoji(Math.round(data.averageSatisfaction))
										: "-"}
								</span>
								<span
									className={cn(
										"font-bold text-2xl",
										data.averageSatisfaction &&
											getSatisfactionColor(Math.round(data.averageSatisfaction)),
									)}
								>
									{data.averageSatisfaction
										? data.averageSatisfaction.toFixed(1)
										: "-"}
								</span>
							</div>
							<p className="text-muted-foreground text-sm">Avg Satisfaction</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Individual Feedback */}
			<div className="space-y-2">
				{data.feedback.map((item) => (
					<FeedbackItem key={item.id} feedback={item} />
				))}
			</div>
		</div>
	);
}

interface FeedbackItemProps {
	feedback: {
		id: string;
		rpeRating: number | null;
		satisfactionRating: number | null;
		notes: string | null;
		createdAt: Date;
		athlete: {
			id: string;
			user?: {
				id: string;
				name: string | null;
				email: string;
				image: string | null;
			} | null;
		};
	};
}

function FeedbackItem({ feedback }: FeedbackItemProps) {
	const [isOpen, setIsOpen] = React.useState(false);
	const hasNotes = feedback.notes && feedback.notes.trim().length > 0;

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<Card>
				<CollapsibleTrigger asChild>
					<CardHeader className="cursor-pointer pb-3 hover:bg-muted/50">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<UserAvatar
									className="size-8"
									name={feedback.athlete.user?.name ?? "Unknown"}
									src={feedback.athlete.user?.image ?? undefined}
								/>
								<div>
									<p className="font-medium">
										{feedback.athlete.user?.name ?? "Unknown Athlete"}
									</p>
									<p className="text-muted-foreground text-xs">
										{format(new Date(feedback.createdAt), "MMM d, h:mm a")}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								{/* RPE Badge */}
								{feedback.rpeRating && (
									<Badge
										variant="outline"
										className={cn(
											"gap-1",
											getRpeBgColor(feedback.rpeRating),
											getRpeColor(feedback.rpeRating),
										)}
									>
										<ActivityIcon className="size-3" />
										{feedback.rpeRating}/10
									</Badge>
								)}

								{/* Satisfaction Badge */}
								{feedback.satisfactionRating && (
									<Badge
										variant="outline"
										className={cn(
											"gap-1",
											getSatisfactionColor(feedback.satisfactionRating),
										)}
									>
										{getSatisfactionEmoji(feedback.satisfactionRating)}{" "}
										{feedback.satisfactionRating}/10
									</Badge>
								)}

								{/* Notes indicator */}
								{hasNotes && (
									<MessageSquareIcon className="size-4 text-muted-foreground" />
								)}

								{/* Expand/Collapse */}
								{isOpen ? (
									<ChevronUpIcon className="size-4 text-muted-foreground" />
								) : (
									<ChevronDownIcon className="size-4 text-muted-foreground" />
								)}
							</div>
						</div>
					</CardHeader>
				</CollapsibleTrigger>

				<CollapsibleContent>
					<CardContent className="pt-0">
						<div className="grid gap-4 sm:grid-cols-2">
							{/* RPE Details */}
							{feedback.rpeRating && (
								<div
									className={cn(
										"rounded-lg p-3",
										getRpeBgColor(feedback.rpeRating),
									)}
								>
									<div className="flex items-center gap-2">
										<ActivityIcon
											className={cn("size-4", getRpeColor(feedback.rpeRating))}
										/>
										<span className="font-medium text-sm">
											Perceived Exertion
										</span>
									</div>
									<p
										className={cn(
											"mt-1 font-bold text-xl",
											getRpeColor(feedback.rpeRating),
										)}
									>
										{feedback.rpeRating}/10
									</p>
									<p className="text-muted-foreground text-xs">
										{rpeDescriptions[feedback.rpeRating]}
									</p>
								</div>
							)}

							{/* Satisfaction Details */}
							{feedback.satisfactionRating && (
								<div className="rounded-lg bg-muted/50 p-3">
									<div className="flex items-center gap-2">
										<SmileIcon className="size-4 text-muted-foreground" />
										<span className="font-medium text-sm">Satisfaction</span>
									</div>
									<div className="mt-1 flex items-center gap-2">
										<span className="text-2xl">
											{getSatisfactionEmoji(feedback.satisfactionRating)}
										</span>
										<span
											className={cn(
												"font-bold text-xl",
												getSatisfactionColor(feedback.satisfactionRating),
											)}
										>
											{feedback.satisfactionRating}/10
										</span>
									</div>
								</div>
							)}
						</div>

						{/* Notes */}
						{hasNotes && (
							<div className="mt-4 rounded-lg border p-3">
								<div className="flex items-center gap-2 text-muted-foreground">
									<MessageSquareIcon className="size-4" />
									<span className="font-medium text-sm">Notes</span>
								</div>
								<p className="mt-2 whitespace-pre-wrap text-sm">
									{feedback.notes}
								</p>
							</div>
						)}
					</CardContent>
				</CollapsibleContent>
			</Card>
		</Collapsible>
	);
}
