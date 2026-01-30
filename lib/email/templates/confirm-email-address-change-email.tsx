import { Section, Text } from "@react-email/components";
import type * as React from "react";
import { BaseEmailLayout, EmailButton, EmailLinkFallback } from "../components";
import type { EmailTranslations } from "../translations";

export type ConfirmEmailAddressChangeEmailProps = {
	name: string;
	confirmLink: string;
	logoUrl?: string;
	t: EmailTranslations;
};

function ConfirmEmailAddressChangeEmail({
	name,
	confirmLink,
	logoUrl,
	t,
}: ConfirmEmailAddressChangeEmailProps): React.JSX.Element {
	return (
		<BaseEmailLayout
			preview={t.confirmEmailChange.preview}
			heading={t.confirmEmailChange.title}
			footerText={t.confirmEmailChange.footer}
			logoUrl={logoUrl}
		>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.common.hello.replace("{name}", name)}
			</Text>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.confirmEmailChange.body}
			</Text>
			<Section className="my-[32px] text-center">
				<EmailButton href={confirmLink}>
					{t.confirmEmailChange.button}
				</EmailButton>
			</Section>
			<EmailLinkFallback href={confirmLink} label={t.common.orCopyLink} />
		</BaseEmailLayout>
	);
}

ConfirmEmailAddressChangeEmail.PreviewProps = {
	name: "John Doe",
	confirmLink:
		"https://example.com/auth/change-email/request/a5cffa7e-76eb-4671-a195-d1670a7d4df3",
	t: {
		common: {
			hello: "Hola {name},",
			orCopyLink: "o copia y pega esta URL en tu navegador:",
		},
		confirmEmailChange: {
			preview: "Confirmacion de cambio de correo",
			title: "Confirmar cambio de correo",
			body: "Recibimos una solicitud para cambiar el correo electronico de tu cuenta. Hace clic en el boton de abajo para confirmar este cambio.",
			button: "Confirmar cambio",
			footer:
				"Si no solicitaste este cambio, podes ignorar este correo de forma segura. Tu correo electronico permanecera sin cambios.",
		},
	} as unknown as EmailTranslations,
} satisfies ConfirmEmailAddressChangeEmailProps;

export default ConfirmEmailAddressChangeEmail;
export { ConfirmEmailAddressChangeEmail };
