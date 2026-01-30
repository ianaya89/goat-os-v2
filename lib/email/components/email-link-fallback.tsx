import { Link, Text } from "@react-email/components";
import type * as React from "react";
import { BRAND_COLORS } from "./base-email-layout";

export type EmailLinkFallbackProps = {
	href: string;
	label: string;
};

export function EmailLinkFallback({
	href,
	label,
}: EmailLinkFallbackProps): React.JSX.Element {
	return (
		<Text className="text-[14px] text-black leading-[24px]">
			{label}{" "}
			<Link
				href={href}
				className="break-all no-underline"
				style={{ color: BRAND_COLORS.link }}
			>
				{href}
			</Link>
		</Text>
	);
}
