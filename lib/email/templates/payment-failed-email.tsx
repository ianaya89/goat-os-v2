import { Section, Text } from "@react-email/components";
import type * as React from "react";
import { BaseEmailLayout, BRAND_COLORS, EmailButton } from "../components";
import type { EmailTranslations } from "../translations";

export type PaymentFailedEmailProps = {
	appName: string;
	organizationName: string;
	userName: string;
	amount: string;
	currency: string;
	updatePaymentLink: string;
	invoiceId?: string;
	logoUrl?: string;
	t: EmailTranslations;
};

function PaymentFailedEmail({
	appName,
	organizationName,
	userName,
	amount,
	currency,
	updatePaymentLink,
	invoiceId,
	logoUrl,
	t,
}: PaymentFailedEmailProps): React.JSX.Element {
	const preview = t.paymentFailed.preview.replace(
		"{organizationName}",
		organizationName,
	);

	const footerText = t.common.footer.billingAdmin
		.replace("{organizationName}", organizationName)
		.replace("{appName}", appName);

	return (
		<BaseEmailLayout
			preview={preview}
			heading={t.paymentFailed.title}
			footerText={footerText}
			appName={appName}
			logoUrl={logoUrl}
		>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.common.hello.replace("{name}", userName)}
			</Text>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.paymentFailed.body.replace("{organizationName}", organizationName)}
			</Text>

			{/* Payment Details */}
			<Section
				className="my-[24px] rounded-md border border-solid p-[16px]"
				style={{
					backgroundColor: BRAND_COLORS.infoBox,
					borderColor: BRAND_COLORS.border,
				}}
			>
				<Text className="m-0 text-[14px] text-black leading-[24px]">
					<strong>{t.paymentFailed.details.amount}</strong> {amount}{" "}
					{currency.toUpperCase()}
				</Text>
				{invoiceId && (
					<Text className="m-0 text-[14px] text-black leading-[24px]">
						<strong>{t.paymentFailed.details.invoice}</strong> {invoiceId}
					</Text>
				)}
			</Section>

			<Text className="text-[14px] text-black leading-[24px]">
				{t.paymentFailed.action}
			</Text>

			<Section className="my-[32px] text-center">
				<EmailButton href={updatePaymentLink}>
					{t.paymentFailed.button}
				</EmailButton>
			</Section>

			<Text className="text-[14px] text-black leading-[24px]">
				{t.paymentFailed.footer}
			</Text>
		</BaseEmailLayout>
	);
}

PaymentFailedEmail.PreviewProps = {
	appName: "GOAT OS",
	organizationName: "Sports Academy",
	userName: "John Doe",
	amount: "29.00",
	currency: "usd",
	updatePaymentLink:
		"https://example.com/organization/settings?tab=subscription",
	invoiceId: "INV-2024-001234",
	t: {
		common: {
			hello: "Hola {name},",
			footer: {
				billingAdmin:
					"Recibiste este correo porque sos administrador de facturacion de {organizationName} en {appName}.",
			},
		},
		paymentFailed: {
			preview: "Fallo el pago de {organizationName} - Accion requerida",
			title: "Fallo el pago",
			body: "No pudimos procesar el pago de la suscripcion de {organizationName}.",
			details: {
				amount: "Monto:",
				invoice: "Factura:",
			},
			action:
				"Para evitar interrupciones en tu servicio, por favor actualiza tu metodo de pago lo antes posible. Tu suscripcion permanecera activa por tiempo limitado mientras reintentamos el pago.",
			button: "Actualizar metodo de pago",
			footer:
				"Si crees que esto es un error o ya actualizaste tu metodo de pago, ignora este correo. Si tenes alguna pregunta, por favor contacta a nuestro equipo de soporte.",
		},
	} as unknown as EmailTranslations,
} satisfies PaymentFailedEmailProps;

export default PaymentFailedEmail;
export { PaymentFailedEmail };
