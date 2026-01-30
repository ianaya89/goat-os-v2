import { Section, Text } from "@react-email/components";
import type * as React from "react";
import { BaseEmailLayout, BRAND_COLORS, EmailButton } from "../components";
import type { EmailTranslations } from "../translations";

export type DisputeReceivedEmailProps = {
	appName: string;
	organizationName: string;
	recipientName: string;
	amount: string;
	currency: string;
	disputeId: string;
	reason: string;
	evidenceDueBy: string;
	disputeLink: string;
	logoUrl?: string;
	t: EmailTranslations;
};

function DisputeReceivedEmail({
	appName,
	organizationName,
	recipientName,
	amount,
	currency,
	disputeId,
	reason,
	evidenceDueBy,
	disputeLink,
	logoUrl,
	t,
}: DisputeReceivedEmailProps): React.JSX.Element {
	const preview = t.disputeReceived.preview.replace(
		"{organizationName}",
		organizationName,
	);

	const footerText = t.common.footer.billingAdmin
		.replace("{organizationName}", organizationName)
		.replace("{appName}", appName);

	return (
		<BaseEmailLayout
			preview={preview}
			heading={t.disputeReceived.title}
			footerText={footerText}
			appName={appName}
			logoUrl={logoUrl}
		>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.common.hello.replace("{name}", recipientName)}
			</Text>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.disputeReceived.alert.replace(
					"{organizationName}",
					organizationName,
				)}
			</Text>

			{/* Dispute Details */}
			<Section
				className="my-[24px] rounded-md border border-solid p-[16px]"
				style={{
					backgroundColor: BRAND_COLORS.infoBox,
					borderColor: BRAND_COLORS.border,
				}}
			>
				<Text className="m-0 mb-2 font-semibold text-[14px] text-black">
					{t.disputeReceived.details.title}
				</Text>
				<Text className="m-0 text-[14px] text-black leading-[24px]">
					<strong>{t.disputeReceived.details.amount}</strong> {amount}{" "}
					{currency.toUpperCase()}
				</Text>
				<Text className="m-0 text-[14px] text-black leading-[24px]">
					<strong>{t.disputeReceived.details.disputeId}</strong> {disputeId}
				</Text>
				<Text className="m-0 text-[14px] text-black leading-[24px]">
					<strong>{t.disputeReceived.details.reason}</strong> {reason}
				</Text>
				<Text className="m-0 font-semibold text-[14px] text-red-600 leading-[24px]">
					<strong>{t.disputeReceived.details.evidenceDue}</strong>{" "}
					{evidenceDueBy}
				</Text>
			</Section>

			<Text className="text-[14px] text-black leading-[24px]">
				{t.disputeReceived.urgency}
			</Text>

			<Section className="my-[32px] text-center">
				<EmailButton href={disputeLink}>{t.disputeReceived.button}</EmailButton>
			</Section>
		</BaseEmailLayout>
	);
}

DisputeReceivedEmail.PreviewProps = {
	appName: "GOAT OS",
	organizationName: "Sports Academy",
	recipientName: "Jane Doe",
	amount: "49.00",
	currency: "usd",
	disputeId: "dp_123456789",
	reason: "fraudulento",
	evidenceDueBy: "15 de Enero, 2026",
	disputeLink: "https://dashboard.stripe.com/disputes/dp_123456789",
	t: {
		common: {
			hello: "Hola {name},",
			footer: {
				billingAdmin:
					"Recibiste este correo porque sos administrador de facturacion de {organizationName} en {appName}.",
			},
		},
		disputeReceived: {
			preview: "Disputa de pago recibida - Accion inmediata requerida",
			title: "Disputa de pago recibida",
			alert:
				"Se recibio una disputa de pago (contracargo) para {organizationName}. Esto requiere tu atencion inmediata.",
			details: {
				title: "Detalles de la disputa",
				amount: "Monto:",
				disputeId: "ID de disputa:",
				reason: "Motivo:",
				evidenceDue: "Evidencia requerida antes de:",
			},
			urgency:
				"Es crucial que respondas a esta disputa antes de la fecha limite de evidencia. No responder puede resultar en la perdida automatica de la disputa y perdida de fondos.",
			button: "Ver disputa y enviar evidencia",
		},
	} as unknown as EmailTranslations,
} satisfies DisputeReceivedEmailProps;

export default DisputeReceivedEmail;
export { DisputeReceivedEmail };
