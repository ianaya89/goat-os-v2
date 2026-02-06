"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	BuildingIcon,
	CalendarIcon,
	CheckCircle2Icon,
	LockIcon,
	MailIcon,
	PhoneIcon,
	ShieldCheckIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { PasswordFormMessage } from "@/components/auth/password-form-message";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { InputPassword } from "@/components/ui/custom/input-password";
import { TurnstileCaptcha } from "@/components/ui/custom/turnstile";
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
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTurnstile } from "@/hooks/use-turnstile";
import { useZodForm } from "@/hooks/use-zod-form";
import { CAPTCHA_RESPONSE_HEADER } from "@/lib/auth/constants";
import { AthleteLevel } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { athleteSignUpSchema, isMinor } from "@/schemas/auth-schemas";

const stepVariants = {
	enter: (direction: number) => ({
		x: direction > 0 ? 20 : -20,
		opacity: 0,
	}),
	center: {
		x: 0,
		opacity: 1,
	},
	exit: (direction: number) => ({
		x: direction < 0 ? 20 : -20,
		opacity: 0,
	}),
};

const formItemVariants = {
	hidden: { opacity: 0, y: 10 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			delay: i * 0.08,
			duration: 0.25,
			ease: "easeOut" as const,
		},
	}),
};

const athleteLevelLabels: Record<string, string> = {
	[AthleteLevel.beginner]: "Principiante",
	[AthleteLevel.intermediate]: "Intermedio",
	[AthleteLevel.advanced]: "Avanzado",
	[AthleteLevel.elite]: "Elite",
};

const STEPS = [
	{ id: 1, name: "Cuenta" },
	{ id: 2, name: "Deportivo" },
	{ id: 3, name: "Perfil" },
	{ id: 4, name: "Legal" },
];

type AthleteSignUpCardProps = {
	signupToken?: string;
	organizationName?: string;
	organizationLogo?: string | null;
	athleteGroupName?: string | null;
};

