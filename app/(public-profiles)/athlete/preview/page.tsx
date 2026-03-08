import type { Metadata } from "next";
import { MOCK_ATHLETE_DATA } from "@/components/public/athlete-profile/mock-athlete-data";
import { PublicAthleteProfile } from "@/components/public/athlete-profile/public-athlete-profile";

export const metadata: Metadata = {
	title: "Preview - Catalina Domínguez Etcheverry",
	description: "Mock athlete public profile for testing",
};

export default function AthletePreviewPage() {
	return <PublicAthleteProfile data={MOCK_ATHLETE_DATA} />;
}
