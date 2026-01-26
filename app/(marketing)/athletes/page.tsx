import type { Metadata } from "next";
import { AthletesSearchSection } from "@/components/marketing/sections/athletes-search-section";

export const metadata: Metadata = {
	title: "Atletas | Buscar Talentos Deportivos",
	description:
		"Descubre atletas en busca de oportunidades: equipos profesionales, becas universitarias, pruebas, sponsorships y coaching.",
	openGraph: {
		title: "Atletas | Buscar Talentos Deportivos",
		description: "Conecta con atletas en busca de oportunidades deportivas.",
		type: "website",
	},
};

export default function AthletesSearchPage() {
	return <AthletesSearchSection />;
}
