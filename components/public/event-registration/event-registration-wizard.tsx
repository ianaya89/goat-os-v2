"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Stepper } from "@/components/ui/custom/stepper";
import {
	type AgeCategory,
	type ExistingAthleteData,
	type ExistingUserData,
	type FullRegistrationWizardInput,
	isMinorFromDate,
	type PriceInfo,
	WIZARD_STEPS,
} from "@/schemas/public-event-registration-wizard-schemas";
import { trpc } from "@/trpc/client";
import { AthleteProfileStep } from "./steps/athlete-profile-step";
import { EmailStep } from "./steps/email-step";
import { EmergencyContactStep } from "./steps/emergency-contact-step";
import { PersonalInfoStep } from "./steps/personal-info-step";
import { ReviewStep } from "./steps/review-step";

interface EventData {
	id: string;
	title: string;
	slug: string;
	description: string | null;
	startDate: Date;
	endDate: Date | null;
	currency: string;
	location: {
		id: string;
		name: string;
		address: string | null;
		city: string | null;
	} | null;
	ageCategories: Array<{
		ageCategory: AgeCategory;
		maxCapacity: number | null;
		currentRegistrations: number;
	}>;
}

interface EventRegistrationWizardProps {
	event: EventData;
	organizationSlug: string;
	eventSlug: string;
}

