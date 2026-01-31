import { Section, Text } from "@react-email/components";
import type * as React from "react";
import { BaseEmailLayout, BRAND_COLORS } from "../components";

export type ErrorReportEmailProps = {
	appName: string;
	errorMessage: string;
	errorDigest?: string;
	errorUrl: string;
	errorDate: string;
	errorTime: string;
	userAgent?: string;
	logoUrl?: string;
};

function ErrorReportEmail({
	appName,
	errorMessage,
	errorDigest,
	errorUrl,
	errorDate,
	errorTime,
	userAgent,
	logoUrl,
}: ErrorReportEmailProps): React.JSX.Element {
	const preview = `Error Report: ${errorMessage.slice(0, 50)}${errorMessage.length > 50 ? "..." : ""}`;

	return (
		<BaseEmailLayout
			preview={preview}
			heading="Error Report"
			footerText={`This is an automated error report from ${appName}.`}
			appName={appName}
			logoUrl={logoUrl}
		>
			<Text className="text-[14px] text-black leading-[24px]">
				A user has reported an application error. Details below:
			</Text>

			{/* Error Details */}
			<Section
				className="my-[24px] rounded-md border border-solid p-[16px]"
				style={{
					backgroundColor: BRAND_COLORS.infoBox,
					borderColor: BRAND_COLORS.border,
				}}
			>
				<Text className="m-0 text-[14px] text-black leading-[24px]">
					<strong>Error Message:</strong>
				</Text>
				<Text
					className="m-0 mt-[4px] font-mono text-[13px] text-black leading-[20px]"
					style={{ wordBreak: "break-word" }}
				>
					{errorMessage}
				</Text>

				{errorDigest && (
					<>
						<Text className="m-0 mt-[16px] text-[14px] text-black leading-[24px]">
							<strong>Error ID (Digest):</strong>
						</Text>
						<Text className="m-0 mt-[4px] font-mono text-[13px] text-black leading-[20px]">
							{errorDigest}
						</Text>
					</>
				)}

				<Text className="m-0 mt-[16px] text-[14px] text-black leading-[24px]">
					<strong>URL:</strong>
				</Text>
				<Text
					className="m-0 mt-[4px] font-mono text-[13px] leading-[20px]"
					style={{ color: BRAND_COLORS.link, wordBreak: "break-all" }}
				>
					{errorUrl}
				</Text>

				<Text className="m-0 mt-[16px] text-[14px] text-black leading-[24px]">
					<strong>Date:</strong> {errorDate}
				</Text>

				<Text className="m-0 mt-[4px] text-[14px] text-black leading-[24px]">
					<strong>Time:</strong> {errorTime}
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

			<Text className="text-[14px] text-black leading-[24px]">
				Please investigate this error. You can search for the Error ID in Sentry
				or your error tracking system for more details.
			</Text>
		</BaseEmailLayout>
	);
}

ErrorReportEmail.PreviewProps = {
	appName: "GOAT OS",
	errorMessage: "Cannot read properties of undefined (reading 'map')",
	errorDigest: "abc123def456",
	errorUrl: "https://app.goatos.com/dashboard/organization/training",
	errorDate: "2026-01-31",
	errorTime: "15:30:45",
	userAgent:
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
} satisfies ErrorReportEmailProps;

export default ErrorReportEmail;
export { ErrorReportEmail };
