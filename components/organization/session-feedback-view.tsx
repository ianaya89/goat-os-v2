"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
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
				<div className="py-6 text-center">
					<ActivityIcon className="mx-auto mb-4 size-10 text-muted-foreground" />
					<p className="text-muted-foreground">
						Aún no has enviado feedback para esta sesión.
					</p>
					<p className="mt-1 text-muted-foreground text-sm">
						Puedes agregar tu evaluación de esfuerzo y satisfacción usando el
						botón "Dar Feedback".
					</p>
				</div>
			);
		}

		// Show single feedback item for the athlete
		return (
			<div className="space-y-4">
				<FeedbackItem
					feedback={{
						...myFeedback,
						athlete: {
							id: "",
							user: { id: "", name: "Mi Feedback", email: "", image: null },
						},
					}}
					defaultOpen
				/>
			</div>
		);
	}

	// Handle admin/coach view (all feedback)
	const data = sessionFeedbackQuery.data;

	if (!data || data.totalFeedback === 0) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<ActivityIcon className="mx-auto mb-4 size-10 text-muted-foreground" />
					<p className="text-muted-foreground">
						Aún no hay feedback de atletas.
					</p>
					<p className="mt-1 text-muted-foreground text-sm">
						Los atletas pueden enviar su feedback después de la sesión.
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

			{/* Individual Feedback */}
			<div className="space-y-3">
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
	defaultOpen?: boolean;
}

function FeedbackItem({ feedback, defaultOpen = false }: FeedbackItemProps) {
	const [isOpen, setIsOpen] = React.useState(defaultOpen);
	const hasNotes = feedback.notes && feedback.notes.trim().length > 0;

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<Card>
				<CollapsibleTrigger asChild>
					<CardHeader className="cursor-pointer py-4 hover:bg-muted/50 transition-colors">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<UserAvatar
									className="size-10"
									name={feedback.athlete.user?.name ?? "Desconocido"}
									src={feedback.athlete.user?.image ?? undefined}
								/>
								<div>
									<p className="font-medium">
										{feedback.athlete.user?.name ?? "Atleta Desconocido"}
									</p>
									<p className="text-muted-foreground text-xs">
										{format(new Date(feedback.createdAt), "d 'de' MMM, HH:mm", {
											locale: es,
										})}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								{/* RPE Badge */}
								{feedback.rpeRating && (
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
								)}

								{/* Satisfaction Badge */}
								{feedback.satisfactionRating && (
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
								)}

								{/* Notes indicator */}
								{hasNotes && (
									<MessageSquareIcon className="size-4 text-muted-foreground" />
								)}

								{/* Expand/Collapse */}
								{isOpen ? (
									<ChevronUpIcon className="size-5 text-muted-foreground" />
								) : (
									<ChevronDownIcon className="size-5 text-muted-foreground" />
								)}
							</div>
						</div>
					</CardHeader>
				</CollapsibleTrigger>

				<CollapsibleContent>
					<CardContent className="pt-0 pb-4">
						<div className="grid gap-4 sm:grid-cols-2">
							{/* RPE Details */}
							{feedback.rpeRating && (
								<div
									className={cn(
										"rounded-xl p-4 border",
										getRpeBgColor(feedback.rpeRating),
									)}
								>
									<div className="flex items-center gap-2">
										<ActivityIcon
											className={cn("size-5", getRpeColor(feedback.rpeRating))}
										/>
										<span className="font-semibold text-sm">
											Esfuerzo Percibido
										</span>
									</div>
									<p
										className={cn(
											"mt-2 font-bold text-2xl",
											getRpeColor(feedback.rpeRating),
										)}
									>
										{feedback.rpeRating}/10
									</p>
									<p className="text-muted-foreground text-sm mt-1">
										{rpeDescriptions[feedback.rpeRating]}
									</p>
								</div>
							)}

							{/* Satisfaction Details */}
							{feedback.satisfactionRating && (
								<div
									className={cn(
										"rounded-xl p-4 border",
										getSatisfactionBgColor(feedback.satisfactionRating),
									)}
								>
									<div className="flex items-center gap-2">
										<SmileIcon
											className={cn(
												"size-5",
												getSatisfactionColor(feedback.satisfactionRating),
											)}
										/>
										<span className="font-semibold text-sm">Satisfacción</span>
									</div>
									<div className="mt-2 flex items-center gap-3">
										<span className="text-3xl">
											{getSatisfactionEmoji(feedback.satisfactionRating)}
										</span>
										<span
											className={cn(
												"font-bold text-2xl",
												getSatisfactionColor(feedback.satisfactionRating),
											)}
										>
											{feedback.satisfactionRating}/10
										</span>
									</div>
									<p className="text-muted-foreground text-sm mt-1">
										{satisfactionDescriptions[feedback.satisfactionRating]}
									</p>
								</div>
							)}
						</div>

						{/* Notes */}
						{hasNotes && (
							<div className="mt-4 rounded-xl border bg-muted/30 p-4">
								<div className="flex items-center gap-2 text-muted-foreground">
									<MessageSquareIcon className="size-4" />
									<span className="font-medium text-sm">Comentarios</span>
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
