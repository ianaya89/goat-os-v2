"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import {
	createSeasonSchema,
	updateSeasonSchema,
} from "@/schemas/organization-season-schemas";
import { trpc } from "@/trpc/client";

interface Season {
	id: string;
	name: string;
	startDate: Date;
	endDate: Date;
	isActive: boolean;
	isCurrent: boolean;
}

interface SeasonsModalProps {
	season?: Season;
}

export const SeasonsModal = NiceModal.create<SeasonsModalProps>(
	({ season }) => {
		const modal = useEnhancedModal();
		const isEditing = !!season;
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: isEditing ? updateSeasonSchema : createSeasonSchema,
			defaultValues: {
				id: season?.id,
				name: season?.name ?? "",
				startDate: season?.startDate ? new Date(season.startDate) : new Date(),
				endDate: season?.endDate ? new Date(season.endDate) : new Date(),
				isActive: season?.isActive ?? true,
				isCurrent: season?.isCurrent ?? false,
			},
		});

		const createMutation = trpc.organization.season.create.useMutation({
			onSuccess: () => {
				toast.success("Temporada creada");
				utils.organization.season.list.invalidate();
				utils.organization.season.listActive.invalidate();
				modal.hide();
			},
			onError: (error) => {
				toast.error(error.message || "Error al crear temporada");
			},
		});

		const updateMutation = trpc.organization.season.update.useMutation({
			onSuccess: () => {
				toast.success("Temporada actualizada");
				utils.organization.season.list.invalidate();
				utils.organization.season.listActive.invalidate();
				modal.hide();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar temporada");
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			const name = data.name || "";
			const startDate = data.startDate as Date;
			const endDate = data.endDate as Date;

			if (isEditing && season) {
				updateMutation.mutate({
					id: season.id,
					name,
					startDate,
					endDate,
					isActive: data.isActive,
					isCurrent: data.isCurrent,
				});
			} else {
				createMutation.mutate({
					name,
					startDate,
					endDate,
					isActive: data.isActive,
					isCurrent: data.isCurrent,
				});
			}
		});

		const isPending = createMutation.isPending || updateMutation.isPending;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.hide()}
			>
				<SheetContent className="sm:max-w-md">
					<SheetHeader>
						<SheetTitle>
							{isEditing ? "Editar temporada" : "Nueva temporada"}
						</SheetTitle>
						<SheetDescription>
							{isEditing
								? "Modifica los datos de la temporada"
								: "Crea una nueva temporada para organizar equipos y competencias"}
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form onSubmit={onSubmit} className="mt-6 space-y-6">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nombre</FormLabel>
										<FormControl>
											<Input placeholder="2024-2025" {...field} />
										</FormControl>
										<FormDescription>
											Por ejemplo: "2024-2025" o "Verano 2024"
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => {
									const dateValue =
										field.value instanceof Date ? field.value : undefined;
									return (
										<FormItem className="flex flex-col">
											<FormLabel>Fecha de inicio</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															className={cn(
																"w-full pl-3 text-left font-normal",
																!dateValue && "text-muted-foreground",
															)}
														>
															{dateValue ? (
																format(dateValue, "PPP", { locale: es })
															) : (
																<span>Seleccionar fecha</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={dateValue}
														onSelect={field.onChange}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									);
								}}
							/>

							<FormField
								control={form.control}
								name="endDate"
								render={({ field }) => {
									const dateValue =
										field.value instanceof Date ? field.value : undefined;
									return (
										<FormItem className="flex flex-col">
											<FormLabel>Fecha de fin</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															className={cn(
																"w-full pl-3 text-left font-normal",
																!dateValue && "text-muted-foreground",
															)}
														>
															{dateValue ? (
																format(dateValue, "PPP", { locale: es })
															) : (
																<span>Seleccionar fecha</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={dateValue}
														onSelect={field.onChange}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									);
								}}
							/>

							<FormField
								control={form.control}
								name="isActive"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">Activa</FormLabel>
											<FormDescription>
												La temporada está disponible para uso
											</FormDescription>
										</div>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="isCurrent"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">
												Temporada actual
											</FormLabel>
											<FormDescription>
												Marcar como la temporada en curso
											</FormDescription>
										</div>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
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
									{isPending
										? "Guardando..."
										: isEditing
											? "Guardar cambios"
											: "Crear temporada"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
