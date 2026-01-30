import { Link, Section, Text } from "@react-email/components";
import type * as React from "react";
import {
	BaseEmailLayout,
	BRAND_COLORS,
	EmailButton,
	EmailLinkFallback,
} from "../components";
import type { EmailTranslations } from "../translations";

export type CoachWelcomeEmailProps = {
	appName: string;
	coachName: string;
	organizationName: string;
	loginUrl: string;
	forgotPasswordUrl: string;
	logoUrl?: string;
	t: EmailTranslations;
};

function CoachWelcomeEmail({
	appName,
	coachName,
	organizationName,
	loginUrl,
	forgotPasswordUrl,
	logoUrl,
	t,
}: CoachWelcomeEmailProps): React.JSX.Element {
	const preview = t.coachWelcome.preview
		.replace("{organizationName}", organizationName)
		.replace("{appName}", appName);

	const title = t.coachWelcome.title.replace(
		"{organizationName}",
		organizationName,
	);

	return (
		<BaseEmailLayout
			preview={preview}
			heading={title}
			footerText={t.common.footer.contactAdmin}
			appName={appName}
			logoUrl={logoUrl}
		>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.common.hello.replace("{name}", coachName)}
			</Text>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.coachWelcome.body
					.replace("{organizationName}", organizationName)
					.replace("{appName}", appName)}
			</Text>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.coachWelcome.accountCreated}
			</Text>
			<Section
				className="my-[16px] rounded-md p-[16px]"
				style={{ backgroundColor: BRAND_COLORS.infoBox }}
			>
				<Text className="m-0 text-[14px] text-black leading-[28px]">
					<strong>1.</strong> {t.coachWelcome.steps.step1}
					<br />
					<strong>2.</strong> {t.coachWelcome.steps.step2}
					<br />
					<strong>3.</strong> {t.coachWelcome.steps.step3}
					<br />
					<strong>4.</strong> {t.coachWelcome.steps.step4}
				</Text>
			</Section>
			<Section className="my-[32px] text-center">
				<EmailButton href={forgotPasswordUrl}>
					{t.coachWelcome.button}
				</EmailButton>
			</Section>
			<EmailLinkFallback href={forgotPasswordUrl} label={t.common.orCopyLink} />
			<Text className="text-[14px] text-black leading-[24px]">
				{t.coachWelcome.loginInfo}{" "}
				<Link
					href={loginUrl}
					className="break-all no-underline"
					style={{ color: BRAND_COLORS.link }}
				>
					{loginUrl}
				</Link>
			</Text>
		</BaseEmailLayout>
	);
}

CoachWelcomeEmail.PreviewProps = {
	appName: "GOAT OS",
	coachName: "John Doe",
	organizationName: "Sports Academy",
	loginUrl: "https://example.com/auth/sign-in",
	forgotPasswordUrl: "https://example.com/auth/forgot-password",
	t: {
		common: {
			hello: "Hola {name},",
			orCopyLink: "o copia y pega esta URL en tu navegador:",
			footer: {
				contactAdmin:
					"Si no esperabas este correo, por favor contacta al administrador de tu organizacion.",
			},
		},
		coachWelcome: {
			preview: "Bienvenido a {organizationName} en {appName}",
			title: "Bienvenido a {organizationName}",
			body: "Fuiste agregado como Entrenador a la organizacion {organizationName} en {appName}.",
			accountCreated:
				"Se creo una cuenta para vos. Para acceder a la plataforma, por favor configura tu contrasena siguiendo estos pasos:",
			steps: {
				step1:
					"Hace clic en el boton de abajo para ir a la pagina de recuperacion de contrasena",
				step2: "Ingresa tu correo electronico y envia",
				step3:
					"Revisa tu bandeja de entrada para el enlace de recuperacion de contrasena",
				step4: "Configura tu nueva contrasena",
			},
			button: "Configurar tu contrasena",
			loginInfo:
				"Despues de configurar tu contrasena, podes iniciar sesion en:",
		},
	} as unknown as EmailTranslations,
} satisfies CoachWelcomeEmailProps;

export default CoachWelcomeEmail;
export { CoachWelcomeEmail };
