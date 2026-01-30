import { Section, Text } from "@react-email/components";
import type * as React from "react";
import { BaseEmailLayout, BRAND_COLORS, EmailButton } from "../components";
import type { EmailTranslations } from "../translations";

export type TrialEndingSoonEmailProps = {
	appName: string;
	organizationName: string;
	userName: string;
	planName: string;
	trialEndDate: string;
	daysRemaining: number;
	billingSettingsLink: string;
	logoUrl?: string;
	t: EmailTranslations;
};

function TrialEndingSoonEmail({
	appName,
	organizationName,
	userName,
	planName,
	trialEndDate,
	daysRemaining,
	billingSettingsLink,
	logoUrl,
	t,
}: TrialEndingSoonEmailProps): React.JSX.Element {
	const preview = t.trialEndingSoon.preview
		.replace("{planName}", planName)
		.replace("{organizationName}", organizationName);

	const footerText = t.common.footer.billingAdmin
		.replace("{organizationName}", organizationName)
		.replace("{appName}", appName);

	const daysRemainingText = t.trialEndingSoon.daysRemaining
		.replace(
			/{daysRemaining, plural, one \{([^}]+)\} other \{([^}]+)\}}/,
			daysRemaining === 1 ? "$1" : "$2",
		)
		.replace("{daysRemaining}", String(daysRemaining));

	return (
		<BaseEmailLayout
			preview={preview}
			heading={t.trialEndingSoon.title}
			footerText={footerText}
			appName={appName}
			logoUrl={logoUrl}
		>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.common.hello.replace("{name}", userName)}
			</Text>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.trialEndingSoon.body
					.replace("{planName}", planName)
					.replace("{organizationName}", organizationName)
					.replace("{trialEndDate}", trialEndDate)}
			</Text>

			{/* Trial Details */}
			<Section
				className="my-[24px] rounded-md border border-solid p-[16px]"
				style={{
					backgroundColor: BRAND_COLORS.infoBox,
					borderColor: BRAND_COLORS.border,
				}}
			>
				<Text className="m-0 text-[14px] text-black leading-[24px]">
					<strong>{t.subscriptionCanceled.details.plan}</strong> {planName}
				</Text>
				<Text className="m-0 text-[14px] text-black leading-[24px]">
					<strong>{t.subscriptionCanceled.details.accessUntil}</strong>{" "}
					{trialEndDate}
				</Text>
				<Text
					className="m-0 font-semibold text-[14px] leading-[24px]"
					style={{ color: BRAND_COLORS.primary }}
				>
					{daysRemainingText}
				</Text>
			</Section>

			<Text className="text-[14px] text-black leading-[24px]">
				{t.trialEndingSoon.features.replace("{planName}", planName)}
			</Text>

			<Section className="my-[32px] text-center">
				<EmailButton href={billingSettingsLink}>
					{t.trialEndingSoon.button}
				</EmailButton>
			</Section>

			<Text className="text-[14px] text-black leading-[24px]">
				{t.trialEndingSoon.footer}
			</Text>
		</BaseEmailLayout>
	);
}

TrialEndingSoonEmail.PreviewProps = {
	appName: "GOAT OS",
	organizationName: "Sports Academy",
	userName: "John Doe",
	planName: "Pro",
	trialEndDate: "20 de Diciembre, 2024",
	daysRemaining: 3,
	billingSettingsLink:
		"https://example.com/organization/settings?tab=subscription",
	t: {
		common: {
			hello: "Hola {name},",
			footer: {
				billingAdmin:
					"Recibiste este correo porque sos administrador de facturacion de {organizationName} en {appName}.",
			},
		},
		subscriptionCanceled: {
			details: {
				plan: "Plan:",
				accessUntil: "Termina el:",
			},
		},
		trialEndingSoon: {
			preview:
				"Tu prueba de {planName} para {organizationName} esta por terminar",
			title: "Tu prueba esta por terminar",
			body: "Este es un recordatorio de que tu periodo de prueba de {planName} para {organizationName} termina el {trialEndDate}.",
			daysRemaining:
				"Te {daysRemaining, plural, one {queda 1 dia} other {quedan {daysRemaining} dias}} de prueba.",
			features:
				"Para seguir disfrutando de todas las funciones de {planName}, actualiza a un plan pago antes de que termine tu prueba.",
			button: "Actualizar ahora",
			footer:
				"Si no queres continuar despues de la prueba, no se requiere ninguna accion. Tu organizacion sera automaticamente movida al plan gratuito.",
			daysText: {
				one: "1 dia",
				other: "{count} dias",
			},
		},
	} as unknown as EmailTranslations,
} satisfies TrialEndingSoonEmailProps;

export default TrialEndingSoonEmail;
export { TrialEndingSoonEmail };
