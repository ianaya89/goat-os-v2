import { Button } from "@react-email/components";
import type * as React from "react";
import { BRAND_COLORS } from "./base-email-layout";

export type EmailButtonProps = {
	href: string;
	children: React.ReactNode;
};

export function EmailButton({
	href,
	children,
}: EmailButtonProps): React.JSX.Element {
	return (
		<Button
			href={href}
			className="rounded-md px-6 py-3 text-center font-semibold text-[14px] no-underline"
			style={{
				backgroundColor: BRAND_COLORS.primary,
				color: BRAND_COLORS.primaryText,
			}}
		>
			{children}
		</Button>
	);
}
