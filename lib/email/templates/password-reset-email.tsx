import { Section, Text } from "@react-email/components";
import type * as React from "react";
import { BaseEmailLayout, EmailButton, EmailLinkFallback } from "../components";
import type { EmailTranslations } from "../translations";

export type PasswordResetEmailProps = {
	appName: string;
	name: string;
	resetPasswordLink: string;
	logoUrl?: string;
	t: EmailTranslations;
};

function PasswordResetEmail({
	appName,
	name,
	resetPasswordLink,
	logoUrl,
	t,
}: PasswordResetEmailProps): React.JSX.Element {
	return (
		<BaseEmailLayout
			preview={t.passwordReset.preview}
			heading={t.passwordReset.title}
			footerText={t.passwordReset.footer}
			appName={appName}
			logoUrl={logoUrl}
		>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.common.hello.replace("{name}", name)}
			</Text>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.passwordReset.body.replace("{appName}", appName)}
			</Text>
			<Section className="my-[32px] text-center">
				<EmailButton href={resetPasswordLink}>
					{t.passwordReset.button}
				</EmailButton>
			</Section>
			<EmailLinkFallback href={resetPasswordLink} label={t.common.orCopyLink} />
		</BaseEmailLayout>
	);
}

PasswordResetEmail.PreviewProps = {
	appName: "GOAT OS",
	name: "John Doe",
	resetPasswordLink:
		"https://example.com/reset-password/request/a5cffa7e-76eb-4671-a195-d1670a7d4df3",
	t: {
		common: {
			hello: "Hola {name},",
			orCopyLink: "o copia y pega esta URL en tu navegador:",
		},
		passwordReset: {
			preview: "Restablece tu contrasena",
			title: "Restablecer contrasena",
			body: "Recibimos una solicitud para restablecer la contrasena de tu cuenta de {appName}. Hace clic en el boton de abajo para elegir una nueva contrasena.",
			button: "Restablecer contrasena",
			footer:
				"Si no solicitaste restablecer tu contrasena, podes ignorar este correo de forma segura. Tu contrasena permanecera sin cambios.",
		},
	} as unknown as EmailTranslations,
} satisfies PasswordResetEmailProps;

export default PasswordResetEmail;
export { PasswordResetEmail };
