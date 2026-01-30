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
import { EmailLogo } from "./email-logo";

// Colores de marca
export const BRAND_COLORS = {
	primary: "#00237c",
	primaryText: "#ffffff",
	bodyText: "#000000",
	footerText: "#666666",
	link: "#2563eb",
	border: "#eaeaea",
	infoBox: "#f9f9f9",
} as const;

export type BaseEmailLayoutProps = {
	/** Texto de preview que aparece en el inbox */
	preview: string;
	/** Titulo principal del email */
	heading: string;
	/** Contenido del email */
	children: React.ReactNode;
	/** Texto del footer */
	footerText?: string;
	/** Ancho del contenedor: default (465px) o wide (600px) */
	width?: "default" | "wide";
	/** Nombre de la app */
	appName?: string;
	/** URL absoluta del logo (ej: https://app.goatos.com/logo-white.png) */
	logoUrl?: string;
};

export function BaseEmailLayout({
	preview,
	heading,
	children,
	footerText,
	width = "default",
	appName = "GOAT OS",
	logoUrl,
}: BaseEmailLayoutProps): React.JSX.Element {
	const containerWidth = width === "wide" ? "600px" : "465px";

	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Tailwind>
				<Body className="m-auto bg-white px-2 font-sans">
					<Container
						className="mx-auto my-[40px] overflow-hidden rounded-lg border border-[#eaeaea] border-solid"
						style={{ maxWidth: containerWidth }}
					>
						{/* Header con logo */}
						<Section
							className="px-[20px] py-[16px]"
							style={{ backgroundColor: BRAND_COLORS.primary }}
						>
							<table cellPadding="0" cellSpacing="0" width="100%">
								<tr>
									<td style={{ verticalAlign: "middle" }}>
										<table cellPadding="0" cellSpacing="0">
											<tr>
												{logoUrl && (
													<td
														style={{
															verticalAlign: "middle",
															paddingRight: "10px",
														}}
													>
														<EmailLogo src={logoUrl} size={28} />
													</td>
												)}
												<td style={{ verticalAlign: "middle" }}>
													<Text
														className="m-0 font-semibold text-[16px]"
														style={{ color: BRAND_COLORS.primaryText }}
													>
														{appName}
													</Text>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
						</Section>

						{/* Contenido principal */}
						<Section className="p-[20px]">
							<Heading className="mx-0 mt-[20px] mb-[24px] p-0 text-center font-semibold text-[22px] text-black">
								{heading}
							</Heading>
							{children}
						</Section>

						{/* Footer */}
						{footerText && (
							<>
								<Hr className="mx-[20px] my-0 border border-[#eaeaea] border-solid" />
								<Section className="px-[20px] py-[16px]">
									<Text className="m-0 text-[#666666] text-[12px] leading-[20px]">
										{footerText}
									</Text>
								</Section>
							</>
						)}
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
