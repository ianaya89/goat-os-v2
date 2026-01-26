"use client";

import NiceModal from "@ebay/nice-modal-react";
import {
	ExternalLinkIcon,
	Loader2Icon,
	PlayIcon,
	PlusIcon,
	VideoIcon,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
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
import { cn } from "@/lib/utils";
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

interface AthleteVideosEditModalProps {
	videos: string[];
}

export const AthleteVideosEditModal = NiceModal.create(
	({ videos: initialVideos }: AthleteVideosEditModalProps) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const [videos, setVideos] = useState<string[]>(initialVideos ?? []);
		const [newVideoUrl, setNewVideoUrl] = useState("");

		const updateMutation = trpc.athlete.updateMyProfile.useMutation({
			onSuccess: () => {
				toast.success("Videos actualizados");
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar");
			},
		});

		const handleAddVideo = () => {
			const url = newVideoUrl.trim();
			if (!url) {
				toast.error("Ingresa una URL");
				return;
			}
			if (!isValidYoutubeUrl(url)) {
				toast.error("La URL no es un video de YouTube valido");
				return;
			}
			if (videos.includes(url)) {
				toast.error("Este video ya esta agregado");
				return;
			}
			if (videos.length >= 10) {
				toast.error("Maximo 10 videos permitidos");
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
				youtubeVideos: videos,
			});
		};

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title="Videos Destacados"
				subtitle="Muestra tus mejores jugadas y momentos"
				icon={<VideoIcon className="size-5" />}
				accentColor="amber"
				maxWidth="lg"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
				customFooter={
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground text-sm">
							{videos.length}/10 videos
						</span>
						<div className="flex gap-3">
							<Button variant="ghost" onClick={modal.handleClose}>
								Cancelar
							</Button>
							<Button
								onClick={handleSave}
								disabled={updateMutation.isPending}
								loading={updateMutation.isPending}
							>
								Guardar
							</Button>
						</div>
					</div>
				}
			>
				<div className="space-y-6">
					{/* Add new video */}
					<ProfileEditSection
						title="Agregar video"
						description="Pega el enlace de un video de YouTube"
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
										<div className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white">
											<svg
												className="size-3"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth={3}
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M5 13l4 4L19 7"
												/>
											</svg>
										</div>
									</div>
								)}
							</div>
							<Button
								type="button"
								onClick={handleAddVideo}
								disabled={videos.length >= 10 || !newVideoUrl.trim()}
								className="bg-amber-500 hover:bg-amber-600"
							>
								<PlusIcon className="size-4" />
							</Button>
						</div>
					</ProfileEditSection>

					{/* Video list */}
					{videos.length > 0 ? (
						<ProfileEditSection title={`Mis videos (${videos.length})`}>
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
							title="No hay videos agregados"
							description="Los videos de YouTube ayudan a scouts y reclutadores a ver tu talento"
						/>
					)}

					{/* Tips */}
					<div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
						<h4 className="mb-2 font-medium text-amber-800 text-sm dark:text-amber-300">
							Consejos para mejores videos
						</h4>
						<ul className="space-y-1 text-amber-700 text-xs dark:text-amber-400">
							<li className="flex items-start gap-2">
								<span className="mt-0.5">•</span>
								<span>
									Sube compilaciones de tus mejores jugadas (highlights)
								</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-0.5">•</span>
								<span>Incluye partidos completos donde te destacas</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-0.5">•</span>
								<span>Asegurate de que la calidad del video sea buena</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-0.5">•</span>
								<span>
									Agrega tu nombre y posicion en la descripcion del video
								</span>
							</li>
						</ul>
					</div>
				</div>
			</ProfileEditSheet>
		);
	},
);
