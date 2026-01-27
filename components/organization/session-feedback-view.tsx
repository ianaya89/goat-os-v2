"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ActivityIcon, MessageSquareIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user/user-avatar";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface SessionFeedbackViewProps {
	sessionId: string;
	athleteView?: boolean; // When true, only shows the current athlete's feedback
}

// Helper to get color based on RPE value
function getRpeColor(value: number): string {
	if (value <= 2) return "text-green-600 dark:text-green-400";
	if (value <= 4) return "text-emerald-600 dark:text-emerald-400";
	if (value <= 6) return "text-yellow-600 dark:text-yellow-400";
	if (value <= 8) return "text-orange-600 dark:text-orange-400";
	return "text-red-600 dark:text-red-400";
}

function getRpeBgColor(value: number): string {
	if (value <= 2) return "bg-green-100 dark:bg-green-950";
	if (value <= 4) return "bg-emerald-100 dark:bg-emerald-950";
	if (value <= 6) return "bg-yellow-100 dark:bg-yellow-950";
	if (value <= 8) return "bg-orange-100 dark:bg-orange-950";
	return "bg-red-100 dark:bg-red-950";
}

// Helper to get satisfaction emoji
function getSatisfactionEmoji(value: number): string {
	if (value <= 2) return "😫";
	if (value <= 4) return "😕";
	if (value <= 6) return "😐";
	if (value <= 8) return "😊";
	return "🤩";
}

function getSatisfactionColor(value: number): string {
	if (value <= 2) return "text-red-600 dark:text-red-400";
	if (value <= 4) return "text-orange-600 dark:text-orange-400";
	if (value <= 6) return "text-yellow-600 dark:text-yellow-400";
	if (value <= 8) return "text-emerald-600 dark:text-emerald-400";
	return "text-green-600 dark:text-green-400";
}

function getSatisfactionBgColor(value: number): string {
	if (value <= 2) return "bg-red-100 dark:bg-red-950";
	if (value <= 4) return "bg-orange-100 dark:bg-orange-950";
	if (value <= 6) return "bg-yellow-100 dark:bg-yellow-950";
	if (value <= 8) return "bg-emerald-100 dark:bg-emerald-950";
	return "bg-green-100 dark:bg-green-950";
}

// RPE descriptions in Spanish
const rpeDescriptions: Record<number, string> = {
	1: "Muy fácil",
	2: "Fácil",
	3: "Moderado",
	4: "Algo difícil",
	5: "Difícil",
	6: "Difícil",
	7: "Muy difícil",
	8: "Muy difícil",
	9: "Extremo",
	10: "Máximo",
};

// Satisfaction descriptions in Spanish
const satisfactionDescriptions: Record<number, string> = {
	1: "Muy insatisfecho",
	2: "Insatisfecho",
	3: "Algo insatisfecho",
	4: "Poco satisfecho",
	5: "Neutral",
	6: "Algo satisfecho",
	7: "Satisfecho",
	8: "Muy satisfecho",
	9: "Excelente",
	10: "Increíble",
};

