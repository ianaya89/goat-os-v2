"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { createTemplateFromEventSchema } from "@/schemas/organization-event-template-schemas";
import { trpc } from "@/trpc/client";

export type SaveAsTemplateModalProps = NiceModalHocProps & {
	eventId: string;
	eventTitle?: string;
};

export const SaveAsTemplateModal = NiceModal.create<SaveAsTemplateModalProps>(
	({ eventId, eventTitle }) => {
		const modal = useEnhancedModal();
		const router = useRouter();
		const utils = trpc.useUtils();

		// Get categories for suggestions
		const { data: categoriesData } =
			trpc.organization.eventTemplate.getCategories.useQuery();

		const createFromEventMutation =
			trpc.organization.eventTemplate.createFromEvent.useMutation({
				onSuccess: (template) => {
					toast.success("Template creado correctamente");
					utils.organization.eventTemplate.list.invalidate();
					modal.handleClose();
					if (template?.id) {
						router.push(
							`/dashboard/organization/events/templates/${template.id}`,
						);
					}
				},
				onError: (error: { message?: string }) => {
					toast.error(error.message || "Error al crear el template");
				},
			});

		const form = useZodForm({
			schema: createTemplateFromEventSchema,
			defaultValues: {
				eventId,
				name: eventTitle ? `Template - ${eventTitle}` : "",
				description: "",
				category: "",
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			createFromEventMutation.mutate(data);
		});

		const isPending = createFromEventMutation.isPending;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<SheetContent
					className="sm:max-w-lg"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
				>
					<SheetHeader>
						<SheetTitle>Guardar como Template</SheetTitle>
						<SheetDescription>
							Crea un template reutilizable a partir de este evento. Podrás usar
							este template para crear nuevos eventos rápidamente.
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form
							onSubmit={onSubmit}
							className="flex flex-1 flex-col overflow-hidden"
						>
							<ScrollArea className="flex-1">
								<div className="space-y-4 px-6 py-4">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Nombre del template</FormLabel>
													<FormControl>
														<Input
															placeholder="Ej: Campus de Verano Standard"
															autoComplete="off"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="description"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Descripción (opcional)</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Describe el propósito de este template..."
															rows={3}
															{...field}
															value={field.value ?? ""}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="category"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Categoría (opcional)</FormLabel>
													<FormControl>
														<Input
															placeholder="Ej: Campamentos, Torneos, etc."
															autoComplete="off"
															list="template-categories"
															{...field}
															value={field.value ?? ""}
														/>
													</FormControl>
													{categoriesData && categoriesData.length > 0 && (
														<datalist id="template-categories">
															{categoriesData.map((cat) => (
																<option key={cat} value={cat} />
															))}
														</datalist>
													)}
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									<div className="rounded-lg border bg-muted/50 p-4">
										<p className="text-sm text-muted-foreground">
											<strong className="text-foreground">
												¿Qué se incluirá en el template?
											</strong>
										</p>
										<ul className="mt-2 space-y-1 text-sm text-muted-foreground">
											<li>• Configuración general del evento</li>
											<li>• Categorías de edad y capacidades</li>
											<li>• Precios y descuentos</li>
											<li>• Checklist y tareas</li>
											<li>• Presupuesto y líneas de costos</li>
											<li>• Roles de staff requeridos</li>
											<li>• Milestones y cronograma</li>
											<li>• Zonas e inventario</li>
											<li>• Riesgos identificados</li>
											<li>• Tiers de patrocinadores</li>
										</ul>
									</div>
								</div>
							</ScrollArea>

							<SheetFooter className="flex-row justify-end gap-2 border-t">
								<Button
									type="button"
									variant="outline"
									onClick={modal.handleClose}
									disabled={isPending}
								>
									Cancelar
								</Button>
								<Button type="submit" disabled={isPending} loading={isPending}>
									Crear Template
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