export function EventRegistrationWizard({
	event,
	organizationSlug,
	eventSlug,
}: EventRegistrationWizardProps) {
	const router = useRouter();
	const [currentStep, setCurrentStep] = React.useState(1);
	const [isReturningAthlete, setIsReturningAthlete] = React.useState(false);
	const [existingUser, setExistingUser] =
		React.useState<ExistingUserData | null>(null);
	const [existingAthlete, setExistingAthlete] =
		React.useState<ExistingAthleteData | null>(null);
	const [_useExistingData, setUseExistingData] = React.useState(false);
	const [matchedAgeCategory, setMatchedAgeCategory] =
		React.useState<AgeCategory | null>(null);
	const [calculatedPrice, setCalculatedPrice] =
		React.useState<PriceInfo | null>(null);

	// Form data accumulated across steps
	const [formData, setFormData] = React.useState<
		Partial<FullRegistrationWizardInput>
	>({});

	// Determine if athlete is a minor based on birth date
	const isMinor = React.useMemo(() => {
		if (!formData.birthDate) return false;
		return isMinorFromDate(formData.birthDate);
	}, [formData.birthDate]);

	// Price calculation query
	const calculatePriceQuery = trpc.public.event.calculatePrice.useQuery(
		{
			organizationSlug,
			eventSlug,
			ageCategoryId: matchedAgeCategory?.id,
		},
		{
			enabled: currentStep === 5 && !!matchedAgeCategory?.id,
		},
	);

	// Update calculated price when query returns
	React.useEffect(() => {
		if (calculatePriceQuery.data) {
			setCalculatedPrice({
				price: calculatePriceQuery.data.price,
				tierId: calculatePriceQuery.data.tierId,
				tierName: calculatePriceQuery.data.tierName,
				currency: calculatePriceQuery.data.currency,
				registrationNumber: calculatePriceQuery.data.registrationNumber,
			});
		}
	}, [calculatePriceQuery.data]);

	// Registration mutation
	const registerMutation = trpc.public.event.register.useMutation({
		onSuccess: (result) => {
			toast.success("Inscripción exitosa");
			router.push(
				`/${organizationSlug}/events/${eventSlug}/register/success?id=${result.registrationId}&number=${result.registrationNumber}`,
			);
		},
		onError: (error) => {
			toast.error(error.message || "Error al registrarse");
		},
	});

	// Calculate age category based on birth date
	const calculateAgeCategory = React.useCallback(
		(birthDate: Date) => {
			const birthYear = birthDate.getFullYear();

			const matched = event.ageCategories.find(({ ageCategory: cat }) => {
				const minYear = cat.minBirthYear ?? 1900;
				const maxYear = cat.maxBirthYear ?? 2100;
				return birthYear >= minYear && birthYear <= maxYear;
			});

			if (matched) {
				setMatchedAgeCategory(matched.ageCategory);
			} else {
				setMatchedAgeCategory(null);
			}

			return matched?.ageCategory ?? null;
		},
		[event.ageCategories],
	);

	// Handle step data updates
	const updateFormData = (data: Partial<FullRegistrationWizardInput>) => {
		setFormData((prev) => ({ ...prev, ...data }));
	};

	// Navigation handlers
	const goToNextStep = () => {
		if (currentStep < WIZARD_STEPS.length) {
			setCurrentStep(currentStep + 1);
		}
	};

	const goToPreviousStep = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	const goToStep = (step: number) => {
		if (step >= 1 && step <= WIZARD_STEPS.length && step < currentStep) {
			setCurrentStep(step);
		}
	};

	// Handle email lookup result
	const handleEmailLookupResult = (result: {
		isAlreadyRegistered: boolean;
		user: ExistingUserData | null;
		athlete: ExistingAthleteData | null;
	}) => {
		if (result.user) {
			setExistingUser(result.user);
			setIsReturningAthlete(true);
		}
		if (result.athlete) {
			setExistingAthlete(result.athlete);
		}
	};

	// Handle using existing data
	const handleUseExistingData = (use: boolean) => {
		setUseExistingData(use);
		if (use && existingUser && existingAthlete) {
			// Pre-fill form with existing data
			const preFillData: Partial<FullRegistrationWizardInput> = {
				fullName: existingUser.name,
				birthDate: existingAthlete.birthDate ?? undefined,
				phone: existingAthlete.phone ?? undefined,
				nationality: existingAthlete.nationality ?? undefined,
				sport: existingAthlete.sport,
				level: existingAthlete.level as FullRegistrationWizardInput["level"],
				position: existingAthlete.position ?? undefined,
				secondaryPosition: existingAthlete.secondaryPosition ?? undefined,
				currentClub: existingAthlete.currentClub?.name ?? undefined,
				jerseyNumber: existingAthlete.jerseyNumber ?? undefined,
				yearsOfExperience: existingAthlete.yearsOfExperience ?? undefined,
			};
			setFormData((prev) => ({ ...prev, ...preFillData }));

			// Calculate age category if birth date exists
			if (existingAthlete.birthDate) {
				calculateAgeCategory(existingAthlete.birthDate);
			}
		}
	};

	// Handle final submission
	const handleSubmit = async () => {
		const submissionData = {
			organizationSlug,
			eventSlug,
			registrantName: formData.fullName!,
			registrantEmail: formData.email!,
			registrantPhone: formData.phone,
			registrantBirthDate: formData.birthDate,
			emergencyContactName: formData.emergencyContactName,
			emergencyContactPhone: formData.emergencyContactPhone,
			emergencyContactRelation: formData.emergencyContactRelation,
			// Parent/Guardian info (for minors)
			parentName: formData.parentName,
			parentPhone: formData.parentPhone,
			parentEmail: formData.parentEmail,
			parentRelationship: formData.parentRelationship,
			ageCategoryId: matchedAgeCategory?.id,
			notes: formData.notes,
			acceptTerms: true as const,
			confirmMedicalFitness: true as const,
			parentalConsent: isMinor ? formData.parentalConsent : undefined,
		};

		await registerMutation.mutateAsync(submissionData);
	};

	// Render current step
	const renderStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<EmailStep
						organizationSlug={organizationSlug}
						eventSlug={eventSlug}
						defaultValue={formData.email}
						isReturningAthlete={isReturningAthlete}
						existingUser={existingUser}
						onEmailVerified={(email) => {
							updateFormData({ email });
						}}
						onLookupResult={handleEmailLookupResult}
						onUseExistingData={handleUseExistingData}
						onNext={goToNextStep}
					/>
				);
			case 2:
				return (
					<PersonalInfoStep
						defaultValues={{
							fullName: formData.fullName ?? "",
							birthDate: formData.birthDate,
							phone: formData.phone ?? "",
							nationality: formData.nationality,
						}}
						matchedAgeCategory={matchedAgeCategory}
						onBirthDateChange={calculateAgeCategory}
						onSubmit={(data) => {
							updateFormData(data);
							goToNextStep();
						}}
						onBack={goToPreviousStep}
					/>
				);
			case 3:
				return (
					<AthleteProfileStep
						defaultValues={{
							sport: formData.sport ?? "",
							level: formData.level,
							position: formData.position ?? "",
							secondaryPosition: formData.secondaryPosition,
							currentClub: formData.currentClub,
							jerseyNumber: formData.jerseyNumber,
							yearsOfExperience: formData.yearsOfExperience,
						}}
						onSubmit={(data) => {
							updateFormData(data);
							goToNextStep();
						}}
						onBack={goToPreviousStep}
					/>
				);
			case 4:
				return (
					<EmergencyContactStep
						defaultValues={{
							emergencyContactName: formData.emergencyContactName ?? "",
							emergencyContactPhone: formData.emergencyContactPhone ?? "",
							emergencyContactRelation: formData.emergencyContactRelation ?? "",
							parentName: formData.parentName ?? "",
							parentPhone: formData.parentPhone ?? "",
							parentEmail: formData.parentEmail ?? "",
							parentRelationship: formData.parentRelationship ?? "",
						}}
						isMinor={isMinor}
						onSubmit={(data) => {
							updateFormData(data);
							goToNextStep();
						}}
						onBack={goToPreviousStep}
					/>
				);
			case 5:
				return (
					<ReviewStep
						formData={formData}
						event={event}
						matchedAgeCategory={matchedAgeCategory}
						calculatedPrice={calculatedPrice}
						isLoadingPrice={calculatePriceQuery.isLoading}
						isSubmitting={registerMutation.isPending}
						isMinor={isMinor}
						onSubmit={(data) => {
							updateFormData(data);
							handleSubmit();
						}}
						onBack={goToPreviousStep}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div className="mx-auto max-w-2xl px-4 py-8">
			{/* Header */}
			<div className="mb-8 text-center">
				<h1 className="text-2xl font-bold">{event.title}</h1>
				<p className="mt-1 text-muted-foreground">Formulario de inscripción</p>
			</div>

			{/* Stepper */}
			<div className="mb-8">
				<Stepper
					steps={WIZARD_STEPS}
					currentStep={currentStep}
					onStepClick={goToStep}
					allowNavigation
				/>
			</div>

			{/* Step Content */}
			<Card>
				<CardContent className="pt-6">{renderStep()}</CardContent>
			</Card>
		</div>
	);
}
