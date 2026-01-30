import { Section, Text } from "@react-email/components";
import type * as React from "react";
import { BaseEmailLayout, EmailButton, EmailLinkFallback } from "../components";
import type { EmailTranslations } from "../translations";

export type VerifyEmailAddressEmailProps = {
	name: string;
	verificationLink: string;
	logoUrl?: string;
	t: EmailTranslations;
};

function VerifyEmailAddressEmail({
	name,
	verificationLink,
	logoUrl,
	t,
}: VerifyEmailAddressEmailProps): React.JSX.Element {
	return (
		<BaseEmailLayout
			preview={t.verifyEmail.preview}
			heading={t.verifyEmail.title}
			footerText={t.verifyEmail.footer}
			logoUrl={logoUrl}
		>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.common.hello.replace("{name}", name)}
			</Text>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.verifyEmail.body}
			</Text>
			<Section className="my-[32px] text-center">
				<EmailButton href={verificationLink}>
					{t.verifyEmail.button}
				</EmailButton>
			</Section>
			<EmailLinkFallback href={verificationLink} label={t.common.orCopyLink} />
		</BaseEmailLayout>
	);
}

VerifyEmailAddressEmail.PreviewProps = {
	name: "John Doe",
	verificationLink:
		"https://example.com/verify-email/request/bcab80ca8eb6ee41d4e7e34bb157a0e205ab3188a78599137b76d883e86e7036",
	t: {
		common: {
			hello: "Hola {name},",
			orCopyLink: "o copia y pega esta URL en tu navegador:",
		},
		verifyEmail: {
			subject: "Verifica tu correo electronico",
			preview: "Verificacion de correo electronico",
			title: "Verificacion de correo electronico",
			body: "Para completar tu cuenta, necesitas verificar tu correo electronico.",
			button: "Verificar correo",
			footer:
				"Si no querias verificar tu correo o no solicitaste esto, simplemente ignora y elimina este mensaje. Por favor, no reenvies este correo a nadie.",
		},
	} as unknown as EmailTranslations,
} satisfies VerifyEmailAddressEmailProps;

export default VerifyEmailAddressEmail;
export { VerifyEmailAddressEmail };
