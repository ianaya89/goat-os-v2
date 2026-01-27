"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	StarIcon,
	Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { AddEvaluationModal } from "@/components/organization/add-evaluation-modal";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { UserAvatar } from "@/components/user/user-avatar";
import { trpc } from "@/trpc/client";

type EvaluationBase = {
	id: string;
	performanceRating: number | null;
	performanceNotes: string | null;
	attitudeRating: number | null;
	attitudeNotes: string | null;
	physicalFitnessRating: number | null;
	physicalFitnessNotes: string | null;
	generalNotes: string | null;
	evaluatedByUser: { id: string; name: string | null } | null;
};

type AthleteEvaluation = EvaluationBase & {
	session: { id: string; title: string; startTime: Date | string };
};

type SessionEvaluation = EvaluationBase & {
	athleteId: string;
	athlete: {
		id: string;
		user: { id: string; name: string | null; image: string | null } | null;
	};
};

type CompletedSession = {
	id: string;
	title: string;
	startTime: Date;
	status: string;
};

type SessionAthlete = {
	id: string;
	name: string;
	image: string | null;
};

/**
 * Athlete-context evaluations table: shows evaluations for a specific athlete across sessions.
 */
export function AthleteEvaluationsTable({
	athleteId,
	athleteName,
	evaluations,
	sessions,
	onEvaluationDeleted,
}: {
	athleteId: string;
	athleteName?: string | null;
	evaluations: AthleteEvaluation[];
	sessions: CompletedSession[];
	onEvaluationDeleted?: () => void;
}) {
	const t = useTranslations("athletes.evaluations");

	const deleteEvaluationMutation =
		trpc.organization.athleteEvaluation.delete.useMutation({
			onSuccess: () => {
				toast.success(t("deleted"));
				onEvaluationDeleted?.();
			},
		});

	const handleAdd = () => {
		NiceModal.show(AddEvaluationModal, {
			athleteId,
			athleteName: athleteName ?? undefined,
			sessions,
		});
	};

	const handleEdit = (evaluation: AthleteEvaluation) => {
		NiceModal.show(AddEvaluationModal, {
			athleteId,
			athleteName: athleteName ?? undefined,
			sessions,
			initialSessionId: evaluation.session.id,
			initialValues: {
				performanceRating: evaluation.performanceRating,
				performanceNotes: evaluation.performanceNotes ?? "",
				attitudeRating: evaluation.attitudeRating,
				attitudeNotes: evaluation.attitudeNotes ?? "",
				physicalFitnessRating: evaluation.physicalFitnessRating,
				physicalFitnessNotes: evaluation.physicalFitnessNotes ?? "",
				generalNotes: evaluation.generalNotes ?? "",
			},
		});
	};

	const handleDelete = (evaluation: AthleteEvaluation) => {
		NiceModal.show(ConfirmationModal, {
			title: t("deleteConfirm.title"),
			message: t("deleteConfirm.message", {
				name: evaluation.session.title,
			}),
			confirmLabel: t("deleteConfirm.confirm"),
			destructive: true,
			onConfirm: () => deleteEvaluationMutation.mutate({ id: evaluation.id }),
		});
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button size="sm" onClick={handleAdd}>
					<PlusIcon className="mr-2 size-4" />
					{t("addEvaluation")}
				</Button>
			</div>
			{evaluations.length === 0 ? (
				<EmptyState icon={StarIcon} title={t("noEvaluations")} />
			) : (
				<div className="rounded-lg border">
					<table className="w-full">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									{t("table.session")}
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									{t("table.date")}
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									{t("table.ratings")}
								</th>
								<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
									{t("table.evaluator")}
								</th>
								<th className="w-[50px] px-4 py-3 text-right text-xs font-medium text-muted-foreground">
									<span className="sr-only">{t("table.actions")}</span>
								</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{evaluations.map((evaluation) => (
								<tr key={evaluation.id} className="hover:bg-muted/30">
									<td className="px-4 py-3">
										<Link
											href={`/dashboard/organization/training-sessions/${evaluation.session.id}`}
											className="font-medium text-sm hover:underline"
										>
											{evaluation.session.title}
										</Link>
									</td>
									<td className="px-4 py-3 text-sm">
										{format(
											new Date(evaluation.session.startTime),
											"dd MMM yyyy",
										)}
									</td>
									<RatingsCell evaluation={evaluation} t={t} />
									<EvaluatorCell evaluatedByUser={evaluation.evaluatedByUser} />
									<ActionsCell
										onEdit={() => handleEdit(evaluation)}
										onDelete={() => handleDelete(evaluation)}
										t={t}
									/>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

/**
 * Session-context evaluations table: shows evaluations for a specific session across athletes.
 */
export function SessionEvaluationsTable({
	sessionId,
	sessionTitle,
	evaluations,
	athletes,
	onEvaluationDeleted,
}: {
	sessionId: string;
	sessionTitle: string;
	evaluations: SessionEvaluation[];
	athletes: SessionAthlete[];
	onEvaluationDeleted?: () => void;
}) {
	const t = useTranslations("athletes.evaluations");

	const deleteEvaluationMutation =
		trpc.organization.athleteEvaluation.delete.useMutation({
			onSuccess: () => {
				toast.success(t("deleted"));
				onEvaluationDeleted?.();
			},
		});

	const sessionForModal: CompletedSession = {
		id: sessionId,
		title: sessionTitle,
		startTime: new Date(),
		status: "completed",
	};

	const handleEdit = (evaluation: SessionEvaluation) => {
		NiceModal.show(AddEvaluationModal, {
			athleteId: evaluation.athleteId,
			athleteName: evaluation.athlete.user?.name ?? undefined,
			sessions: [sessionForModal],
			initialSessionId: sessionId,
			initialValues: {
				performanceRating: evaluation.performanceRating,
				performanceNotes: evaluation.performanceNotes ?? "",
				attitudeRating: evaluation.attitudeRating,
				attitudeNotes: evaluation.attitudeNotes ?? "",
				physicalFitnessRating: evaluation.physicalFitnessRating,
				physicalFitnessNotes: evaluation.physicalFitnessNotes ?? "",
				generalNotes: evaluation.generalNotes ?? "",
			},
		});
	};

	const handleAddForAthlete = (athlete: SessionAthlete) => {
		NiceModal.show(AddEvaluationModal, {
			athleteId: athlete.id,
			athleteName: athlete.name,
			sessions: [sessionForModal],
			initialSessionId: sessionId,
		});
	};

	const handleDelete = (evaluation: SessionEvaluation) => {
		NiceModal.show(ConfirmationModal, {
			title: t("deleteConfirm.title"),
			message: t("deleteConfirm.message", {
				name: evaluation.athlete.user?.name ?? "",
			}),
			confirmLabel: t("deleteConfirm.confirm"),
			destructive: true,
			onConfirm: () => deleteEvaluationMutation.mutate({ id: evaluation.id }),
		});
	};

	// Athletes that don't have an evaluation yet
	const evaluatedAthleteIds = new Set(evaluations.map((e) => e.athleteId));
	const unevaluatedAthletes = athletes.filter(
		(a) => !evaluatedAthleteIds.has(a.id),
	);

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				{unevaluatedAthletes.length > 0 ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button size="sm">
								<PlusIcon className="mr-2 size-4" />
								{t("addEvaluation")}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuLabel>{t("table.athlete")}</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{unevaluatedAthletes.map((athlete) => (
								<DropdownMenuItem
									key={athlete.id}
									onClick={() => handleAddForAthlete(athlete)}
									className="gap-2"
								>
									<UserAvatar
										className="size-5"
										name={athlete.name}
										src={athlete.image ?? undefined}
									/>
									{athlete.name}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<Button size="sm" disabled>
						<PlusIcon className="mr-2 size-4" />
						{t("addEvaluation")}
					</Button>
				)}
			</div>
			{evaluations.length === 0 ? (
				<EmptyState icon={StarIcon} title={t("noEvaluations")} />
			) : (
				<div className="rounded-lg border">
					<table className="w-full">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									{t("table.athlete")}
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									{t("table.ratings")}
								</th>
								<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
									{t("table.evaluator")}
								</th>
								<th className="w-[50px] px-4 py-3 text-right text-xs font-medium text-muted-foreground">
									<span className="sr-only">{t("table.actions")}</span>
								</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{evaluations.map((evaluation) => (
								<tr key={evaluation.id} className="hover:bg-muted/30">
									<td className="px-4 py-3">
										<Link
											href={`/dashboard/organization/athletes/${evaluation.athlete.id}`}
											className="flex items-center gap-2 font-medium text-sm hover:underline"
										>
											<UserAvatar
												className="size-6"
												name={evaluation.athlete.user?.name ?? ""}
												src={evaluation.athlete.user?.image ?? undefined}
											/>
											{evaluation.athlete.user?.name}
										</Link>
									</td>
									<RatingsCell evaluation={evaluation} t={t} />
									<EvaluatorCell evaluatedByUser={evaluation.evaluatedByUser} />
									<ActionsCell
										onEdit={() => handleEdit(evaluation)}
										onDelete={() => handleDelete(evaluation)}
										t={t}
									/>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

// --- Shared cell components ---

function RatingsCell({
	evaluation,
	t,
}: {
	evaluation: EvaluationBase;
	t: ReturnType<typeof useTranslations<"athletes.evaluations">>;
}) {
	return (
		<td className="px-4 py-3">
			<div className="flex items-center gap-3">
				{evaluation.performanceRating && (
					<div
						className="flex items-center gap-1 text-sm"
						title={t("performance")}
					>
						<StarIcon className="size-3.5 fill-yellow-400 text-yellow-400" />
						<span className="tabular-nums">
							{evaluation.performanceRating}/5
						</span>
					</div>
				)}
				{evaluation.attitudeRating && (
					<div
						className="flex items-center gap-1 text-sm"
						title={t("attitude")}
					>
						<StarIcon className="size-3.5 fill-yellow-400 text-yellow-400" />
						<span className="tabular-nums">{evaluation.attitudeRating}/5</span>
					</div>
				)}
				{evaluation.physicalFitnessRating && (
					<div
						className="flex items-center gap-1 text-sm"
						title={t("physicalFitness")}
					>
						<StarIcon className="size-3.5 fill-yellow-400 text-yellow-400" />
						<span className="tabular-nums">
							{evaluation.physicalFitnessRating}/5
						</span>
					</div>
				)}
			</div>
		</td>
	);
}

function EvaluatorCell({
	evaluatedByUser,
}: {
	evaluatedByUser: { id: string; name: string | null } | null;
}) {
	return (
		<td className="hidden px-4 py-3 sm:table-cell">
			{evaluatedByUser ? (
				<div className="flex items-center gap-2 text-sm">
					<UserAvatar
						className="size-5"
						name={evaluatedByUser.name ?? ""}
						src={undefined}
					/>
					<span>{evaluatedByUser.name}</span>
				</div>
			) : (
				<span className="text-muted-foreground">-</span>
			)}
		</td>
	);
}

function ActionsCell({
	onEdit,
	onDelete,
	t,
}: {
	onEdit: () => void;
	onDelete: () => void;
	t: ReturnType<typeof useTranslations<"athletes.evaluations">>;
}) {
	return (
		<td className="px-4 py-3">
			<div className="flex justify-end">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							className="size-8 text-muted-foreground data-[state=open]:bg-muted"
							size="icon"
							variant="ghost"
						>
							<MoreHorizontalIcon className="shrink-0" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={onEdit}>
							<PencilIcon className="mr-2 size-4" />
							{t("actions.edit")}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem variant="destructive" onClick={onDelete}>
							<Trash2Icon className="mr-2 size-4" />
							{t("actions.delete")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</td>
	);
}
