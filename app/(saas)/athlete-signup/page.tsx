import type { Metadata } from "next";
import type * as React from "react";
import { AthleteSignupContent } from "./athlete-signup-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
	title: "Registro de Atleta",
	description: "Crea tu cuenta como atleta en GOAT OS",
};

type AthleteSignupPageProps = {
	searchParams: Promise<{
		[key: string]: string | string[] | undefined;
		token?: string;
	}>;
};

export default async function AthleteSignupPage({
	searchParams,
}: AthleteSignupPageProps): Promise<React.JSX.Element> {
	const params = await searchParams;
	return <AthleteSignupContent token={params.token} />;
}
