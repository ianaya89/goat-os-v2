"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import * as React from "react";
import type { ReactCropperElement } from "react-cropper";
import Cropper from "react-cropper";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";

export type CropImageModalProps = NiceModalHocProps & {
	image: File | null;
	onCrop: (croppedImage: Blob | null) => void;
};

export const CropImageModal = NiceModal.create<CropImageModalProps>(
	({ image, onCrop }) => {
		const modal = useEnhancedModal();
		const cropperRef = React.useRef<ReactCropperElement>(null);
		const [imageSrc, setImageSrc] = React.useState<string | null>(null);
		const imageUrlRef = React.useRef<string | null>(null);

		const getCroppedImage = async () => {
			const cropper = cropperRef.current?.cropper;

			const imageBlob = await new Promise<Blob | null>((resolve) => {
				cropper
					?.getCroppedCanvas({
						maxWidth: 256,
						maxHeight: 256,
					})
					.toBlob(resolve);
			});

			return imageBlob;
		};

		// Create blob URL when image changes
		React.useEffect(() => {
			if (image) {
				// Revoke previous URL if exists
				if (imageUrlRef.current) {
					URL.revokeObjectURL(imageUrlRef.current);
				}
				const url = URL.createObjectURL(image);
				imageUrlRef.current = url;
				setImageSrc(url);
			}

			// Cleanup on unmount only
			return () => {
				if (imageUrlRef.current) {
					URL.revokeObjectURL(imageUrlRef.current);
					imageUrlRef.current = null;
				}
			};
		}, [image]);

		return (
			<Dialog open={modal.visible}>
				<DialogContent
					className="max-w-xl"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
					onClose={modal.handleClose}
				>
					<DialogHeader>
						<DialogTitle />
					</DialogHeader>
					<div>
						{imageSrc && (
							<Cropper
								aspectRatio={1}
								guides={true}
								initialAspectRatio={1}
								ref={cropperRef}
								src={imageSrc}
								style={{ width: "100%" }}
							/>
						)}
					</div>
					<DialogFooter>
						<Button onClick={modal.handleClose} type="button" variant="outline">
							Cancel
						</Button>
						<Button
							onClick={async () => {
								onCrop(await getCroppedImage());
								modal.handleClose();
							}}
							type="button"
						>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
);
