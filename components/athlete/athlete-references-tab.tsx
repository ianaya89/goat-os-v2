"use client";

import NiceModal from "@ebay/nice-modal-react";
import {
	BadgeCheckIcon,
	MailIcon,
	PhoneIcon,
	PlusIcon,
	QuoteIcon,
	UserCheckIcon,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditEmpty,
	ProfileEditGrid,
	ProfileEditItem,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/trpc/client";

// Form schema
const referenceFormSchema = z.object({
	name: z.string().min(2, "El nombre es requerido").max(100),
	relationship: z.string().min(2, "La relacion es requerida").max(50),
	organization: z.string().max(100).optional(),
	position: z.string().max(100).optional(),
	email: z.string().email("Email invalido").optional().or(z.literal("")),
	phone: z.string().max(20).optional(),
	testimonial: z.string().max(500).optional(),
	skillsHighlighted: z.string().optional(),
	isPublic: z.boolean().default(true),
});

interface Reference {
	id: string;
	name: string;
	relationship: string;
	organization: string | null;
	position: string | null;
	email: string | null;
	phone: string | null;
	testimonial: string | null;
	skillsHighlighted: string[] | null;
	isPublic: boolean;
	isVerified: boolean;
	displayOrder: number;
}

interface ReferenceModalProps {
	reference?: Reference;
}

// Modal for add/edit reference
const ReferenceModal = NiceModal.create(
	({ reference }: ReferenceModalProps) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!reference;

		const form = useZodForm({
			schema: referenceFormSchema,
			defaultValues: {
				name: reference?.name ?? "",
				relationship: reference?.relationship ?? "",
				organization: reference?.organization ?? "",
				position: reference?.position ?? "",
				email: reference?.email ?? "",
				phone: reference?.phone ?? "",
				testimonial: reference?.testimonial ?? "",
				skillsHighlighted: reference?.skillsHighlighted?.join(", ") ?? "",
				isPublic: reference?.isPublic ?? true,
			},
		});

		const addMutation = trpc.athlete.addReference.useMutation({
			onSuccess: () => {
				utils.athlete.listMyReferences.invalidate();
				utils.athlete.getMyProfile.invalidate();
				toast.success("Referencia agregada");
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const updateMutation = trpc.athlete.updateReference.useMutation({
			onSuccess: () => {
				utils.athlete.listMyReferences.invalidate();
				utils.athlete.getMyProfile.invalidate();
				toast.success("Referencia actualizada");
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const onSubmit = form.handleSubmit((values) => {
			const skills = values.skillsHighlighted
				? values.skillsHighlighted
						.split(",")
						.map((s) => s.trim())
						.filter(Boolean)
				: [];

			const data = {
				name: values.name,
				relationship: values.relationship,
				organization: values.organization || null,
				position: values.position || null,
				email: values.email || null,
				phone: values.phone || null,
				testimonial: values.testimonial || null,
				skillsHighlighted: skills,
				isPublic: values.isPublic ?? true,
			};

			if (isEditing && reference) {
				updateMutation.mutate({ id: reference.id, ...data });
			} else {
				addMutation.mutate(data);
			}
		});

		const isPending = addMutation.isPending || updateMutation.isPending;

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={isEditing ? "Editar Referencia" : "Agregar Referencia"}
				subtitle="Las referencias ayudan a validar tu perfil ante scouts y reclutadores"
				icon={<UserCheckIcon className="size-5" />}
				accentColor="emerald"
				form={form}
				onSubmit={onSubmit}
				isPending={isPending}
				submitLabel={isEditing ? "Guardar" : "Agregar"}
				maxWidth="lg"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection title="Informacion basica">
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Nombre *</FormLabel>
											<FormControl>
												<Input placeholder="Juan Perez" {...field} />
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="relationship"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Relacion *</FormLabel>
											<FormControl>
												<Input
													placeholder="Entrenador, Manager..."
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>

						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="organization"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Organizacion</FormLabel>
											<FormControl>
												<Input placeholder="Club, Universidad..." {...field} />
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="position"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Cargo</FormLabel>
											<FormControl>
												<Input placeholder="Director Tecnico..." {...field} />
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>
					</ProfileEditSection>

					<ProfileEditSection title="Contacto">
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="email@ejemplo.com"
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
								name="phone"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Telefono</FormLabel>
											<FormControl>
												<Input placeholder="+54 11 1234-5678" {...field} />
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>
					</ProfileEditSection>

					<ProfileEditSection title="Testimonio y habilidades">
						<FormField
							control={form.control}
							name="testimonial"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Testimonio</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Una cita o recomendacion de esta persona..."
												className="resize-none"
												rows={3}
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Una frase o recomendacion que esta persona haya dado sobre
											ti.
										</FormDescription>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="skillsHighlighted"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Habilidades destacadas</FormLabel>
										<FormControl>
											<Input
												placeholder="Liderazgo, Velocidad, Trabajo en equipo..."
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Habilidades que esta persona puede validar, separadas por
											coma.
										</FormDescription>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>
					</ProfileEditSection>

					<ProfileEditSection>
						<FormField
							control={form.control}
							name="isPublic"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
									<div className="space-y-0.5">
										<FormLabel className="text-emerald-800 dark:text-emerald-300">
											Mostrar en perfil publico
										</FormLabel>
										<FormDescription>
											Si esta desactivado, solo tu veras esta referencia.
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
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	},
);

export function AthleteReferencesTab() {
	const t = useTranslations("myProfile.referencesTab");
	const { data: references, isLoading } =
		trpc.athlete.listMyReferences.useQuery();
	const utils = trpc.useUtils();

	const deleteMutation = trpc.athlete.deleteReference.useMutation({
		onSuccess: () => {
			utils.athlete.listMyReferences.invalidate();
			utils.athlete.getMyProfile.invalidate();
			toast.success(t("deleteSuccess"));
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleAdd = () => {
		NiceModal.show(ReferenceModal);
	};

	const handleEdit = (reference: Reference) => {
		NiceModal.show(ReferenceModal, { reference });
	};

	const handleDelete = (id: string) => {
		if (confirm(t("deleteConfirm"))) {
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
			<CardHeader className="flex flex-row items-center justify-between space-y-0">
				<CardTitle className="flex items-center gap-2">
					<UserCheckIcon className="size-5" />
					{t("title")}
				</CardTitle>
				<Button variant="outline" size="sm" onClick={handleAdd}>
					<PlusIcon className="mr-2 size-4" />
					{t("add")}
				</Button>
			</CardHeader>
			<CardContent>
				{!references || references.length === 0 ? (
					<div className="py-10 text-center">
						<UserCheckIcon className="mx-auto size-12 text-muted-foreground/50" />
						<h3 className="mt-4 font-semibold">{t("emptyTitle")}</h3>
						<p className="mt-2 max-w-sm mx-auto text-muted-foreground text-sm">
							{t("emptyDescription")}
						</p>
						<Button
							variant="outline"
							className="mt-4"
							size="sm"
							onClick={handleAdd}
						>
							<PlusIcon className="mr-2 size-4" />
							{t("add")}
						</Button>
					</div>
				) : (
					<div className="space-y-3">
						{references.map((ref) => (
							<div
								key={ref.id}
								className="group flex items-start gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
							>
								<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
									<QuoteIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
								</div>

								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="font-medium">{ref.name}</span>
										{ref.isVerified && (
											<BadgeCheckIcon className="size-4 text-blue-500" />
										)}
										{!ref.isPublic && (
											<Badge variant="secondary" className="text-xs">
												{t("private")}
											</Badge>
										)}
									</div>
									<p className="text-muted-foreground text-sm">
										{ref.relationship}
										{ref.organization && ` • ${ref.organization}`}
										{ref.position && ` (${ref.position})`}
									</p>

									{ref.testimonial && (
										<p className="mt-2 text-sm italic text-muted-foreground">
											"{ref.testimonial}"
										</p>
									)}

									{ref.skillsHighlighted &&
										ref.skillsHighlighted.length > 0 && (
											<div className="mt-2 flex flex-wrap gap-1">
												{ref.skillsHighlighted.map((skill, i) => (
													<Badge
														key={i}
														variant="secondary"
														className="bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-900/50 dark:text-emerald-300"
													>
														{skill}
													</Badge>
												))}
											</div>
										)}

									{(ref.email || ref.phone) && (
										<div className="mt-2 flex items-center gap-4 text-muted-foreground text-xs">
											{ref.email && (
												<span className="flex items-center gap-1">
													<MailIcon className="size-3" />
													{ref.email}
												</span>
											)}
											{ref.phone && (
												<span className="flex items-center gap-1">
													<PhoneIcon className="size-3" />
													{ref.phone}
												</span>
											)}
										</div>
									)}
								</div>

								<div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleEdit(ref as Reference)}
									>
										{t("edit")}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="text-destructive hover:text-destructive"
										onClick={() => handleDelete(ref.id)}
										disabled={deleteMutation.isPending}
									>
										{t("delete")}
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
