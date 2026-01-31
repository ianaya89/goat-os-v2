"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { HistoryIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { trpc } from "@/trpc/client";

export type ServicePriceHistoryModalProps = NiceModalHocProps & {
	service: {
		id: string;
		name: string;
		currency: string;
	};
};

export const ServicePriceHistoryModal =
	NiceModal.create<ServicePriceHistoryModalProps>(({ service }) => {
		const modal = useEnhancedModal();
		const t = useTranslations("finance.services.priceHistory");

		const { data: history, isLoading } =
			trpc.organization.service.getPriceHistory.useQuery({
				serviceId: service.id,
				limit: 50,
			});

		const formatPrice = (price: number) => {
			return new Intl.NumberFormat("es-AR", {
				style: "currency",
				currency: service.currency,
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
			}).format(price / 100);
		};

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<SheetContent
					className="sm:max-w-md"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
					hideDefaultHeader
				>
					<SheetTitle className="sr-only">{t("title")}</SheetTitle>
					{/* Custom Header with accent stripe */}
					<div className="relative shrink-0">
						{/* Accent stripe */}
						<div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-500" />

						{/* Header content */}
						<div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
							<div className="flex items-start gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-sm">
									<HistoryIcon className="size-5" />
								</div>
								<div>
									<h2 className="font-semibold text-lg tracking-tight">
										{t("title")}
									</h2>
									<p className="mt-0.5 text-muted-foreground text-sm">
										{t("subtitle")} — {service.name}
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={modal.handleClose}
								className="flex size-8 items-center justify-center rounded-lg transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<XIcon className="size-4" />
								<span className="sr-only">Cerrar</span>
							</button>
						</div>

						{/* Separator */}
						<div className="h-px bg-border" />
					</div>

					<ScrollArea className="flex-1 px-6 py-4">
						{isLoading ? (
							<div className="space-y-3">
								{Array.from({ length: 5 }).map((_, i) => (
									<Skeleton key={i} className="h-16 w-full" />
								))}
							</div>
						) : !history || history.length === 0 ? (
							<div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
								{t("noHistory")}
							</div>
						) : (
							<div className="space-y-3">
								{history.map((entry, index) => (
									<div
										key={entry.id}
										className="rounded-md border p-3 space-y-1"
									>
										<div className="flex items-center justify-between">
											<span className="font-medium">
												{formatPrice(entry.price)}
											</span>
											{index === 0 && !entry.effectiveUntil && (
												<Badge variant="default" className="text-xs">
													{t("current")}
												</Badge>
											)}
										</div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<span>
												{t("effectiveFrom")}:{" "}
												{format(new Date(entry.effectiveFrom), "dd MMM yyyy", {
													locale: es,
												})}
											</span>
											{entry.effectiveUntil && (
												<span>
													— {t("effectiveUntil")}:{" "}
													{format(
														new Date(entry.effectiveUntil),
														"dd MMM yyyy",
														{ locale: es },
													)}
												</span>
											)}
										</div>
										{entry.createdByUser && (
											<p className="text-xs text-muted-foreground">
												{t("createdBy")}: {entry.createdByUser.name}
											</p>
										)}
									</div>
								))}
							</div>
						)}
					</ScrollArea>
				</SheetContent>
			</Sheet>
		);
	});