export function AthleteSignUpCard({
	signupToken,
	organizationName,
	organizationLogo,
	athleteGroupName,
}: AthleteSignUpCardProps = {}) {
	const [currentStep, setCurrentStep] = useState(1);
	const [direction, setDirection] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitSuccess, setSubmitSuccess] = useState(false);

	const {
		turnstileRef,
		captchaToken,
		captchaEnabled,
		resetCaptcha,
		handleSuccess,
		handleError,
		handleExpire,
	} = useTurnstile();

	const methods = useZodForm({
		schema: athleteSignUpSchema,
		defaultValues: {
			name: "",
			email: "",
			password: "",
			phone: "",
			sport: "",
			level: AthleteLevel.beginner,
			category: "",
			position: "",
			// Parent/guardian fields
			parentName: "",
			parentPhone: "",
			parentEmail: "",
			parentRelationship: "",
			// Consent fields
			acceptTerms: false,
			confirmMedicalFitness: false,
			parentalConsent: false,
		},
	});

	// Watch birthDate to determine if athlete is minor
	const birthDate = methods.watch("birthDate");
	const isAthleteMinor = birthDate instanceof Date && isMinor(birthDate);

	const onSubmit = methods.handleSubmit(
		async (data) => {
			setIsSubmitting(true);
			try {
				const response = await fetch("/api/auth/athlete-signup", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(captchaEnabled && captchaToken
							? { [CAPTCHA_RESPONSE_HEADER]: captchaToken }
							: {}),
					},
					body: JSON.stringify({ ...data, signupToken }),
				});

				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.error || "Error al crear la cuenta");
				}

				setSubmitSuccess(true);
			} catch (e) {
				resetCaptcha();
				methods.setError("root", {
					message: e instanceof Error ? e.message : "Error al crear la cuenta",
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		(errors) => {
			// Log validation errors for debugging
			console.log("Validation errors:", errors);

			// Find the first step with errors and navigate to it
			const errorFields = Object.keys(errors);
			const step1Fields = ["name", "email", "password", "phone"];
			const step2Fields = ["sport", "category"];
			const step3Fields = ["birthDate", "level", "position"];

			if (errorFields.some((f) => step1Fields.includes(f))) {
				setDirection(-1);
				setCurrentStep(1);
			} else if (errorFields.some((f) => step2Fields.includes(f))) {
				setDirection(-1);
				setCurrentStep(2);
			} else if (errorFields.some((f) => step3Fields.includes(f))) {
				setDirection(-1);
				setCurrentStep(3);
			}
		},
	);

	const validateCurrentStep = async (): Promise<boolean> => {
		switch (currentStep) {
			case 1:
				return methods.trigger(["name", "email", "password", "phone"]);
			case 2:
				return methods.trigger(["sport", "category"]);
			case 3:
				return methods.trigger(["birthDate", "level", "position"]);
			case 4: {
				const fieldsToValidate: (
					| "acceptTerms"
					| "confirmMedicalFitness"
					| "parentName"
					| "parentPhone"
					| "parentalConsent"
				)[] = ["acceptTerms", "confirmMedicalFitness"];
				if (isAthleteMinor) {
					fieldsToValidate.push("parentName", "parentPhone", "parentalConsent");
				}
				return methods.trigger(fieldsToValidate);
			}
			default:
				return true;
		}
	};

	const handleNext = async () => {
		const isValid = await validateCurrentStep();
		if (isValid && currentStep < STEPS.length) {
			setDirection(1);
			setCurrentStep(currentStep + 1);
		}
	};

	const handlePrevious = () => {
		if (currentStep > 1) {
			setDirection(-1);
			setCurrentStep(currentStep - 1);
		}
	};

	const progressValue = (currentStep / STEPS.length) * 100;

	if (submitSuccess) {
		return (
			<Card className="w-full border-0 bg-white/70 px-6 py-8 shadow-2xl shadow-primary/10 backdrop-blur-md dark:bg-card/70 dark:shadow-primary/5">
				<motion.div
					className="flex flex-col items-center gap-6"
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					<motion.div
						className="flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
					>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
						>
							<CheckCircle2Icon className="size-10 text-green-600 dark:text-green-400" />
						</motion.div>
					</motion.div>
					<motion.div
						className="space-y-2 text-center"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5, duration: 0.3 }}
					>
						<h2 className="font-semibold text-xl">¡Registro exitoso!</h2>
						<p className="text-muted-foreground">
							Te hemos enviado un enlace para verificar tu email. Por favor
							revisa tu bandeja de entrada.
						</p>
					</motion.div>
					<motion.div
						className="w-full"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.7, duration: 0.3 }}
					>
						<Button
							asChild
							variant="outline"
							className="w-full transition-transform duration-200 hover:scale-[1.02]"
						>
							<Link href="/auth/sign-in">Ir a iniciar sesión</Link>
						</Button>
					</motion.div>
				</motion.div>
			</Card>
		);
	}

	return (
		<Card className="w-full border-0 bg-white/70 px-6 py-8 shadow-2xl shadow-primary/10 backdrop-blur-md transition-all duration-300 hover:shadow-primary/15 dark:bg-card/70 dark:shadow-primary/5">
			<div className="space-y-6">
				{/* Organization Banner */}
				{organizationName && (
					<motion.div
						className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3"
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
					>
						{organizationLogo ? (
							<img
								src={organizationLogo}
								alt=""
								className="size-10 rounded-full object-cover"
							/>
						) : (
							<div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
								<BuildingIcon className="size-5 text-primary" />
							</div>
						)}
						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium text-primary">
								Te registrarás en
							</p>
							<p className="truncate text-sm font-semibold">
								{organizationName}
							</p>
							{athleteGroupName && (
								<p className="text-xs text-muted-foreground">
									Grupo: {athleteGroupName}
								</p>
							)}
						</div>
					</motion.div>
				)}

				{/* Header */}
				<motion.div
					className="space-y-2"
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					<h1 className="font-semibold text-2xl tracking-tight">
						Crear cuenta de atleta
					</h1>
					<p className="text-muted-foreground text-sm">
						Completa el formulario para registrarte en la plataforma.
					</p>
				</motion.div>

				{/* Progress */}
				<motion.div
					className="space-y-3"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2, duration: 0.3 }}
				>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							Paso {currentStep} de {STEPS.length}
						</span>
						<motion.span
							key={currentStep}
							className="font-medium text-primary"
							initial={{ opacity: 0, x: 10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.2 }}
						>
							{STEPS[currentStep - 1]?.name}
						</motion.span>
					</div>
					<div className="relative">
						<Progress value={progressValue} className="h-2" />
						<motion.div
							className="absolute -top-1 h-4 w-4 rounded-full border-2 border-primary bg-white shadow-md dark:bg-card"
							style={{ left: `calc(${progressValue}% - 8px)` }}
							initial={false}
							animate={{ left: `calc(${progressValue}% - 8px)` }}
							transition={{ type: "spring", stiffness: 300, damping: 30 }}
						/>
					</div>
				</motion.div>

				{/* Form */}
				<Form {...methods}>
					<form onSubmit={onSubmit} className="space-y-4">
						<div className="relative min-h-[320px] overflow-hidden">
							<AnimatePresence mode="wait" custom={direction}>
								{/* Step 1: Account Information */}
								{currentStep === 1 && (
									<motion.div
										key="step1"
										custom={direction}
										variants={stepVariants}
										initial="enter"
										animate="center"
										exit="exit"
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="space-y-4"
									>
										<motion.div
											custom={0}
											variants={formItemVariants}
											initial="hidden"
											animate="visible"
										>
											<FormField
												control={methods.control}
												name="name"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Nombre completo</FormLabel>
															<FormControl>
																<InputGroup className="transition-all duration-200 focus-within:shadow-md">
																	<InputGroupAddon align="inline-start">
																		<InputGroupText>
																			<UserIcon className="size-4 shrink-0" />
																		</InputGroupText>
																	</InputGroupAddon>
																	<InputGroupInput
																		autoComplete="name"
																		disabled={isSubmitting}
																		maxLength={64}
																		type="text"
																		placeholder="Juan Pérez"
																		{...field}
																	/>
																</InputGroup>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</motion.div>
										<motion.div
											custom={1}
											variants={formItemVariants}
											initial="hidden"
											animate="visible"
										>
											<FormField
												control={methods.control}
												name="email"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Email</FormLabel>
															<FormControl>
																<InputGroup className="transition-all duration-200 focus-within:shadow-md">
																	<InputGroupAddon align="inline-start">
																		<InputGroupText>
																			<MailIcon className="size-4 shrink-0" />
																		</InputGroupText>
																	</InputGroupAddon>
																	<InputGroupInput
																		autoComplete="email"
																		disabled={isSubmitting}
																		maxLength={255}
																		type="email"
																		placeholder="juan@email.com"
																		{...field}
																	/>
																</InputGroup>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</motion.div>
										<motion.div
											custom={2}
											variants={formItemVariants}
											initial="hidden"
											animate="visible"
										>
											<FormField
												control={methods.control}
												name="phone"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Teléfono</FormLabel>
															<FormControl>
																<InputGroup className="transition-all duration-200 focus-within:shadow-md">
																	<InputGroupAddon align="inline-start">
																		<InputGroupText>
																			<PhoneIcon className="size-4 shrink-0" />
																		</InputGroupText>
																	</InputGroupAddon>
																	<InputGroupInput
																		autoComplete="tel"
																		disabled={isSubmitting}
																		maxLength={20}
																		type="tel"
																		placeholder="+54 11 1234-5678"
																		{...field}
																	/>
																</InputGroup>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</motion.div>
										<motion.div
											custom={3}
											variants={formItemVariants}
											initial="hidden"
											animate="visible"
										>
											<FormField
												control={methods.control}
												name="password"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Contraseña</FormLabel>
															<FormControl>
																<InputPassword
																	autoCapitalize="off"
																	autoComplete="new-password"
																	disabled={isSubmitting}
																	maxLength={72}
																	startAdornment={
																		<LockIcon className="size-4 shrink-0" />
																	}
																	className="transition-all duration-200 focus-within:shadow-md"
																	{...field}
																/>
															</FormControl>
															<PasswordFormMessage
																password={methods.watch("password")}
															/>
														</Field>
													</FormItem>
												)}
											/>
										</motion.div>
									</motion.div>
								)}

								{/* Step 2: Sports Information */}
								{currentStep === 2 && (
									<motion.div
										key="step2"
										custom={direction}
										variants={stepVariants}
										initial="enter"
										animate="center"
										exit="exit"
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="space-y-4"
									>
										<motion.div
											custom={0}
											variants={formItemVariants}
											initial="hidden"
											animate="visible"
										>
											<FormField
												control={methods.control}
												name="sport"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Deporte</FormLabel>
															<FormControl>
																<Input
																	disabled={isSubmitting}
																	maxLength={100}
																	type="text"
																	placeholder="Fútbol, Basketball, etc."
																	className="transition-all duration-200 focus:shadow-md"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</motion.div>
										<motion.div
											custom={1}
											variants={formItemVariants}
											initial="hidden"
											animate="visible"
										>
											<FormField
												control={methods.control}
												name="category"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Categoría</FormLabel>
															<FormControl>
																<Input
																	disabled={isSubmitting}
																	maxLength={50}
																	type="text"
																	placeholder="Sub-17, Primera, etc."
																	className="transition-all duration-200 focus:shadow-md"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</motion.div>
									</motion.div>
								)}

								{/* Step 3: Profile */}
								{currentStep === 3 && (
									<motion.div
										key="step3"
										custom={direction}
										variants={stepVariants}
										initial="enter"
										animate="center"
										exit="exit"
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="space-y-4"
									>
										<motion.div
											custom={0}
											variants={formItemVariants}
											initial="hidden"
											animate="visible"
										>
											<FormField
												control={methods.control}
												name="birthDate"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Fecha de nacimiento</FormLabel>
															<Popover>
																<PopoverTrigger asChild>
																	<FormControl>
																		<Button
																			variant="outline"
																			disabled={isSubmitting}
																			className={cn(
																				"w-full justify-start text-left font-normal transition-all duration-200 hover:shadow-md",
																				!field.value && "text-muted-foreground",
																			)}
																		>
																			<CalendarIcon className="mr-2 size-4 shrink-0" />
																			{field.value instanceof Date ? (
																				format(field.value, "PPP", {
																					locale: es,
																				})
																			) : (
																				<span>Selecciona una fecha</span>
																			)}
																		</Button>
																	</FormControl>
																</PopoverTrigger>
																<PopoverContent
																	className="w-auto p-0"
																	align="start"
																>
																	<Calendar
																		mode="single"
																		selected={
																			field.value instanceof Date
																				? field.value
																				: undefined
																		}
																		onSelect={field.onChange}
																		disabled={(date) =>
																			date > new Date() ||
																			date < new Date("1940-01-01")
																		}
																		defaultMonth={
																			field.value instanceof Date
																				? field.value
																				: new Date(2000, 0, 1)
																		}
																		captionLayout="dropdown"
																		fromYear={1940}
																		toYear={new Date().getFullYear()}
																	/>
																</PopoverContent>
															</Popover>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</motion.div>
										<motion.div
											custom={1}
											variants={formItemVariants}
											initial="hidden"
											animate="visible"
										>
											<FormField
												control={methods.control}
												name="level"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Nivel</FormLabel>
															<Select
																onValueChange={field.onChange}
																defaultValue={field.value}
																disabled={isSubmitting}
															>
																<FormControl>
																	<SelectTrigger className="w-full transition-all duration-200 focus:shadow-md">
																		<SelectValue placeholder="Selecciona tu nivel" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{Object.entries(athleteLevelLabels).map(
																		([value, label]) => (
																			<SelectItem key={value} value={value}>
																				{label}
																			</SelectItem>
																		),
																	)}
																</SelectContent>
															</Select>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</motion.div>
										<motion.div
											custom={2}
											variants={formItemVariants}
											initial="hidden"
											animate="visible"
										>
											<FormField
												control={methods.control}
												name="position"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Posición</FormLabel>
															<FormControl>
																<Input
																	disabled={isSubmitting}
																	maxLength={100}
																	type="text"
																	placeholder="Delantero, Base, etc."
																	className="transition-all duration-200 focus:shadow-md"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</motion.div>
										<motion.div
											custom={3}
											variants={formItemVariants}
											initial="hidden"
											animate="visible"
										>
											<FormField
												control={methods.control}
												name="jerseyNumber"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>N° de camiseta (opcional)</FormLabel>
															<FormControl>
																<Input
																	type="number"
																	disabled={isSubmitting}
																	min={0}
																	max={999}
																	placeholder="10"
																	className="transition-all duration-200 focus:shadow-md"
																	{...field}
																	value={field.value ?? ""}
																	onChange={(e) =>
																		field.onChange(
																			e.target.value === ""
																				? undefined
																				: Number(e.target.value),
																		)
																	}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</motion.div>
									</motion.div>
								)}

								{/* Step 4: Legal (Consents & Parent Info) */}
								{currentStep === 4 && (
									<motion.div
										key="step4"
										custom={direction}
										variants={stepVariants}
										initial="enter"
										animate="center"
										exit="exit"
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="space-y-4"
									>
										{/* Parent info section - only for minors */}
										{isAthleteMinor && (
											<>
												<motion.div
													custom={0}
													variants={formItemVariants}
													initial="hidden"
													animate="visible"
												>
													<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
														<UsersIcon className="size-4" />
														<span>
															Datos del padre/madre/tutor (requerido para
															menores)
														</span>
													</div>
												</motion.div>
												<motion.div
													custom={1}
													variants={formItemVariants}
													initial="hidden"
													animate="visible"
												>
													<FormField
														control={methods.control}
														name="parentName"
														render={({ field }) => (
															<FormItem asChild>
																<Field>
																	<FormLabel>
																		Nombre completo del padre/tutor
																	</FormLabel>
																	<FormControl>
																		<InputGroup className="transition-all duration-200 focus-within:shadow-md">
																			<InputGroupAddon align="inline-start">
																				<InputGroupText>
																					<UserIcon className="size-4 shrink-0" />
																				</InputGroupText>
																			</InputGroupAddon>
																			<InputGroupInput
																				disabled={isSubmitting}
																				maxLength={100}
																				type="text"
																				placeholder="Nombre del padre/madre/tutor"
																				{...field}
																			/>
																		</InputGroup>
																	</FormControl>
																	<FormMessage />
																</Field>
															</FormItem>
														)}
													/>
												</motion.div>
												<motion.div
													custom={2}
													variants={formItemVariants}
													initial="hidden"
													animate="visible"
												>
													<FormField
														control={methods.control}
														name="parentPhone"
														render={({ field }) => (
															<FormItem asChild>
																<Field>
																	<FormLabel>
																		Teléfono del padre/tutor
																	</FormLabel>
																	<FormControl>
																		<InputGroup className="transition-all duration-200 focus-within:shadow-md">
																			<InputGroupAddon align="inline-start">
																				<InputGroupText>
																					<PhoneIcon className="size-4 shrink-0" />
																				</InputGroupText>
																			</InputGroupAddon>
																			<InputGroupInput
																				disabled={isSubmitting}
																				maxLength={20}
																				type="tel"
																				placeholder="+54 11 1234-5678"
																				{...field}
																			/>
																		</InputGroup>
																	</FormControl>
																	<FormMessage />
																</Field>
															</FormItem>
														)}
													/>
												</motion.div>
											</>
										)}

										{/* Consents section */}
										<motion.div
											custom={isAthleteMinor ? 3 : 0}
											variants={formItemVariants}
											initial="hidden"
											animate="visible"
										>
											<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
												<ShieldCheckIcon className="size-4" />
												<span>Consentimientos requeridos</span>
											</div>
										</motion.div>

										<motion.div
											custom={isAthleteMinor ? 4 : 1}
											variants={formItemVariants}
											initial="hidden"
											animate="visible"
										>
											<FormField
												control={methods.control}
												name="acceptTerms"
												render={({ field }) => (
													<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
																disabled={isSubmitting}
															/>
														</FormControl>
														<div className="space-y-1 leading-none">
															<FormLabel className="cursor-pointer">
																Acepto los{" "}
																<Link
																	href="/terms"
																	className="text-primary underline"
																	target="_blank"
																>
																	términos y condiciones
																</Link>
															</FormLabel>
															<FormMessage />
														</div>
													</FormItem>
												)}
											/>
										</motion.div>

										<motion.div
											custom={isAthleteMinor ? 5 : 2}
											variants={formItemVariants}
											initial="hidden"
											animate="visible"
										>
											<FormField
												control={methods.control}
												name="confirmMedicalFitness"
												render={({ field }) => (
													<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
																disabled={isSubmitting}
															/>
														</FormControl>
														<div className="space-y-1 leading-none">
															<FormLabel className="cursor-pointer">
																Confirmo que cuento con aptitud física para
																actividad deportiva, avalada por un médico
															</FormLabel>
															<FormMessage />
														</div>
													</FormItem>
												)}
											/>
										</motion.div>

										{isAthleteMinor && (
											<motion.div
												custom={6}
												variants={formItemVariants}
												initial="hidden"
												animate="visible"
											>
												<FormField
													control={methods.control}
													name="parentalConsent"
													render={({ field }) => (
														<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 border-primary/50 bg-primary/5">
															<FormControl>
																<Checkbox
																	checked={field.value}
																	onCheckedChange={field.onChange}
																	disabled={isSubmitting}
																/>
															</FormControl>
															<div className="space-y-1 leading-none">
																<FormLabel className="cursor-pointer">
																	Como padre/madre/tutor, autorizo la
																	participación del menor en actividades
																	deportivas
																</FormLabel>
																<FormMessage />
															</div>
														</FormItem>
													)}
												/>
											</motion.div>
										)}

										{captchaEnabled && (
											<motion.div
												custom={isAthleteMinor ? 7 : 3}
												variants={formItemVariants}
												initial="hidden"
												animate="visible"
											>
												<TurnstileCaptcha
													ref={turnstileRef}
													onSuccess={handleSuccess}
													onError={handleError}
													onExpire={handleExpire}
												/>
											</motion.div>
										)}

										{(methods.formState.errors.root ||
											methods.formState.errors.acceptTerms ||
											methods.formState.errors.confirmMedicalFitness ||
											(isAthleteMinor &&
												(methods.formState.errors.parentName ||
													methods.formState.errors.parentPhone ||
													methods.formState.errors.parentalConsent))) && (
											<motion.div
												initial={{ opacity: 0, scale: 0.95 }}
												animate={{ opacity: 1, scale: 1 }}
												transition={{ duration: 0.2 }}
											>
												<Alert variant="destructive">
													<AlertDescription>
														{methods.formState.errors.root?.message ||
															methods.formState.errors.acceptTerms?.message ||
															methods.formState.errors.confirmMedicalFitness
																?.message ||
															methods.formState.errors.parentName?.message ||
															methods.formState.errors.parentPhone?.message ||
															methods.formState.errors.parentalConsent
																?.message ||
															"Por favor completa todos los campos requeridos"}
													</AlertDescription>
												</Alert>
											</motion.div>
										)}
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{/* Navigation buttons */}
						<motion.div
							className="flex gap-3 pt-2"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.3, duration: 0.3 }}
						>
							{currentStep > 1 && (
								<Button
									type="button"
									variant="outline"
									onClick={handlePrevious}
									disabled={isSubmitting}
									className="flex-1 transition-transform duration-200 active:scale-[0.98]"
								>
									<ArrowLeftIcon className="mr-2 size-4" />
									Anterior
								</Button>
							)}
							{currentStep < STEPS.length ? (
								<Button
									type="button"
									onClick={handleNext}
									disabled={isSubmitting}
									className="flex-1 transition-transform duration-200 active:scale-[0.98]"
								>
									Siguiente
									<ArrowRightIcon className="ml-2 size-4" />
								</Button>
							) : (
								<Button
									type="submit"
									disabled={isSubmitting || (captchaEnabled && !captchaToken)}
									loading={isSubmitting}
									className="flex-1 transition-transform duration-200 active:scale-[0.98]"
								>
									Crear cuenta
								</Button>
							)}
						</motion.div>
					</form>
				</Form>

				{/* Footer */}
				<motion.p
					className="text-center text-muted-foreground text-sm"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5, duration: 0.3 }}
				>
					¿Ya tienes una cuenta?{" "}
					<Link
						className="text-foreground underline transition-colors hover:text-primary"
						href="/auth/sign-in"
					>
						Iniciar sesión
					</Link>
				</motion.p>
			</div>
		</Card>
	);
}
