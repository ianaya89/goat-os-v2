"use client";

import NiceModal from "@ebay/nice-modal-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { endMatchSchema } from "@/schemas/organization-match-schemas";
import { trpc } from "@/trpc/client";

const resultLabels: Record<string, string> = {
	win: "Victoria",
	loss: "Derrota",
	draw: "Empate",
};

interface Match {
	id: string;
	homeTeam: { id: string; name: string } | null;
	awayTeam: { id: string; name: string } | null;
	opponentName: string | null;
	homeScore: number | null;
	awayScore: number | null;
	status: string;
}

interface MatchResultModalProps {
	match: Match;
}

export const MatchResultModal = NiceModal.create<MatchResultModalProps>(
	({ match }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: endMatchSchema,
			defaultValues: {
				id: match.id,
				homeScore: match.homeScore ?? 0,
				awayScore: match.awayScore ?? 0,
				result: undefined,
			},
		});

		const endMatchMutation = trpc.organization.match.endMatch.useMutation({
			onSuccess: () => {
				toast.success("Resultado registrado");
				utils.organization.match.list.invalidate();
				utils.organization.match.get.invalidate();
				utils.organization.match.listUpcoming.invalidate();
				utils.organization.match.listRecent.invalidate();
				modal.hide();
			},
			onError: (error: { message?: string }) => {
				toast.error(error.message || "Error al registrar resultado");
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			endMatchMutation.mutate(data);
		});

		const isPending = endMatchMutation.isPending;
		const homeTeamName = match.homeTeam?.name ?? "Local";
		const awayTeamName =
			match.awayTeam?.name ?? match.opponentName ?? "Visitante";

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.hide()}
			>
				<SheetContent className="sm:max-w-md">
					<SheetHeader>
						<SheetTitle>Registrar resultado</SheetTitle>
						<SheetDescription>
							{homeTeamName} vs {awayTeamName}
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form onSubmit={onSubmit} className="mt-6 space-y-6">
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="homeScore"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{homeTeamName}</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={0}
													className="text-center text-2xl font-bold"
													{...field}
													onChange={(e) =>
														field.onChange(parseInt(e.target.value, 10) || 0)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="awayScore"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{awayTeamName}</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={0}
													className="text-center text-2xl font-bold"
													{...field}
													onChange={(e) =>
														field.onChange(parseInt(e.target.value, 10) || 0)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="result"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Resultado (para nuestro equipo)</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value ?? undefined}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar resultado" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.entries(resultLabels).map(([value, label]) => (
													<SelectItem key={value} value={value}>
														{label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<SheetFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => modal.hide()}
									disabled={isPending}
								>
									Cancelar
								</Button>
								<Button type="submit" disabled={isPending}>
									{isPending ? "Guardando..." : "Guardar resultado"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
