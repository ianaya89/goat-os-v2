import { Link, Section, Text } from "@react-email/components";
import type * as React from "react";
import {
	BaseEmailLayout,
	BRAND_COLORS,
	EmailButton,
	EmailLinkFallback,
} from "../components";
import type { EmailTranslations } from "../translations";

export type OrganizationInvitationEmailProps = {
	appName: string;
	invitedByName: string;
	invitedByEmail: string;
	organizationName: string;
	inviteLink: string;
	logoUrl?: string;
	t: EmailTranslations;
};

function OrganizationInvitationEmail({
	appName,
	invitedByName,
	invitedByEmail,
	organizationName,
	inviteLink,
	logoUrl,
	t,
}: OrganizationInvitationEmailProps): React.JSX.Element {
	const preview = t.organizationInvitation.preview
		.replace("{organizationName}", organizationName)
		.replace("{appName}", appName);

	const title = t.organizationInvitation.title
		.replace("{organizationName}", organizationName)
		.replace("{appName}", appName);

	return (
		<BaseEmailLayout
			preview={preview}
			heading={title}
			footerText={t.organizationInvitation.footer}
			appName={appName}
			logoUrl={logoUrl}
		>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.common.helloGeneric}
			</Text>
			<Text className="text-[14px] text-black leading-[24px]">
				<strong>{invitedByName}</strong> (
				<Link
					href={`mailto:${invitedByEmail}`}
					className="break-all no-underline"
					style={{ color: BRAND_COLORS.link }}
				>
					{invitedByEmail}
				</Link>
				){" "}
				{t.organizationInvitation.body
					.replace("{invitedByName}", "")
					.replace(`({invitedByEmail})`, "")
					.replace("{organizationName}", organizationName)
					.replace("{appName}", appName)
					.trim()
					.split(organizationName)
					.map((part, i, arr) =>
						i < arr.length - 1 ? (
							<span key={i}>
								{part}
								<strong>{organizationName}</strong>
							</span>
						) : (
							part.split(appName).map((subpart, j, subarr) =>
								j < subarr.length - 1 ? (
									<span key={j}>
										{subpart}
										<strong>{appName}</strong>
									</span>
								) : (
									<span key={j}>{subpart}</span>
								),
							)
						),
					)}
			</Text>
			<Section className="my-[32px] text-center">
				<EmailButton href={inviteLink}>
					{t.organizationInvitation.button}
				</EmailButton>
			</Section>
			<EmailLinkFallback href={inviteLink} label={t.common.orCopyLink} />
		</BaseEmailLayout>
	);
}

OrganizationInvitationEmail.PreviewProps = {
	appName: "GOAT OS",
	invitedByName: "Jane Doe",
	invitedByEmail: "jane.doe@gmail.com",
	organizationName: "Sports Academy",
	inviteLink:
		"https://example.com/invitations/request/a5cffa7e-76eb-4671-a195-d1670a7d4df3",
	t: {
		common: {
			helloGeneric: "Hola,",
			orCopyLink: "o copia y pega esta URL en tu navegador:",
		},
		organizationInvitation: {
			preview: "Unite a {organizationName} en {appName}",
			title: "Unite a {organizationName}",
			body: "{invitedByName} ({invitedByEmail}) te invito a unirte a la organizacion {organizationName} en {appName}.",
			button: "Aceptar invitacion",
			footer: "Si no esperabas esta invitacion, podes ignorar este correo.",
		},
	} as unknown as EmailTranslations,
} satisfies OrganizationInvitationEmailProps;

export default OrganizationInvitationEmail;
export { OrganizationInvitationEmail };
