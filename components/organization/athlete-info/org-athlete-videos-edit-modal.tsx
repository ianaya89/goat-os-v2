"use client";

import NiceModal from "@ebay/nice-modal-react";
import {
	CheckIcon,
	ExternalLinkIcon,
	PlayIcon,
	PlusIcon,
	VideoIcon,
	XIcon,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
	ProfileEditEmpty,
	ProfileEditItem,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { trpc } from "@/trpc/client";

// Helper function to extract YouTube video ID
function getYoutubeVideoId(url: string): string | null {
	const match = url.match(
		/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/,
	);
	return match?.[1] ?? null;
}

// Validate if URL is a valid YouTube URL
function isValidYoutubeUrl(url: string): boolean {
	return !!getYoutubeVideoId(url);
}

interface OrgAthleteVideosEditModalProps {
	athleteId: string;
	videos: string[];
}

export const OrgAthleteVideosEditModal = NiceModal.create(
	({ athleteId, videos: initialVideos }: OrgAthleteVideosEditModalProps) => {
		const t = useTranslations("athletes");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const [videos, setVideos] = useState<string[]>(initialVideos ?? []);
		const [newVideoUrl, setNewVideoUrl] = useState("");

		const updateMutation = trpc.organization.athlete.update.useMutation({
			onSuccess: () => {
				toast.success(t("success.updated"));
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.updateFailed"));
			},
		});

		const handleAddVideo = () => {
			const url = newVideoUrl.trim();
			if (!url) {
				toast.error(t("editForm.videosEnterUrl"));
				return;
			}
			if (!isValidYoutubeUrl(url)) {
				toast.error(t("editForm.videosInvalidUrl"));
				return;
			}
			if (videos.includes(url)) {
				toast.error(t("editForm.videosDuplicate"));
				return;
			}
			if (videos.length >= 10) {
				toast.error(t("editForm.videosMaxReached"));
				return;
			}
			setVideos([...videos, url]);
			setNewVideoUrl("");
		};

		const handleRemoveVideo = (index: number) => {
			setVideos(videos.filter((_, i) => i !== index));
		};

		const handleSave = () => {
			updateMutation.mutate({
				id: athleteId,
				youtubeVideos: videos,
			});
		};

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("info.editVideos")}
				subtitle={t("editForm.videosSubtitle")}
				icon={<VideoIcon className="size-5" />}
				accentColor="slate"
				maxWidth="lg"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
				customFooter={
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground text-sm">
							{videos.length}/10 videos
						</span>
						<div className="flex gap-3">
							<Button
								variant="ghost"
								onClick={modal.handleClose}
								className="min-w-[100px]"
							>
								<XIcon className="size-4" />
								{t("editForm.cancel")}
							</Button>
							<Button
								onClick={handleSave}
								disabled={updateMutation.isPending}
								loading={updateMutation.isPending}
								className="min-w-[100px]"
							>
								<CheckIcon className="size-4" />
								{t("editForm.save")}
							</Button>
						</div>
					</div>
				}
			>
				<div className="space-y-6">
					{/* Add new video */}
					<ProfileEditSection
						title={t("editForm.videosAddTitle")}
						description={t("editForm.videosAddDescription")}
					>
						<div className="flex gap-2">
							<div className="relative flex-1">
								<Input
									placeholder="https://www.youtube.com/watch?v=..."
									value={newVideoUrl}
									onChange={(e) => setNewVideoUrl(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											handleAddVideo();
										}
									}}
									className="pr-10"
								/>
								{newVideoUrl && isValidYoutubeUrl(newVideoUrl) && (
									<div className="absolute top-1/2 right-3 -translate-y-1/2">
										<div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
											<CheckIcon className="size-3" />
										</div>
									</div>
								)}
							</div>
							<Button
								type="button"
								onClick={handleAddVideo}
								disabled={videos.length >= 10 || !newVideoUrl.trim()}
							>
								<PlusIcon className="size-4" />
							</Button>
						</div>
					</ProfileEditSection>

					{/* Video list */}
					{videos.length > 0 ? (
						<ProfileEditSection
							title={`${t("editForm.videosMyVideos")} (${videos.length})`}
						>
							<AnimatePresence mode="popLayout">
								{videos.map((url, index) => {
									const videoId = getYoutubeVideoId(url);
									return (
										<ProfileEditItem
											key={url}
											onRemove={() => handleRemoveVideo(index)}
											className="p-2"
										>
											<div className="flex items-center gap-3">
												{videoId ? (
													<div className="group relative shrink-0 overflow-hidden rounded-lg">
														<img
															src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
															alt={`Video ${index + 1}`}
															className="h-16 w-28 object-cover transition-transform group-hover:scale-105"
														/>
														<div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
															<div className="flex size-8 items-center justify-center rounded-full bg-red-600 text-white">
																<PlayIcon className="size-4" />
															</div>
														</div>
													</div>
												) : (
													<div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-muted">
														<VideoIcon className="size-6 text-muted-foreground" />
													</div>
												)}
												<div className="min-w-0 flex-1 space-y-1">
													<p className="truncate font-medium text-sm">
														Video {index + 1}
													</p>
													<a
														href={url}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-primary"
													>
														<span className="truncate max-w-[200px]">
															{url}
														</span>
														<ExternalLinkIcon className="size-3 shrink-0" />
													</a>
												</div>
											</div>
										</ProfileEditItem>
									);
								})}
							</AnimatePresence>
						</ProfileEditSection>
					) : (
						<ProfileEditEmpty
							icon={<VideoIcon className="size-12" />}
							title={t("editForm.videosEmptyTitle")}
							description={t("editForm.videosEmptyDescription")}
						/>
					)}

					{/* Tips */}
					<div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/30">
						<h4 className="mb-2 font-medium text-slate-700 text-sm dark:text-slate-300">
							{t("editForm.videosTipsTitle")}
						</h4>
						<ul className="space-y-1 text-slate-600 text-xs dark:text-slate-400">
							<li className="flex items-start gap-2">
								<span className="mt-0.5">•</span>
								<span>{t("editForm.videosTip1")}</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-0.5">•</span>
								<span>{t("editForm.videosTip2")}</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-0.5">•</span>
								<span>{t("editForm.videosTip3")}</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-0.5">•</span>
								<span>{t("editForm.videosTip4")}</span>
							</li>
						</ul>
					</div>
				</div>
			</ProfileEditSheet>
		);
	},
);
