import { Section, Text } from "@react-email/components";
import type * as React from "react";
import { BaseEmailLayout, BRAND_COLORS } from "../components";

export type FeedbackReportEmailProps = {
	appName: string;
	title: string;
	description: string;
	pageUrl: string;
	reportDate: string;
	reportTime: string;
	userAgent?: string;
	images?: string[];
	imageCount?: number;
	logoUrl?: string;
};

function FeedbackReportEmail({
	appName,
	title,
	description,
	pageUrl,
	reportDate,
	reportTime,
	userAgent,
	imageCount = 0,
	logoUrl,
}: FeedbackReportEmailProps): React.JSX.Element {
	const preview = `Feedback: ${title.slice(0, 50)}${title.length > 50 ? "..." : ""}`;

	return (
		<BaseEmailLayout
			preview={preview}
			heading="Feedback Report"
			footerText={`This is a feedback report from ${appName}.`}
			appName={appName}
			logoUrl={logoUrl}
			width="wide"
		>
			<Text className="text-[14px] text-black leading-[24px]">
				A user has submitted feedback. Details below:
			</Text>

			{/* Feedback Details */}
			<Section
				className="my-[24px] rounded-md border border-solid p-[16px]"
				style={{
					backgroundColor: BRAND_COLORS.infoBox,
					borderColor: BRAND_COLORS.border,
				}}
			>
				<Text className="m-0 text-[14px] text-black leading-[24px]">
					<strong>Title:</strong>
				</Text>
				<Text
					className="m-0 mt-[4px] text-[14px] text-black leading-[20px]"
					style={{ wordBreak: "break-word" }}
				>
					{title}
				</Text>

				<Text className="m-0 mt-[16px] text-[14px] text-black leading-[24px]">
					<strong>Description:</strong>
				</Text>
				<Text
					className="m-0 mt-[4px] text-[14px] text-black leading-[20px] whitespace-pre-wrap"
					style={{ wordBreak: "break-word" }}
				>
					{description}
				</Text>

				<Text className="m-0 mt-[16px] text-[14px] text-black leading-[24px]">
					<strong>Page URL:</strong>
				</Text>
				<Text
					className="m-0 mt-[4px] font-mono text-[13px] leading-[20px]"
					style={{ color: BRAND_COLORS.link, wordBreak: "break-all" }}
				>
					{pageUrl}
				</Text>

				<Text className="m-0 mt-[16px] text-[14px] text-black leading-[24px]">
					<strong>Date:</strong> {reportDate}
				</Text>

				<Text className="m-0 mt-[4px] text-[14px] text-black leading-[24px]">
					<strong>Time:</strong> {reportTime}
				</Text>

				{userAgent && (
					<>
						<Text className="m-0 mt-[16px] text-[14px] text-black leading-[24px]">
							<strong>User Agent:</strong>
						</Text>
						<Text
							className="m-0 mt-[4px] text-[12px] leading-[18px]"
							style={{
								color: BRAND_COLORS.footerText,
								wordBreak: "break-word",
							}}
						>
							{userAgent}
						</Text>
					</>
				)}
			</Section>

			{/* Attached Images Notice */}
			{imageCount > 0 && (
				<Section
					className="my-[24px] rounded-md border border-solid p-[12px]"
					style={{
						backgroundColor: "#f0f9ff",
						borderColor: "#bae6fd",
					}}
				>
					<Text className="m-0 text-[14px] text-black leading-[24px]">
						<strong>Attached Images:</strong> {imageCount}{" "}
						{imageCount === 1 ? "image" : "images"} attached to this email.
					</Text>
				</Section>
			)}
		</BaseEmailLayout>
	);
}

FeedbackReportEmail.PreviewProps = {
	appName: "GOAT OS",
	title: "Button not working on mobile",
	description:
		"When I try to click the submit button on my iPhone, nothing happens. I've tried multiple times and refreshed the page but it still doesn't work.",
	pageUrl: "https://app.goatos.com/dashboard/organization/training",
	reportDate: "2026-01-31",
	reportTime: "15:30:45",
	userAgent:
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
	imageCount: 2,
} satisfies FeedbackReportEmailProps;

export default FeedbackReportEmail;
export { FeedbackReportEmail };
