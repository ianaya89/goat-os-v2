"use client";

import {
	AlertCircleIcon,
	BugIcon,
	CheckCircle2Icon,
	Loader2Icon,
	UploadIcon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

type ImageFile = {
	id: string;
	file: File;
	preview: string;
};

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function FeedbackButton() {
	const t = useTranslations("common.feedback");
	const tCommon = useTranslations("common.buttons");
	const [isOpen, setIsOpen] = React.useState(false);
	const [title, setTitle] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [images, setImages] = React.useState<ImageFile[]>([]);
	const [submitStatus, setSubmitStatus] = React.useState<SubmitStatus>("idle");
	const [isDragging, setIsDragging] = React.useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	// Handle dialog open/close
	const handleOpenChange = (open: boolean) => {
		if (open) {
			// Reset form when opening
			setTitle("");
			setDescription("");
			setImages([]);
			setSubmitStatus("idle");
		}
		setIsOpen(open);
	};

	// Process files (shared between input change and drag/drop)
	const processFiles = (files: FileList | File[]) => {
		const newImages: ImageFile[] = [];

		Array.from(files).forEach((file) => {
			// Check if we've reached the limit
			if (images.length + newImages.length >= MAX_IMAGES) return;

			// Check file type
			if (!ALLOWED_TYPES.includes(file.type)) return;

			// Check file size
			if (file.size > MAX_IMAGE_SIZE) return;

			newImages.push({
				id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
				file,
				preview: URL.createObjectURL(file),
			});
		});

		setImages((prev) => [...prev, ...newImages]);
	};

	// Handle file selection from input
	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files) return;
		processFiles(files);
		// Reset input
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// Drag and drop handlers
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		if (images.length < MAX_IMAGES) {
			setIsDragging(true);
		}
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		if (images.length >= MAX_IMAGES) return;
		const files = e.dataTransfer.files;
		if (files.length > 0) {
			processFiles(files);
		}
	};

	// Remove an image
	const removeImage = (id: string) => {
		setImages((prev) => {
			const image = prev.find((img) => img.id === id);
			if (image) {
				URL.revokeObjectURL(image.preview);
			}
			return prev.filter((img) => img.id !== id);
		});
	};

	// Convert file to base64
	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
		});
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!title.trim() || !description.trim()) return;

		setSubmitStatus("submitting");

		try {
			// Convert images to base64
			const imageDataUrls = await Promise.all(
				images.map((img) => fileToBase64(img.file)),
			);

			const response = await fetch("/api/report-feedback", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim(),
					pageUrl: typeof window !== "undefined" ? window.location.href : "",
					userAgent:
						typeof navigator !== "undefined" ? navigator.userAgent : undefined,
					images: imageDataUrls,
				}),
			});

			if (response.ok) {
				setSubmitStatus("success");
				// Close dialog after a short delay
				setTimeout(() => {
					setIsOpen(false);
				}, 1500);
			} else {
				setSubmitStatus("error");
			}
		} catch {
			setSubmitStatus("error");
		}
	};

	// Cleanup object URLs when component unmounts
	React.useEffect(() => {
		return () => {
			for (const img of images) {
				URL.revokeObjectURL(img.preview);
			}
		};
	}, [images]);

	// Reset error status after timeout
	React.useEffect(() => {
		if (submitStatus !== "error") return;
		const timeoutId = setTimeout(() => setSubmitStatus("idle"), 3000);
		return () => clearTimeout(timeoutId);
	}, [submitStatus]);

	const isSubmitDisabled =
		!title.trim() ||
		!description.trim() ||
		submitStatus === "submitting" ||
		submitStatus === "success";

	const canAddMoreImages = images.length < MAX_IMAGES;

	return (
		<>
			{/* Floating Button */}
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						id="feedback-button"
						type="button"
						onClick={() => handleOpenChange(true)}
						className={cn(
							"fixed bottom-4 right-4 z-50",
							"flex items-center justify-center",
							"size-10 rounded-full",
							"bg-primary text-primary-foreground",
							"shadow-md hover:shadow-lg",
							"transition-all duration-200",
							"hover:scale-105 active:scale-95",
							"focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
						)}
						aria-label={t("buttonLabel")}
					>
						<BugIcon className="size-5" />
					</button>
				</TooltipTrigger>
				<TooltipContent side="left">{t("buttonLabel")}</TooltipContent>
			</Tooltip>

			{/* Feedback Dialog */}
			<Dialog open={isOpen} onOpenChange={handleOpenChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("title")}</DialogTitle>
						<DialogDescription>{t("description")}</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="feedback-title">{t("titleLabel")}</Label>
							<Input
								id="feedback-title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder={t("titlePlaceholder")}
								maxLength={200}
								disabled={submitStatus === "submitting"}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="feedback-description">
								{t("descriptionLabel")}
							</Label>
							<Textarea
								id="feedback-description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder={t("descriptionPlaceholder")}
								rows={4}
								maxLength={5000}
								disabled={submitStatus === "submitting"}
							/>
						</div>

						{/* Images Section */}
						<div className="space-y-2">
							<Label>{t("imagesLabel")}</Label>

							{/* Hidden file input */}
							<input
								ref={fileInputRef}
								type="file"
								accept={ALLOWED_TYPES.join(",")}
								multiple
								onChange={handleFileSelect}
								className="hidden"
								disabled={submitStatus === "submitting"}
							/>

							{/* Image Previews Grid */}
							{images.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{images.map((img) => (
										<div
											key={img.id}
											className="group relative size-20 overflow-hidden rounded-lg border"
										>
											<img
												src={img.preview}
												alt="Preview"
												className="size-full object-cover"
											/>
											<button
												type="button"
												onClick={() => removeImage(img.id)}
												disabled={submitStatus === "submitting"}
												className={cn(
													"absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-destructive",
													submitStatus === "submitting" &&
														"pointer-events-none opacity-50",
												)}
											>
												<XIcon className="size-3" />
											</button>
										</div>
									))}
								</div>
							)}

							{/* Upload Area */}
							{canAddMoreImages && (
								<div
									role="button"
									tabIndex={0}
									onDragOver={handleDragOver}
									onDragLeave={handleDragLeave}
									onDrop={handleDrop}
									onClick={() =>
										submitStatus !== "submitting" &&
										fileInputRef.current?.click()
									}
									onKeyDown={(e) => {
										if (
											(e.key === "Enter" || e.key === " ") &&
											submitStatus !== "submitting"
										) {
											e.preventDefault();
											fileInputRef.current?.click();
										}
									}}
									className={cn(
										"flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
										isDragging
											? "border-primary bg-primary/5"
											: "border-muted-foreground/25 hover:border-muted-foreground/50",
										submitStatus === "submitting" &&
											"pointer-events-none opacity-50",
									)}
								>
									<UploadIcon className="size-8 text-muted-foreground" />
									<div className="text-center">
										<span className="text-sm text-muted-foreground">
											{t("uploadArea")}
										</span>
										<p className="mt-1 text-xs text-muted-foreground/60">
											{t("imagesHint", {
												current: images.length,
												max: MAX_IMAGES,
											})}
										</p>
									</div>
								</div>
							)}
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsOpen(false)}
								disabled={submitStatus === "submitting"}
							>
								{tCommon("cancel")}
							</Button>
							<Button
								type="submit"
								disabled={isSubmitDisabled}
								className={cn(
									submitStatus === "success" &&
										"bg-green-600 hover:bg-green-600",
									submitStatus === "error" &&
										"bg-destructive hover:bg-destructive",
								)}
							>
								{submitStatus === "submitting" && (
									<Loader2Icon className="mr-2 size-4 animate-spin" />
								)}
								{submitStatus === "success" && (
									<CheckCircle2Icon className="mr-2 size-4" />
								)}
								{submitStatus === "error" && (
									<AlertCircleIcon className="mr-2 size-4" />
								)}
								{submitStatus === "submitting"
									? t("submitting")
									: submitStatus === "success"
										? t("success")
										: submitStatus === "error"
											? t("error")
											: t("submit")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
