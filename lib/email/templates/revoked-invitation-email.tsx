import { Text } from "@react-email/components";
import type * as React from "react";
import { BaseEmailLayout } from "../components";
import type { EmailTranslations } from "../translations";

export type RevokedInvitationEmailProps = {
	appName: string;
	organizationName: string;
	logoUrl?: string;
	t: EmailTranslations;
};

function RevokedInvitationEmail({
	appName,
	organizationName,
	logoUrl,
	t,
}: RevokedInvitationEmailProps): React.JSX.Element {
	const preview = t.revokedInvitation.preview
		.replace("{organizationName}", organizationName)
		.replace("{appName}", appName);

	return (
		<BaseEmailLayout
			preview={preview}
			heading={t.revokedInvitation.title}
			footerText={t.revokedInvitation.footer}
			appName={appName}
			logoUrl={logoUrl}
		>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.common.helloGeneric}
			</Text>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.revokedInvitation.body
					.replace("{organizationName}", organizationName)
					.replace("{appName}", appName)}
			</Text>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.revokedInvitation.explanation}
			</Text>
		</BaseEmailLayout>
	);
}

RevokedInvitationEmail.PreviewProps = {
	appName: "GOAT OS",
	organizationName: "Sports Academy",
	t: {
		common: {
			helloGeneric: "Hola,",
		},
		revokedInvitation: {
			preview: "Tu invitacion a {organizationName} fue revocada",
			title: "Invitacion revocada",
			body: "Tu invitacion para unirte a {organizationName} en {appName} ha sido revocada.",
			explanation:
				"Esto significa que el enlace de invitacion que recibiste anteriormente ya no es valido. Si crees que esto es un error, por favor contacta al administrador de la organizacion.",
			footer:
				"Si no esperabas esta invitacion originalmente, podes ignorar este correo de forma segura.",
		},
	} as unknown as EmailTranslations,
} satisfies RevokedInvitationEmailProps;

export default RevokedInvitationEmail;
export { RevokedInvitationEmail };
