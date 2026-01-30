import { Section, Text } from "@react-email/components";
import type * as React from "react";
import { BaseEmailLayout, BRAND_COLORS } from "../components";
import type { EmailTranslations } from "../translations";

interface SessionSummaryItem {
	title: string;
	time: string;
	location: string;
	coaches: string[];
	athleteCount: number;
	groupName?: string;
}

export type DailySessionSummaryEmailProps = {
	appName: string;
	recipientName: string;
	organizationName: string;
	summaryDate: string;
	sessions: SessionSummaryItem[];
	totalSessions: number;
	totalAthletes: number;
	logoUrl?: string;
	t: EmailTranslations;
};

function DailySessionSummaryEmail({
	appName,
	recipientName,
	organizationName,
	summaryDate,
	sessions,
	totalSessions,
	totalAthletes,
	logoUrl,
	t,
}: DailySessionSummaryEmailProps): React.JSX.Element {
	const statsParts = t.dailySessionSummary.stats.split(" - ");
	const sessionsLabel = statsParts[0] || "Sesiones";
	const athletesLabel = statsParts[1] || "Atletas";

	const sessionsText = `${totalSessions} ${sessionsLabel}`;
	const athletesText = `${totalAthletes} ${athletesLabel}`;

	const preview = t.dailySessionSummary.preview
		.replace(
			/{totalSessions, plural, one \{([^}]+)\} other \{([^}]+)\}}/,
			totalSessions === 1 ? "$1" : "$2",
		)
		.replace("{totalSessions}", String(totalSessions))
		.replace("{summaryDate}", summaryDate);

	const footerText = t.common.footer.sentBy
		.replace("{organizationName}", organizationName)
		.replace("{appName}", appName);

	return (
		<BaseEmailLayout
			preview={preview}
			heading={t.dailySessionSummary.title}
			footerText={footerText}
			appName={appName}
			logoUrl={logoUrl}
			width="wide"
		>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.common.hello.replace("{name}", recipientName)}
			</Text>
			<Text className="text-[14px] text-black leading-[24px]">
				{t.dailySessionSummary.body.replace("{summaryDate}", summaryDate)}
			</Text>

			{/* Summary Stats */}
			<Section
				className="my-[24px] rounded-md p-[16px]"
				style={{ backgroundColor: "#f0f9ff" }}
			>
				<Text
					className="m-0 text-center font-semibold text-[16px]"
					style={{ color: BRAND_COLORS.primary }}
				>
					{sessionsText} - {athletesText}
				</Text>
			</Section>

			{/* Sessions List */}
			{sessions.map((session, index) => (
				<Section
					key={`session-${index}`}
					className="my-[16px] rounded-md border border-solid p-[16px]"
					style={{ borderColor: BRAND_COLORS.border }}
				>
					<Text className="m-0 font-semibold text-[16px] text-black">
						{session.title}
					</Text>
					<Text className="m-0 mt-[8px] text-[14px] text-[#666666]">
						<strong>{t.dailySessionSummary.session.time}</strong> {session.time}
					</Text>
					<Text className="m-0 mt-[4px] text-[14px] text-[#666666]">
						<strong>{t.dailySessionSummary.session.location}</strong>{" "}
						{session.location}
					</Text>
					<Text className="m-0 mt-[4px] text-[14px] text-[#666666]">
						<strong>
							{session.coaches.length !== 1
								? t.dailySessionSummary.session.coaches
								: t.dailySessionSummary.session.coach}
						</strong>{" "}
						{session.coaches.join(", ")}
					</Text>
					<Text className="m-0 mt-[4px] text-[14px] text-[#666666]">
						<strong>{t.dailySessionSummary.session.athletes}</strong>{" "}
						{session.athleteCount}
						{session.groupName && ` (${session.groupName})`}
					</Text>
				</Section>
			))}

			{sessions.length === 0 && (
				<Section
					className="my-[24px] rounded-md p-[16px] text-center"
					style={{ backgroundColor: BRAND_COLORS.infoBox }}
				>
					<Text className="m-0 text-[14px] text-[#666666]">
						{t.dailySessionSummary.noSessions}
					</Text>
				</Section>
			)}
		</BaseEmailLayout>
	);
}

DailySessionSummaryEmail.PreviewProps = {
	appName: "GOAT OS",
	recipientName: "Coach Smith",
	organizationName: "Sports Academy",
	summaryDate: "Lunes, 15 de Enero, 2024",
	totalSessions: 3,
	totalAthletes: 25,
	sessions: [
		{
			title: "Acondicionamiento matutino",
			time: "7:00 - 8:30",
			location: "Campo principal",
			coaches: ["Coach Smith"],
			athleteCount: 12,
			groupName: "Equipo Sub-18",
		},
		{
			title: "Entrenamiento tecnico",
			time: "10:00 - 12:00",
			location: "Instalacion interior",
			coaches: ["Coach Johnson", "Coach Williams"],
			athleteCount: 8,
		},
		{
			title: "Practica vespertina",
			time: "17:00 - 19:00",
			location: "Estadio principal",
			coaches: ["Coach Smith"],
			athleteCount: 5,
			groupName: "Equipo Senior",
		},
	],
	t: {
		common: {
			hello: "Hola {name},",
			footer: {
				sentBy:
					"Este mensaje fue enviado por {organizationName} a traves de {appName}.",
			},
		},
		dailySessionSummary: {
			preview:
				"{totalSessions, plural, one {{totalSessions} sesion de entrenamiento} other {{totalSessions} sesiones de entrenamiento}} programadas para {summaryDate}",
			title: "Resumen diario de entrenamiento",
			body: "Aca esta tu agenda de entrenamiento para {summaryDate}:",
			stats: "Sesiones - Atletas",
			session: {
				time: "Hora:",
				location: "Ubicacion:",
				coach: "Entrenador:",
				coaches: "Entrenadores:",
				athletes: "Atletas:",
			},
			noSessions:
				"No hay sesiones de entrenamiento programadas para esta fecha.",
		},
	} as unknown as EmailTranslations,
} satisfies DailySessionSummaryEmailProps;

export default DailySessionSummaryEmail;
export { DailySessionSummaryEmail };
