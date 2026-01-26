"use client";

import NiceModal from "@ebay/nice-modal-react";
import {
	FacebookIcon,
	InstagramIcon,
	LinkedinIcon,
	Share2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { Field } from "@/components/ui/field";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

// TikTok icon component
function TiktokIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
		</svg>
	);
}

// Twitter/X icon component
function TwitterIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
		</svg>
	);
}

const socialMediaSchema = z.object({
	socialInstagram: z.string().trim().max(100).optional().nullable(),
	socialTwitter: z.string().trim().max(100).optional().nullable(),
	socialTiktok: z.string().trim().max(100).optional().nullable(),
	socialLinkedin: z.string().trim().max(500).optional().nullable(),
	socialFacebook: z.string().trim().max(500).optional().nullable(),
});

type SocialMediaFormData = z.infer<typeof socialMediaSchema>;

interface AthleteSocialEditModalProps {
	socialInstagram: string | null;
	socialTwitter: string | null;
	socialTiktok: string | null;
	socialLinkedin: string | null;
	socialFacebook: string | null;
}

// Social platform config for styling
const socialPlatforms = {
	instagram: {
		icon: InstagramIcon,
		color: "from-pink-500 to-purple-500",
		bgColor: "bg-gradient-to-br from-pink-500/10 to-purple-500/10",
		borderColor: "focus-within:border-pink-400",
	},
	twitter: {
		icon: TwitterIcon,
		color: "from-zinc-600 to-zinc-900",
		bgColor: "bg-zinc-100 dark:bg-zinc-800",
		borderColor: "focus-within:border-zinc-400",
	},
	tiktok: {
		icon: TiktokIcon,
		color: "from-zinc-900 to-zinc-700",
		bgColor: "bg-zinc-100 dark:bg-zinc-800",
		borderColor: "focus-within:border-zinc-400",
	},
	linkedin: {
		icon: LinkedinIcon,
		color: "from-blue-600 to-blue-700",
		bgColor: "bg-blue-50 dark:bg-blue-950/30",
		borderColor: "focus-within:border-blue-400",
	},
	facebook: {
		icon: FacebookIcon,
		color: "from-blue-500 to-blue-600",
		bgColor: "bg-blue-50 dark:bg-blue-950/30",
		borderColor: "focus-within:border-blue-400",
	},
};

export const AthleteSocialEditModal = NiceModal.create(
	({
		socialInstagram,
		socialTwitter,
		socialTiktok,
		socialLinkedin,
		socialFacebook,
	}: AthleteSocialEditModalProps) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: socialMediaSchema,
			defaultValues: {
				socialInstagram: socialInstagram ?? "",
				socialTwitter: socialTwitter ?? "",
				socialTiktok: socialTiktok ?? "",
				socialLinkedin: socialLinkedin ?? "",
				socialFacebook: socialFacebook ?? "",
			},
		});

		const updateMutation = trpc.athlete.updateMyProfile.useMutation({
			onSuccess: () => {
				toast.success("Redes sociales actualizadas");
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar");
			},
		});

		const onSubmit = form.handleSubmit((data: SocialMediaFormData) => {
			updateMutation.mutate({
				socialInstagram: data.socialInstagram || null,
				socialTwitter: data.socialTwitter || null,
				socialTiktok: data.socialTiktok || null,
				socialLinkedin: data.socialLinkedin || null,
				socialFacebook: data.socialFacebook || null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title="Redes Sociales"
				subtitle="Conecta tus perfiles para aumentar tu visibilidad"
				icon={<Share2Icon className="size-5" />}
				accentColor="rose"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection
						title="Perfiles principales"
						description="Agrega tu nombre de usuario sin @"
					>
						<div className="space-y-4">
							<FormField
								control={form.control}
								name="socialInstagram"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<div
												className={cn(
													"flex items-center gap-3 rounded-xl border-2 p-3 transition-colors",
													socialPlatforms.instagram.bgColor,
													socialPlatforms.instagram.borderColor,
												)}
											>
												<div
													className={cn(
														"flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
														socialPlatforms.instagram.color,
													)}
												>
													<InstagramIcon className="size-5" />
												</div>
												<div className="flex-1 space-y-1">
													<FormLabel className="text-sm">Instagram</FormLabel>
													<FormControl>
														<Input
															placeholder="tu_usuario"
															className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
															{...field}
															value={field.value ?? ""}
														/>
													</FormControl>
												</div>
											</div>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="socialTwitter"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<div
												className={cn(
													"flex items-center gap-3 rounded-xl border-2 p-3 transition-colors",
													socialPlatforms.twitter.bgColor,
													socialPlatforms.twitter.borderColor,
												)}
											>
												<div
													className={cn(
														"flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
														socialPlatforms.twitter.color,
													)}
												>
													<TwitterIcon className="size-5" />
												</div>
												<div className="flex-1 space-y-1">
													<FormLabel className="text-sm">X (Twitter)</FormLabel>
													<FormControl>
														<Input
															placeholder="tu_usuario"
															className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
															{...field}
															value={field.value ?? ""}
														/>
													</FormControl>
												</div>
											</div>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="socialTiktok"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<div
												className={cn(
													"flex items-center gap-3 rounded-xl border-2 p-3 transition-colors",
													socialPlatforms.tiktok.bgColor,
													socialPlatforms.tiktok.borderColor,
												)}
											>
												<div
													className={cn(
														"flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
														socialPlatforms.tiktok.color,
													)}
												>
													<TiktokIcon className="size-5" />
												</div>
												<div className="flex-1 space-y-1">
													<FormLabel className="text-sm">TikTok</FormLabel>
													<FormControl>
														<Input
															placeholder="tu_usuario"
															className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
															{...field}
															value={field.value ?? ""}
														/>
													</FormControl>
												</div>
											</div>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</div>
					</ProfileEditSection>

					<ProfileEditSection
						title="Perfiles profesionales"
						description="Agrega la URL completa de tu perfil"
					>
						<div className="space-y-4">
							<FormField
								control={form.control}
								name="socialLinkedin"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<div
												className={cn(
													"flex items-center gap-3 rounded-xl border-2 p-3 transition-colors",
													socialPlatforms.linkedin.bgColor,
													socialPlatforms.linkedin.borderColor,
												)}
											>
												<div
													className={cn(
														"flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
														socialPlatforms.linkedin.color,
													)}
												>
													<LinkedinIcon className="size-5" />
												</div>
												<div className="flex-1 space-y-1">
													<FormLabel className="text-sm">LinkedIn</FormLabel>
													<FormControl>
														<Input
															placeholder="https://linkedin.com/in/tu-perfil"
															className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
															{...field}
															value={field.value ?? ""}
														/>
													</FormControl>
												</div>
											</div>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="socialFacebook"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<div
												className={cn(
													"flex items-center gap-3 rounded-xl border-2 p-3 transition-colors",
													socialPlatforms.facebook.bgColor,
													socialPlatforms.facebook.borderColor,
												)}
											>
												<div
													className={cn(
														"flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
														socialPlatforms.facebook.color,
													)}
												>
													<FacebookIcon className="size-5" />
												</div>
												<div className="flex-1 space-y-1">
													<FormLabel className="text-sm">Facebook</FormLabel>
													<FormControl>
														<Input
															placeholder="https://facebook.com/tu-perfil"
															className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
															{...field}
															value={field.value ?? ""}
														/>
													</FormControl>
												</div>
											</div>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</div>
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	},
);
