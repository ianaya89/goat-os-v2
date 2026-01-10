"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { RatingInput } from "@/components/organization/rating-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user/user-avatar";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface EvaluationFormProps {
	sessionId: string;
}

interface AthleteEvaluation {
	athleteId: string;
	performanceRating: number | null;
	performanceNotes: string;
	attitudeRating: number | null;
	attitudeNotes: string;
	physicalFitnessRating: number | null;
	physicalFitnessNotes: string;
	generalNotes: string;
}

export function EvaluationForm({ sessionId }: EvaluationFormProps) {
	const utils = trpc.useUtils();
	const [expandedAthlete, setExpandedAthlete] = React.useState<string | null>(
		null,
	);
	const [evaluations, setEvaluations] = React.useState<
		Map<string, AthleteEvaluation>
	>(new Map());
	const [hasChanges, setHasChanges] = React.useState(false);

	// Get session with athletes
	const { data: session, isLoading: sessionLoading } =
		trpc.organization.trainingSession.get.useQuery({ id: sessionId });

	// Get existing evaluations
	const { data: existingEvaluations, isLoading: evaluationsLoading } =
		trpc.organization.athleteEvaluation.getSessionEvaluations.useQuery({
			sessionId,
		});

	const bulkUpsertMutation =
		trpc.organization.athleteEvaluation.bulkUpsert.useMutation({
			onSuccess: (result) => {
				toast.success(
					`Saved ${result.insertedCount + result.updatedCount} evaluations`,
				);
				utils.organization.athleteEvaluation.getSessionEvaluations.invalidate({
					sessionId,
				});
				setHasChanges(false);
			},
			onError: (error) => {
				toast.error(error.message || "Failed to save evaluations");
			},
		});

	// Build list of athletes from session
	const athletes = React.useMemo(() => {
		if (!session) return [];

		if (session.athleteGroup?.members) {
			return session.athleteGroup.members.map((m) => ({
				id: m.athlete.id,
				name: m.athlete.user?.name ?? "Unknown",
				image: m.athlete.user?.image ?? null,
			}));
		}

		return session.athletes.map((a) => ({
			id: a.athlete.id,
			name: a.athlete.user?.name ?? "Unknown",
			image: a.athlete.user?.image ?? null,
		}));
	}, [session]);

	// Initialize evaluations from existing data
	React.useEffect(() => {
		if (existingEvaluations) {
			const map = new Map<string, AthleteEvaluation>();
			for (const eval_ of existingEvaluations) {
				map.set(eval_.athleteId, {
					athleteId: eval_.athleteId,
					performanceRating: eval_.performanceRating,
					performanceNotes: eval_.performanceNotes ?? "",
					attitudeRating: eval_.attitudeRating,
					attitudeNotes: eval_.attitudeNotes ?? "",
					physicalFitnessRating: eval_.physicalFitnessRating,
					physicalFitnessNotes: eval_.physicalFitnessNotes ?? "",
					generalNotes: eval_.generalNotes ?? "",
				});
			}
			setEvaluations(map);
		}
	}, [existingEvaluations]);

	const updateEvaluation = (
		athleteId: string,
		field: keyof AthleteEvaluation,
		value: number | string | null,
	) => {
		setEvaluations((prev) => {
			const newMap = new Map(prev);
			const current = newMap.get(athleteId) ?? {
				athleteId,
				performanceRating: null,
				performanceNotes: "",
				attitudeRating: null,
				attitudeNotes: "",
				physicalFitnessRating: null,
				physicalFitnessNotes: "",
				generalNotes: "",
			};
			newMap.set(athleteId, { ...current, [field]: value });
			return newMap;
		});
		setHasChanges(true);
	};

	const handleSave = () => {
		const evaluationsToSave = Array.from(evaluations.values())
			.filter(
				(e) =>
					e.performanceRating !== null ||
					e.attitudeRating !== null ||
					e.physicalFitnessRating !== null ||
					e.performanceNotes ||
					e.attitudeNotes ||
					e.physicalFitnessNotes ||
					e.generalNotes,
			)
			.map((e) => ({
				athleteId: e.athleteId,
				performanceRating: e.performanceRating,
				performanceNotes: e.performanceNotes || null,
				attitudeRating: e.attitudeRating,
				attitudeNotes: e.attitudeNotes || null,
				physicalFitnessRating: e.physicalFitnessRating,
				physicalFitnessNotes: e.physicalFitnessNotes || null,
				generalNotes: e.generalNotes || null,
			}));

		if (evaluationsToSave.length === 0) {
			toast.info("No evaluations to save");
			return;
		}

		bulkUpsertMutation.mutate({
			sessionId,
			evaluations: evaluationsToSave,
		});
	};

	if (sessionLoading || evaluationsLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Evaluations</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (athletes.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Evaluations</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground">
						No athletes assigned to this session.
					</p>
				</CardContent>
			</Card>
		);
	}

	const getAverageRating = (evaluation: AthleteEvaluation | undefined) => {
		if (!evaluation) return null;
		const ratings = [
			evaluation.performanceRating,
			evaluation.attitudeRating,
			evaluation.physicalFitnessRating,
		].filter((r): r is number => r !== null);
		if (ratings.length === 0) return null;
		return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
	};

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between space-y-0">
				<CardTitle>Evaluations</CardTitle>
				<Button
					onClick={handleSave}
					disabled={!hasChanges || bulkUpsertMutation.isPending}
					loading={bulkUpsertMutation.isPending}
				>
					Save Evaluations
				</Button>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{athletes.map((athlete) => {
						const evaluation = evaluations.get(athlete.id);
						const isExpanded = expandedAthlete === athlete.id;
						const avgRating = getAverageRating(evaluation);

						return (
							<Collapsible
								key={athlete.id}
								open={isExpanded}
								onOpenChange={(open) =>
									setExpandedAthlete(open ? athlete.id : null)
								}
							>
								<CollapsibleTrigger asChild>
									<button
										type="button"
										className={cn(
											"flex w-full items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50",
											isExpanded && "bg-muted/50",
										)}
									>
										<div className="flex items-center gap-3">
											<UserAvatar
												className="size-10"
												name={athlete.name}
												src={athlete.image ?? undefined}
											/>
											<div className="text-left">
												<p className="font-medium">{athlete.name}</p>
												{avgRating && (
													<p className="text-muted-foreground text-sm">
														Avg: {avgRating}/5
													</p>
												)}
											</div>
										</div>
										<div className="flex items-center gap-2">
											{evaluation && (
												<div className="flex gap-4 text-muted-foreground text-sm">
													{evaluation.performanceRating && (
														<span>Perf: {evaluation.performanceRating}</span>
													)}
													{evaluation.attitudeRating && (
														<span>Att: {evaluation.attitudeRating}</span>
													)}
													{evaluation.physicalFitnessRating && (
														<span>Fit: {evaluation.physicalFitnessRating}</span>
													)}
												</div>
											)}
											{isExpanded ? (
												<ChevronUpIcon className="size-5 text-muted-foreground" />
											) : (
												<ChevronDownIcon className="size-5 text-muted-foreground" />
											)}
										</div>
									</button>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<div className="space-y-4 border-x border-b p-4">
										{/* Performance */}
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<Label>Performance</Label>
												<RatingInput
													value={evaluation?.performanceRating ?? null}
													onChange={(value) =>
														updateEvaluation(
															athlete.id,
															"performanceRating",
															value,
														)
													}
												/>
											</div>
											<Textarea
												placeholder="Performance notes..."
												className="resize-none"
												rows={2}
												value={evaluation?.performanceNotes ?? ""}
												onChange={(e) =>
													updateEvaluation(
														athlete.id,
														"performanceNotes",
														e.target.value,
													)
												}
											/>
										</div>

										{/* Attitude */}
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<Label>Attitude</Label>
												<RatingInput
													value={evaluation?.attitudeRating ?? null}
													onChange={(value) =>
														updateEvaluation(
															athlete.id,
															"attitudeRating",
															value,
														)
													}
												/>
											</div>
											<Textarea
												placeholder="Attitude notes..."
												className="resize-none"
												rows={2}
												value={evaluation?.attitudeNotes ?? ""}
												onChange={(e) =>
													updateEvaluation(
														athlete.id,
														"attitudeNotes",
														e.target.value,
													)
												}
											/>
										</div>

										{/* Physical Fitness */}
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<Label>Physical Fitness</Label>
												<RatingInput
													value={evaluation?.physicalFitnessRating ?? null}
													onChange={(value) =>
														updateEvaluation(
															athlete.id,
															"physicalFitnessRating",
															value,
														)
													}
												/>
											</div>
											<Textarea
												placeholder="Physical fitness notes..."
												className="resize-none"
												rows={2}
												value={evaluation?.physicalFitnessNotes ?? ""}
												onChange={(e) =>
													updateEvaluation(
														athlete.id,
														"physicalFitnessNotes",
														e.target.value,
													)
												}
											/>
										</div>

										{/* General Notes */}
										<div className="space-y-2">
											<Label>General Notes</Label>
											<Textarea
												placeholder="General observations..."
												className="resize-none"
												rows={3}
												value={evaluation?.generalNotes ?? ""}
												onChange={(e) =>
													updateEvaluation(
														athlete.id,
														"generalNotes",
														e.target.value,
													)
												}
											/>
										</div>
									</div>
								</CollapsibleContent>
							</Collapsible>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
