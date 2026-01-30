import { Section, Text } from "@react-email/components";
import type * as React from "react";
import { BaseEmailLayout, BRAND_COLORS } from "../components";
import type { EmailTranslations } from "../translations";

export type SubscriptionCanceledEmailProps = {
	appName: string;
	organizationName: string;
	userName: string;
	planName: string;
	cancelDate: string;
	accessEndDate: string;
	logoUrl?: string;
	t: EmailTranslations;
};

function SubscriptionCanceledEmail({
	appName,
	organizationName,
	userName,
	planName,
	cancelDate,
	accessEndDate,
	logoUrl,
	t,
}: SubscriptionCanceledEmailProps): React.JSX.Element {
	const preview = t.subscriptionCanceled.preview
		.replace("{planName}", planName)
		.replace("{organizationName}", organizationName);

	const footerText = t.common.footer.billingAdmin
		.replace("{organizationName}", organizationName)
		.replace("{appName}", appName);

	return (
		<BaseEmailLayout
			preview={preview}
			heading={t.subscriptionCanceled.title}
			footerText={footerText}
			appName={appName}
			logoUrl={logoUrl}
		>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.common.hello.replace("{name}", userName)}
			</Text>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.subscriptionCanceled.body.replace(
					"{organizationName}",
					organizationName,
				)}
			</Text>

			{/* Cancellation Details */}
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
					<strong>{t.subscriptionCanceled.details.canceledOn}</strong>{" "}
					{cancelDate}
				</Text>
				<Text className="m-0 text-[14px] text-black leading-[24px]">
					<strong>{t.subscriptionCanceled.details.accessUntil}</strong>{" "}
					{accessEndDate}
				</Text>
			</Section>

			<Text className="text-[14px] text-black leading-[24px]">
				{t.subscriptionCanceled.accessInfo
					.replace("{planName}", planName)
					.replace("{accessEndDate}", accessEndDate)}
			</Text>

			<Text className="text-[14px] text-black leading-[24px]">
				{t.subscriptionCanceled.reactivate}
			</Text>

			<Text className="text-[14px] text-black leading-[24px]">
				{t.subscriptionCanceled.feedback}
			</Text>
		</BaseEmailLayout>
	);
}

SubscriptionCanceledEmail.PreviewProps = {
	appName: "GOAT OS",
	organizationName: "Sports Academy",
	userName: "John Doe",
	planName: "Pro",
	cancelDate: "15 de Diciembre, 2024",
	accessEndDate: "15 de Enero, 2025",
	t: {
		common: {
			hello: "Hola {name},",
			footer: {
				billingAdmin:
					"Recibiste este correo porque sos administrador de facturacion de {organizationName} en {appName}.",
			},
		},
		subscriptionCanceled: {
			preview:
				"Tu suscripcion {planName} para {organizationName} fue cancelada",
			title: "Suscripcion cancelada",
			body: "Este correo confirma que la suscripcion de {organizationName} fue cancelada.",
			details: {
				plan: "Plan:",
				canceledOn: "Cancelado el:",
				accessUntil: "Acceso hasta:",
			},
			accessInfo:
				"Vas a seguir teniendo acceso a todas las funciones de {planName} hasta {accessEndDate}. Despues de esta fecha, tu organizacion pasara al plan gratuito.",
			reactivate:
				"Si cambias de opinion, podes reactivar tu suscripcion en cualquier momento antes de la fecha de finalizacion del acceso desde la configuracion de facturacion de tu organizacion.",
			feedback:
				"Lamentamos verte ir. Si tenes algun comentario sobre tu experiencia, nos encantaria escucharte.",
		},
	} as unknown as EmailTranslations,
} satisfies SubscriptionCanceledEmailProps;

export default SubscriptionCanceledEmail;
export { SubscriptionCanceledEmail };
