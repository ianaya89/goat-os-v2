"use client";

import NiceModal from "@ebay/nice-modal-react";
import {
	AwardIcon,
	PlusIcon,
	TrophyIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AthleteAchievementsEditModal } from "@/components/athlete/athlete-achievements-edit-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AchievementScope, type AchievementType } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

// Type label mappings
const typeLabels: Record<AchievementType, string> = {
	championship: "Campeonato",
	award: "Premio",
	selection: "Seleccion",
	record: "Record",
	recognition: "Reconocimiento",
	mvp: "MVP",
	top_scorer: "Goleador",
	best_player: "Mejor Jugador",
	all_star: "All-Star",
	scholarship: "Beca",
	other: "Otro",
};

const typeColors: Record<AchievementType, string> = {
	championship:
		"bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
	award:
		"bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
	selection: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
	record: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
	recognition:
		"bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
	mvp: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
	top_scorer:
		"bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
	best_player:
		"bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
	all_star: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
	scholarship:
		"bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
	other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

interface Achievement {
	id: string;
	title: string;
	type: AchievementType;
	scope: AchievementScope;
	year: number;
	organization: string | null;
	team: string | null;
	competition: string | null;
	position: string | null;
	description: string | null;
	isPublic: boolean;
	displayOrder: number;
}

export function AthleteAchievementsTab() {
	const { data: achievements, isLoading } =
		trpc.athlete.listMyAchievements.useQuery();
	const utils = trpc.useUtils();

	const deleteMutation = trpc.athlete.deleteAchievement.useMutation({
		onSuccess: () => {
			utils.athlete.listMyAchievements.invalidate();
			toast.success("Logro eliminado");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleAdd = () => {
		NiceModal.show(AthleteAchievementsEditModal);
	};

	const handleEdit = (achievement: Achievement) => {
		NiceModal.show(AthleteAchievementsEditModal, { entry: achievement });
	};

	const handleDelete = (id: string) => {
		if (confirm("Eliminar este logro?")) {
			deleteMutation.mutate({ id });
		}
	};

	if (isLoading) {
		return (
			<Card>
				<CardContent className="py-10">
					<div className="flex items-center justify-center">
						<div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<TrophyIcon className="size-5" />
						Palmares y Reconocimientos
					</CardTitle>
					<Button size="sm" onClick={handleAdd}>
						<PlusIcon className="mr-2 size-4" />
						Agregar
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{!achievements || achievements.length === 0 ? (
					<div className="py-10 text-center">
						<TrophyIcon className="mx-auto size-12 text-muted-foreground/50" />
						<h3 className="mt-4 font-semibold">Sin logros registrados</h3>
						<p className="mt-2 max-w-sm mx-auto text-muted-foreground text-sm">
							Agrega tus logros deportivos, premios y reconocimientos para
							mostrarlos en tu perfil publico.
						</p>
						<Button className="mt-4" size="sm" onClick={handleAdd}>
							<PlusIcon className="mr-2 size-4" />
							Agregar Logro
						</Button>
					</div>
				) : (
					<div className="space-y-4">
						{/* Group achievements by year */}
						{Object.entries(
							achievements.reduce<Record<number, typeof achievements>>(
								(acc, achievement) => {
									const year = achievement.year;
									if (!acc[year]) acc[year] = [];
									acc[year].push(achievement);
									return acc;
								},
								{},
							),
						)
							.sort(([a], [b]) => Number(b) - Number(a))
							.map(([year, yearAchievements]) => (
								<div key={year}>
									<h4 className="mb-3 font-semibold text-muted-foreground text-sm">
										{year}
									</h4>
									<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
										{yearAchievements.map((achievement) => (
											<div
												key={achievement.id}
												className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
											>
												{/* Actions */}
												<div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															handleEdit(achievement as Achievement)
														}
													>
														Editar
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="text-destructive hover:text-destructive"
														onClick={() => handleDelete(achievement.id)}
														disabled={deleteMutation.isPending}
													>
														Eliminar
													</Button>
												</div>

												{/* Icon based on scope */}
												<div className="mb-3 flex items-center justify-center">
													<div className="flex size-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
														{achievement.scope ===
														AchievementScope.collective ? (
															<UsersIcon className="size-6 text-amber-600 dark:text-amber-400" />
														) : (
															<AwardIcon className="size-6 text-amber-600 dark:text-amber-400" />
														)}
													</div>
												</div>

												{/* Title */}
												<h4 className="text-center font-semibold line-clamp-2">
													{achievement.title}
												</h4>

												{/* Type badge */}
												<div className="mt-2 flex justify-center gap-2">
													<Badge
														variant="secondary"
														className={
															typeColors[achievement.type as AchievementType]
														}
													>
														{typeLabels[achievement.type as AchievementType]}
													</Badge>
													<Badge variant="outline" className="text-xs">
														{achievement.scope ===
														AchievementScope.collective ? (
															<>
																<UsersIcon className="mr-1 size-3" />
																Colectivo
															</>
														) : (
															<>
																<UserIcon className="mr-1 size-3" />
																Individual
															</>
														)}
													</Badge>
												</div>

												{/* Position/place */}
												{achievement.position && (
													<p className="mt-2 text-center font-medium text-amber-600 text-sm dark:text-amber-400">
														{achievement.position}
													</p>
												)}

												{/* Competition */}
												{achievement.competition && (
													<p className="mt-1 text-center text-muted-foreground text-xs line-clamp-1">
														{achievement.competition}
													</p>
												)}

												{/* Team */}
												{achievement.team && (
													<p className="mt-1 text-center text-muted-foreground text-xs">
														con {achievement.team}
													</p>
												)}

												{/* Organization */}
												{achievement.organization && (
													<p className="mt-1 text-center text-muted-foreground text-xs line-clamp-1">
														{achievement.organization}
													</p>
												)}

												{/* Private badge */}
												{!achievement.isPublic && (
													<div className="mt-2 flex justify-center">
														<Badge variant="outline" className="text-xs">
															Privado
														</Badge>
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
