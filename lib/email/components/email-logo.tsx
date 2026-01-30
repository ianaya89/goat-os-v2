import { Img } from "@react-email/components";
import type * as React from "react";

export type EmailLogoProps = {
	/** URL absoluta de la imagen del logo */
	src: string;
	size?: number;
	className?: string;
};

export function EmailLogo({
	src,
	size = 32,
	className,
}: EmailLogoProps): React.JSX.Element {
	return (
		<Img
			src={src}
			width={size}
			height={size}
			alt="GOAT OS"
			className={className}
		/>
	);
}
