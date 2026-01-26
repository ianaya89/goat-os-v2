"use client";

import {
	AlertCircleIcon,
	CheckCircle2Icon,
	Loader2Icon,
	UserIcon,
} from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	type ExistingAthleteData,
	type ExistingUserData,
	emailStepSchema,
} from "@/schemas/public-event-registration-wizard-schemas";
import { trpc } from "@/trpc/client";

interface EmailStepProps {
	organizationSlug: string;
	eventSlug: string;
	defaultValue?: string;
	isReturningAthlete: boolean;
	existingUser: ExistingUserData | null;
	onEmailVerified: (email: string) => void;
	onLookupResult: (result: {
		isAlreadyRegistered: boolean;
		user: ExistingUserData | null;
		athlete: ExistingAthleteData | null;
	}) => void;
	onUseExistingData: (use: boolean) => void;
	onNext: () => void;
}

export function EmailStep({
	organizationSlug,
	eventSlug,
	defaultValue,
	isReturningAthlete,
	existingUser,
	onEmailVerified,
	onLookupResult,
	onUseExistingData,
	onNext,
}: EmailStepProps) {
	const [isAlreadyRegistered, setIsAlreadyRegistered] = React.useState(false);
	const [hasLookedUp, setHasLookedUp] = React.useState(false);

	const form = useZodForm({
		schema: emailStepSchema,
		defaultValues: {
			email: defaultValue ?? "",
		},
	});

	const lookupMutation = trpc.public.event.lookupAthleteByEmail.useQuery(
		{
			organizationSlug,
			eventSlug,
			email: form.watch("email"),
		},
		{
			enabled: false,
		},
	);

	const handleLookup = async () => {
		const isValid = await form.trigger("email");
		if (!isValid) return;

		const email = form.getValues("email");
		onEmailVerified(email);

		const result = await lookupMutation.refetch();

		if (result.data) {
			setHasLookedUp(true);
			if (result.data.isAlreadyRegistered) {
				setIsAlreadyRegistered(true);
			} else {
				onLookupResult(result.data);
			}
		}
	};

	const handleContinue = () => {
		if (isReturningAthlete) {
			// Already decided, move on
			onNext();
		} else {
			onNext();
		}
	};

	const handleUseExisting = () => {
		onUseExistingData(true);
		onNext();
	};

	const handleEnterNew = () => {
		onUseExistingData(false);
		onNext();
	};

	// If already registered for this event
	if (isAlreadyRegistered) {
		return (
			<div className="space-y-6">
				<Alert variant="destructive">
					<AlertCircleIcon className="h-4 w-4" />
					<AlertTitle>Email ya registrado</AlertTitle>
					<AlertDescription>
						Este email ya está registrado para este evento. Si necesitas
						modificar tu inscripción, contacta al organizador.
					</AlertDescription>
				</Alert>

				<Button
					variant="outline"
					onClick={() => {
						setIsAlreadyRegistered(false);
						setHasLookedUp(false);
						form.reset();
					}}
					className="w-full"
				>
					Intentar con otro email
				</Button>
			</div>
		);
	}

	// If returning athlete detected
	if (hasLookedUp && isReturningAthlete && existingUser) {
		return (
			<div className="space-y-6">
				<Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
					<CheckCircle2Icon className="h-4 w-4" />
					<AlertTitle>Bienvenido de nuevo, {existingUser.name}</AlertTitle>
					<AlertDescription>
						Encontramos tu perfil de atleta. Puedes usar tus datos existentes
						para agilizar la inscripción.
					</AlertDescription>
				</Alert>

				<div className="flex flex-col gap-3 sm:flex-row">
					<Button onClick={handleUseExisting} className="flex-1">
						<UserIcon className="mr-2 h-4 w-4" />
						Usar mis datos
					</Button>
					<Button variant="outline" onClick={handleEnterNew} className="flex-1">
						Ingresar datos nuevos
					</Button>
				</div>
			</div>
		);
	}

	// If looked up but no existing data found
	if (hasLookedUp && !isReturningAthlete) {
		return (
			<div className="space-y-6">
				<Alert>
					<CheckCircle2Icon className="h-4 w-4" />
					<AlertTitle>Email verificado</AlertTitle>
					<AlertDescription>
						No encontramos un perfil existente. A continuación completarás tus
						datos.
					</AlertDescription>
				</Alert>

				<Button onClick={handleContinue} className="w-full">
					Continuar
				</Button>
			</div>
		);
	}

	// Initial email form
	return (
		<Form {...form}>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					handleLookup();
				}}
				className="space-y-6"
			>
				<div className="space-y-4">
					<div className="text-center">
						<h2 className="text-lg font-semibold">Comenzar inscripción</h2>
						<p className="text-sm text-muted-foreground">
							Ingresa tu email para verificar si ya tienes un perfil
						</p>
					</div>

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FormControl>
										<Input
											type="email"
											placeholder="tu@email.com"
											autoComplete="email"
											autoFocus
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</Field>
							</FormItem>
						)}
					/>
				</div>

				<Button
					type="submit"
					className="w-full"
					disabled={lookupMutation.isFetching}
				>
					{lookupMutation.isFetching ? (
						<>
							<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
							Verificando...
						</>
					) : (
						"Continuar"
					)}
				</Button>
			</form>
		</Form>
	);
}
