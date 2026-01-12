import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import type * as React from "react";

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
};

function DailySessionSummaryEmail({
	appName,
	recipientName,
	organizationName,
	summaryDate,
	sessions,
	totalSessions,
	totalAthletes,
}: DailySessionSummaryEmailProps): React.JSX.Element {
	return (
		<Html>
			<Head />
			<Preview>
				{`${totalSessions} training session${totalSessions !== 1 ? "s" : ""} scheduled for ${summaryDate}`}
			</Preview>
			<Tailwind>
				<Body className="m-auto bg-white px-2 font-sans">
					<Container className="mx-auto my-[40px] max-w-[600px] rounded-sm border border-[#eaeaea] border-solid p-[20px]">
						<Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
							Daily Training Summary
						</Heading>
						<Text className="text-[14px] text-black leading-[24px]">
							Hello {recipientName},
						</Text>
						<Text className="text-[14px] text-black leading-[24px]">
							Here's your training schedule for <strong>{summaryDate}</strong>:
						</Text>

						{/* Summary Stats */}
						<Section className="my-[24px] rounded-md bg-[#f0f9ff] p-[16px]">
							<Text className="m-0 text-center font-semibold text-[16px] text-[#0369a1]">
								{totalSessions} Session{totalSessions !== 1 ? "s" : ""} •{" "}
								{totalAthletes} Athlete{totalAthletes !== 1 ? "s" : ""}
							</Text>
						</Section>

						{/* Sessions List */}
						{sessions.map((session, index) => (
							<Section
								key={`session-${index}`}
								className="my-[16px] rounded-md border border-[#e5e7eb] border-solid p-[16px]"
							>
								<Text className="m-0 font-semibold text-[16px] text-black">
									{session.title}
								</Text>
								<Text className="m-0 mt-[8px] text-[14px] text-[#666666]">
									<strong>Time:</strong> {session.time}
								</Text>
								<Text className="m-0 mt-[4px] text-[14px] text-[#666666]">
									<strong>Location:</strong> {session.location}
								</Text>
								<Text className="m-0 mt-[4px] text-[14px] text-[#666666]">
									<strong>
										Coach{session.coaches.length !== 1 ? "es" : ""}:
									</strong>{" "}
									{session.coaches.join(", ")}
								</Text>
								<Text className="m-0 mt-[4px] text-[14px] text-[#666666]">
									<strong>Athletes:</strong> {session.athleteCount}
									{session.groupName && ` (${session.groupName})`}
								</Text>
							</Section>
						))}

						{sessions.length === 0 && (
							<Section className="my-[24px] rounded-md bg-[#f9f9f9] p-[16px] text-center">
								<Text className="m-0 text-[14px] text-[#666666]">
									No training sessions scheduled for this date.
								</Text>
							</Section>
						)}

						<Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
						<Text className="text-[#666666] text-[12px] leading-[24px]">
							This summary was sent by {organizationName} via {appName}.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

DailySessionSummaryEmail.PreviewProps = {
	appName: "GoatOS",
	recipientName: "Coach Smith",
	organizationName: "Sports Academy",
	summaryDate: "Monday, January 15, 2024",
	totalSessions: 3,
	totalAthletes: 25,
	sessions: [
		{
			title: "Morning Conditioning",
			time: "7:00 AM - 8:30 AM",
			location: "Main Field",
			coaches: ["Coach Smith"],
			athleteCount: 12,
			groupName: "U18 Team",
		},
		{
			title: "Technical Training",
			time: "10:00 AM - 12:00 PM",
			location: "Indoor Facility",
			coaches: ["Coach Johnson", "Coach Williams"],
			athleteCount: 8,
		},
		{
			title: "Evening Practice",
			time: "5:00 PM - 7:00 PM",
			location: "Main Stadium",
			coaches: ["Coach Smith"],
			athleteCount: 5,
			groupName: "Senior Squad",
		},
	],
} satisfies DailySessionSummaryEmailProps;

export default DailySessionSummaryEmail;
export { DailySessionSummaryEmail };