export function SessionFeedbackView({
	sessionId,
	athleteView,
}: SessionFeedbackViewProps) {
	// Use different queries based on view type
	const sessionFeedbackQuery =
		trpc.organization.sessionFeedback.getSessionFeedback.useQuery(
			{ sessionId },
			{ enabled: !athleteView },
		);

	const myFeedbackQuery =
		trpc.organization.sessionFeedback.getMyFeedback.useQuery(
			{ sessionId },
			{ enabled: !!athleteView },
		);

	const isLoading = athleteView
		? myFeedbackQuery.isLoading
		: sessionFeedbackQuery.isLoading;
	const error = athleteView
		? myFeedbackQuery.error
		: sessionFeedbackQuery.error;

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-24" />
				<Skeleton className="h-32" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="py-6 text-center">
				<p className="text-muted-foreground">Error al cargar el feedback.</p>
			</div>
		);
	}

	// Handle athlete view (my feedback only)
	if (athleteView) {
		const myFeedback = myFeedbackQuery.data?.feedback;

		if (!myFeedback) {
			return (
				<EmptyState
					icon={ActivityIcon}
					title="Aún no has enviado feedback para esta sesión"
				/>
			);
		}

		// Show single feedback as a simple summary
		return (
			<div className="rounded-lg border">
				<table className="w-full">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								RPE
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Satisfacción
							</th>
							<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
								Notas
							</th>
							<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
								Fecha
							</th>
						</tr>
					</thead>
					<tbody className="divide-y">
						<FeedbackRow
							feedback={{
								...myFeedback,
								athlete: {
									id: "",
									user: { id: "", name: "Mi Feedback", email: "", image: null },
								},
							}}
							hideAthlete
						/>
					</tbody>
				</table>
			</div>
		);
	}

	// Handle admin/coach view (all feedback)
	const data = sessionFeedbackQuery.data;

	if (!data || data.totalFeedback === 0) {
		return (
			<EmptyState icon={ActivityIcon} title="Aún no hay feedback de atletas" />
		);
	}

	return (
		<div className="space-y-4">
			{/* Summary Card */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Resumen de Feedback</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-6 sm:grid-cols-3">
						{/* Total Feedback */}
						<div className="text-center p-4 rounded-xl bg-muted/50">
							<p className="font-bold text-3xl">{data.totalFeedback}</p>
							<p className="text-muted-foreground text-sm mt-1">
								{data.totalFeedback === 1
									? "atleta respondió"
									: "atletas respondieron"}
							</p>
						</div>

						{/* Average RPE */}
						<div className="text-center p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30">
							<div className="flex items-center justify-center gap-2">
								<ActivityIcon className="size-5 text-orange-500" />
								<span
									className={cn(
										"font-bold text-3xl",
										data.averageRpe && getRpeColor(Math.round(data.averageRpe)),
									)}
								>
									{data.averageRpe ? data.averageRpe.toFixed(1) : "-"}
								</span>
							</div>
							<p className="text-muted-foreground text-sm mt-1">RPE Promedio</p>
						</div>

						{/* Average Satisfaction */}
						<div className="text-center p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30">
							<div className="flex items-center justify-center gap-2">
								<span className="text-2xl">
									{data.averageSatisfaction
										? getSatisfactionEmoji(Math.round(data.averageSatisfaction))
										: "-"}
								</span>
								<span
									className={cn(
										"font-bold text-3xl",
										data.averageSatisfaction &&
											getSatisfactionColor(
												Math.round(data.averageSatisfaction),
											),
									)}
								>
									{data.averageSatisfaction
										? data.averageSatisfaction.toFixed(1)
										: "-"}
								</span>
							</div>
							<p className="text-muted-foreground text-sm mt-1">
								Satisfacción Promedio
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Feedback Table */}
			<div className="rounded-lg border">
				<table className="w-full">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Atleta
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								RPE
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Satisfacción
							</th>
							<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
								Notas
							</th>
							<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
								Fecha
							</th>
						</tr>
					</thead>
					<tbody className="divide-y">
						{data.feedback.map((item) => (
							<FeedbackRow key={item.id} feedback={item} />
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

type FeedbackData = {
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

function FeedbackRow({
	feedback,
	hideAthlete,
}: {
	feedback: FeedbackData;
	hideAthlete?: boolean;
}) {
	return (
		<tr className="hover:bg-muted/30">
			{/* Athlete */}
			{!hideAthlete && (
				<td className="px-4 py-3">
					<div className="flex items-center gap-2">
						<UserAvatar
							className="size-6"
							name={feedback.athlete.user?.name ?? ""}
							src={feedback.athlete.user?.image ?? undefined}
						/>
						<span className="font-medium text-sm">
							{feedback.athlete.user?.name ?? "Atleta Desconocido"}
						</span>
					</div>
				</td>
			)}

			{/* RPE */}
			<td className="px-4 py-3">
				{feedback.rpeRating ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<Badge
								variant="outline"
								className={cn(
									"gap-1.5 px-2.5 py-1",
									getRpeBgColor(feedback.rpeRating),
									getRpeColor(feedback.rpeRating),
								)}
							>
								<ActivityIcon className="size-3.5" />
								{feedback.rpeRating}/10
							</Badge>
						</TooltipTrigger>
						<TooltipContent>
							{rpeDescriptions[feedback.rpeRating]}
						</TooltipContent>
					</Tooltip>
				) : (
					<span className="text-muted-foreground text-sm">-</span>
				)}
			</td>

			{/* Satisfaction */}
			<td className="px-4 py-3">
				{feedback.satisfactionRating ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<Badge
								variant="outline"
								className={cn(
									"gap-1.5 px-2.5 py-1",
									getSatisfactionBgColor(feedback.satisfactionRating),
									getSatisfactionColor(feedback.satisfactionRating),
								)}
							>
								{getSatisfactionEmoji(feedback.satisfactionRating)}{" "}
								{feedback.satisfactionRating}/10
							</Badge>
						</TooltipTrigger>
						<TooltipContent>
							{satisfactionDescriptions[feedback.satisfactionRating]}
						</TooltipContent>
					</Tooltip>
				) : (
					<span className="text-muted-foreground text-sm">-</span>
				)}
			</td>

			{/* Notes */}
			<td className="hidden px-4 py-3 sm:table-cell">
				{feedback.notes && feedback.notes.trim().length > 0 ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
								<MessageSquareIcon className="size-3.5" />
								<span className="max-w-[200px] truncate">{feedback.notes}</span>
							</div>
						</TooltipTrigger>
						<TooltipContent className="max-w-xs">
							<p className="whitespace-pre-wrap">{feedback.notes}</p>
						</TooltipContent>
					</Tooltip>
				) : (
					<span className="text-muted-foreground text-sm">-</span>
				)}
			</td>

			{/* Date */}
			<td className="hidden px-4 py-3 sm:table-cell">
				<span className="text-sm text-muted-foreground">
					{format(new Date(feedback.createdAt), "d MMM, HH:mm", {
						locale: es,
					})}
				</span>
			</td>
		</tr>
	);
}
