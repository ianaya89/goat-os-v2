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

export type AthleteWelcomeEmailProps = {
	appName: string;
	athleteName: string;
	organizationName: string;
	loginUrl: string;
	forgotPasswordUrl: string;
};

function AthleteWelcomeEmail({
	appName,
	athleteName,
	organizationName,
	loginUrl,
	forgotPasswordUrl,
}: AthleteWelcomeEmailProps): React.JSX.Element {
	return (
		<Html>
			<Head />
			<Preview>
				Welcome to {organizationName} on {appName}
			</Preview>
			<Tailwind>
				<Body className="m-auto bg-white px-2 font-sans">
					<Container className="mx-auto my-[40px] max-w-[465px] rounded-sm border border-[#eaeaea] border-solid p-[20px]">
						<Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
							Welcome to <strong>{organizationName}</strong>
						</Heading>
						<Text className="text-[14px] text-black leading-[24px]">
							Hello {athleteName},
						</Text>
						<Text className="text-[14px] text-black leading-[24px]">
							You have been added as an <strong>Athlete</strong> to the{" "}
							<strong>{organizationName}</strong> organization on{" "}
							<strong>{appName}</strong>.
						</Text>
						<Text className="text-[14px] text-black leading-[24px]">
							An account has been created for you. To access the platform,
							please set your password by following these steps:
						</Text>
						<Text className="text-[14px] text-black leading-[24px]">
							1. Click the button below to go to the password reset page
							<br />
							2. Enter your email address and submit
							<br />
							3. Check your inbox for the password reset link
							<br />
							4. Set your new password
						</Text>
						<Section className="my-[32px] text-center">
							<Button
								href={forgotPasswordUrl}
								className="rounded-sm bg-[#000000] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
							>
								Set Your Password
							</Button>
						</Section>
						<Text className="text-[14px] text-black leading-[24px]">
							or copy and paste this URL into your browser:{" "}
							<Link
								href={forgotPasswordUrl}
								className="break-all text-blue-600 no-underline"
							>
								{forgotPasswordUrl}
							</Link>
						</Text>
						<Text className="text-[14px] text-black leading-[24px]">
							After setting your password, you can log in at:{" "}
							<Link
								href={loginUrl}
								className="break-all text-blue-600 no-underline"
							>
								{loginUrl}
							</Link>
						</Text>
						<Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
						<Text className="text-[#666666] text-[12px] leading-[24px]">
							If you were not expecting this email, please contact your
							organization administrator.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

AthleteWelcomeEmail.PreviewProps = {
	appName: "Acme",
	athleteName: "Jane Doe",
	organizationName: "Sports Academy",
	loginUrl: "https://example.com/auth/sign-in",
	forgotPasswordUrl: "https://example.com/auth/forgot-password",
} satisfies AthleteWelcomeEmailProps;

export default AthleteWelcomeEmail;
export { AthleteWelcomeEmail };
