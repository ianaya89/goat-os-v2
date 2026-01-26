import type { Metadata } from "next";
import type * as React from "react";
import { AthleteSignupContent } from "./athlete-signup-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
	title: "Registro de Atleta",
	description: "Crea tu cuenta como atleta en GOAT OS",
};

export default function AthleteSignupPage(): React.JSX.Element {
	return <AthleteSignupContent />;
}
