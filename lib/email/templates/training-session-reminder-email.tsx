import { Hr, Section, Text } from "@react-email/components";
import type * as React from "react";
import {
	BaseEmailLayout,
	BRAND_COLORS,
	EmailButton,
	EmailLinkFallback,
} from "../components";
import type { EmailTranslations } from "../translations";

export type TrainingSessionReminderEmailProps = {
	appName: string;
	athleteName: string;
	sessionTitle: string;
	sessionDate: string;
	sessionTime: string;
	location: string;
	coachName: string;
	organizationName: string;
	confirmationUrl?: string;
	logoUrl?: string;
	t: EmailTranslations;
};

function TrainingSessionReminderEmail({
	appName,
	athleteName,
	sessionTitle,
	sessionDate,
	sessionTime,
	location,
	coachName,
	organizationName,
	confirmationUrl,
	logoUrl,
	t,
}: TrainingSessionReminderEmailProps): React.JSX.Element {
	const preview = t.trainingSessionReminder.preview
		.replace("{sessionTitle}", sessionTitle)
		.replace("{sessionDate}", sessionDate);

	const footerText = t.common.footer.sentBy
		.replace("{organizationName}", organizationName)
		.replace("{appName}", appName);

	return (
		<BaseEmailLayout
			preview={preview}
			heading={t.trainingSessionReminder.title}
			footerText={footerText}
			appName={appName}
			logoUrl={logoUrl}
		>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.common.hello.replace("{name}", athleteName)}
			</Text>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.trainingSessionReminder.body}
			</Text>

			{/* Session Details */}
			<Section
				className="my-[24px] rounded-md p-[16px]"
				style={{ backgroundColor: BRAND_COLORS.infoBox }}
			>
				<Text className="m-0 font-semibold text-[16px] text-black">
					{sessionTitle}
				</Text>
				<Text className="m-0 mt-[8px] text-[14px] text-[#666666]">
					<strong>{t.trainingSessionReminder.session.date}</strong>{" "}
					{sessionDate}
				</Text>
				<Text className="m-0 mt-[4px] text-[14px] text-[#666666]">
					<strong>{t.trainingSessionReminder.session.time}</strong>{" "}
					{sessionTime}
				</Text>
				<Text className="m-0 mt-[4px] text-[14px] text-[#666666]">
					<strong>{t.trainingSessionReminder.session.location}</strong>{" "}
					{location}
				</Text>
				<Text className="m-0 mt-[4px] text-[14px] text-[#666666]">
					<strong>{t.trainingSessionReminder.session.coach}</strong> {coachName}
				</Text>
			</Section>

			{confirmationUrl && (
				<>
					<Text className="text-[14px] text-black leading-[24px]">
						{t.trainingSessionReminder.confirmPrompt}
					</Text>
					<Section className="my-[32px] text-center">
						<EmailButton href={confirmationUrl}>
							{t.trainingSessionReminder.button}
						</EmailButton>
					</Section>
					<EmailLinkFallback
						href={confirmationUrl}
						label={t.common.orCopyLink}
					/>
					<Hr
						className="mx-0 my-[20px] w-full border border-solid"
						style={{ borderColor: BRAND_COLORS.border }}
					/>
				</>
			)}

			<Text className="text-[14px] text-black leading-[24px]">
				{t.trainingSessionReminder.reminder}
			</Text>
		</BaseEmailLayout>
	);
}

TrainingSessionReminderEmail.PreviewProps = {
	appName: "GOAT OS",
	athleteName: "John Doe",
	sessionTitle: "Entrenamiento matutino",
	sessionDate: "Lunes, 15 de Enero, 2024",
	sessionTime: "9:00 - 11:00",
	location: "Estadio principal",
	coachName: "Coach Smith",
	organizationName: "Sports Academy",
	confirmationUrl: "https://example.com/api/confirm-attendance?token=abc123",
	t: {
		common: {
			hello: "Hola {name},",
			orCopyLink: "o copia y pega esta URL en tu navegador:",
			footer: {
				sentBy:
					"Este mensaje fue enviado por {organizationName} a traves de {appName}.",
			},
		},
		trainingSessionReminder: {
			preview:
				'Recordatorio: Sesion de entrenamiento "{sessionTitle}" el {sessionDate}',
			title: "Recordatorio de sesion de entrenamiento",
			body: "Este es un recordatorio de que tenes una proxima sesion de entrenamiento:",
			session: {
				date: "Fecha:",
				time: "Hora:",
				location: "Ubicacion:",
				coach: "Entrenador:",
			},
			confirmPrompt:
				"Por favor confirma tu asistencia haciendo clic en el boton de abajo:",
			button: "Confirmar asistencia",
			reminder:
				"Por favor asegurate de llegar a tiempo y traer todo el equipamiento necesario.",
		},
	} as unknown as EmailTranslations,
} satisfies TrainingSessionReminderEmailProps;

export default TrainingSessionReminderEmail;
export { TrainingSessionReminderEmail };
