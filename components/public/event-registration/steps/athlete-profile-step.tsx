"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
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
import { useZodForm } from "@/hooks/use-zod-form";
import { AthleteLevel } from "@/lib/db/schema/enums";
import {
	type AthleteProfileStepInput,
	athleteProfileStepSchema,
} from "@/schemas/public-event-registration-wizard-schemas";

const LEVEL_LABELS: Record<string, string> = {
	[AthleteLevel.beginner]: "Principiante",
	[AthleteLevel.intermediate]: "Intermedio",
	[AthleteLevel.advanced]: "Avanzado",
	[AthleteLevel.elite]: "Elite",
};

interface AthleteProfileStepProps {
	defaultValues: {
		sport: string;
		level?: AthleteProfileStepInput["level"];
		position: string;
		secondaryPosition?: string;
		currentClub?: string;
		jerseyNumber?: number;
		yearsOfExperience?: number;
	};
	onSubmit: (data: AthleteProfileStepInput) => void;
	onBack: () => void;
}

export function AthleteProfileStep({
	defaultValues,
	onSubmit,
	onBack,
}: AthleteProfileStepProps) {
	const form = useZodForm({
		schema: athleteProfileStepSchema,
		defaultValues: {
			...defaultValues,
			level: defaultValues.level ?? AthleteLevel.beginner,
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="space-y-4">
					<div className="text-center">
						<h2 className="text-lg font-semibold">Perfil deportivo</h2>
						<p className="text-sm text-muted-foreground">
							Cuéntanos sobre tu experiencia deportiva
						</p>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="sport"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FieldLabel>Deporte</FieldLabel>
										<FormControl>
											<Input placeholder="Fútbol" {...field} />
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="level"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FieldLabel>Nivel</FieldLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar nivel" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.entries(LEVEL_LABELS).map(([value, label]) => (
													<SelectItem key={value} value={value}>
														{label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="position"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FieldLabel>Posición principal</FieldLabel>
										<FormControl>
											<Input placeholder="Delantero" {...field} />
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="secondaryPosition"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FieldLabel>
											Posición secundaria{" "}
											<span className="text-muted-foreground">(opcional)</span>
										</FieldLabel>
										<FormControl>
											<Input placeholder="Mediocampista" {...field} />
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="currentClub"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FieldLabel>
										Club actual{" "}
										<span className="text-muted-foreground">(opcional)</span>
									</FieldLabel>
									<FormControl>
										<Input placeholder="Club Atlético" {...field} />
									</FormControl>
									<FormMessage />
								</Field>
							</FormItem>
						)}
					/>

					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="jerseyNumber"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FieldLabel>
											Número de camiseta{" "}
											<span className="text-muted-foreground">(opcional)</span>
										</FieldLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="10"
												min={0}
												max={999}
												{...field}
												onChange={(e) => {
													const value = e.target.value;
													field.onChange(
														value === ""
															? undefined
															: Number.parseInt(value, 10),
													);
												}}
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
							name="yearsOfExperience"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FieldLabel>
											Años de experiencia{" "}
											<span className="text-muted-foreground">(opcional)</span>
										</FieldLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="5"
												min={0}
												max={50}
												{...field}
												onChange={(e) => {
													const value = e.target.value;
													field.onChange(
														value === ""
															? undefined
															: Number.parseInt(value, 10),
													);
												}}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>
					</div>
				</div>

				<div className="flex justify-between gap-3">
					<Button type="button" variant="outline" onClick={onBack}>
						<ChevronLeftIcon className="mr-2 h-4 w-4" />
						Anterior
					</Button>
					<Button type="submit">
						Continuar
						<ChevronRightIcon className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</form>
		</Form>
	);
}
