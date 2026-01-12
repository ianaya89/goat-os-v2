import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import type * as React from "react";

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
}: TrainingSessionReminderEmailProps): React.JSX.Element {
	return (
		<Html>
			<Head />
			<Preview>
				Reminder: Training session "{sessionTitle}" on {sessionDate}
			</Preview>
			<Tailwind>
				<Body className="m-auto bg-white px-2 font-sans">
					<Container className="mx-auto my-[40px] max-w-[465px] rounded-sm border border-[#eaeaea] border-solid p-[20px]">
						<Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
							Training Session Reminder
						</Heading>
						<Text className="text-[14px] text-black leading-[24px]">
							Hello {athleteName},
						</Text>
						<Text className="text-[14px] text-black leading-[24px]">
							This is a reminder that you have an upcoming training session:
						</Text>
						<Section className="my-[24px] rounded-md bg-[#f9f9f9] p-[16px]">
							<Text className="m-0 font-semibold text-[16px] text-black">
								{sessionTitle}
							</Text>
							<Text className="m-0 mt-[8px] text-[14px] text-[#666666]">
								<strong>Date:</strong> {sessionDate}
							</Text>
							<Text className="m-0 mt-[4px] text-[14px] text-[#666666]">
								<strong>Time:</strong> {sessionTime}
							</Text>
							<Text className="m-0 mt-[4px] text-[14px] text-[#666666]">
								<strong>Location:</strong> {location}
							</Text>
							<Text className="m-0 mt-[4px] text-[14px] text-[#666666]">
								<strong>Coach:</strong> {coachName}
							</Text>
						</Section>
						{confirmationUrl && (
							<>
								<Text className="text-[14px] text-black leading-[24px]">
									Please confirm your attendance by clicking the button below:
								</Text>
								<Section className="my-[32px] text-center">
									<Button
										href={confirmationUrl}
										className="rounded-sm bg-[#10b981] px-6 py-3 text-center font-semibold text-[14px] text-white no-underline"
									>
										Confirm Attendance
									</Button>
								</Section>
								<Text className="text-[12px] text-[#666666] leading-[20px]">
									Or copy and paste this URL into your browser:{" "}
									<Link
										href={confirmationUrl}
										className="break-all text-blue-600 no-underline"
									>
										{confirmationUrl}
									</Link>
								</Text>
								<Hr className="mx-0 my-[20px] w-full border border-[#eaeaea] border-solid" />
							</>
						)}
						<Text className="text-[14px] text-black leading-[24px]">
							Please make sure to arrive on time and bring all necessary
							equipment.
						</Text>
						<Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
						<Text className="text-[#666666] text-[12px] leading-[24px]">
							This reminder was sent by {organizationName} via {appName}.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

TrainingSessionReminderEmail.PreviewProps = {
	appName: "Acme",
	athleteName: "John Doe",
	sessionTitle: "Morning Training",
	sessionDate: "Monday, January 15, 2024",
	sessionTime: "9:00 AM - 11:00 AM",
	location: "Main Stadium",
	coachName: "Coach Smith",
	organizationName: "Sports Academy",
	confirmationUrl: "https://example.com/api/confirm-attendance?token=abc123",
} satisfies TrainingSessionReminderEmailProps;

export default TrainingSessionReminderEmail;
export { TrainingSessionReminderEmail };
