"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { CalendarCheckIcon, MapPinIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { AttendanceForm } from "@/components/organization/attendance-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";

interface SessionAttendanceModalProps {
	sessionId: string;
	sessionTitle: string;
	sessionDate: Date;
	locationName?: string;
}

export const SessionAttendanceModal =
	NiceModal.create<SessionAttendanceModalProps>(
		({ sessionId, sessionTitle, sessionDate, locationName }) => {
			const modal = useEnhancedModal();
			const t = useTranslations("training.attendance");

			return (
				<Sheet
					open={modal.visible}
					onOpenChange={(open) => {
						if (!open) modal.handleClose();
					}}
				>
					<SheetContent
						className="flex flex-col p-0 sm:max-w-2xl"
						onAnimationEndCapture={modal.handleAnimationEndCapture}
						hideDefaultHeader
					>
						<SheetTitle className="sr-only">{t("modalTitle")}</SheetTitle>
						{/* Custom Header with accent stripe */}
						<div className="relative shrink-0">
							{/* Accent stripe */}
							<div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-500" />

							{/* Header content */}
							<div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
								<div className="flex items-start gap-3">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-sm">
										<CalendarCheckIcon className="size-5" />
									</div>
									<div>
										<h2 className="font-semibold text-lg tracking-tight">
											{t("modalTitle")}
										</h2>
										<p className="mt-0.5 text-muted-foreground text-sm">
											{sessionTitle}
										</p>
										<div className="flex items-center gap-3 text-muted-foreground text-xs mt-1">
											<span>
												{format(
													new Date(sessionDate),
													"EEE, dd MMM yyyy 'at' HH:mm",
												)}
											</span>
											{locationName && (
												<span className="flex items-center gap-1">
													<MapPinIcon className="size-3" />
													{locationName}
												</span>
											)}
										</div>
									</div>
								</div>
								<button
									type="button"
									onClick={modal.handleClose}
									className="flex size-8 items-center justify-center rounded-lg transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<XIcon className="size-4" />
									<span className="sr-only">{t("close")}</span>
								</button>
							</div>

							{/* Separator */}
							<div className="h-px bg-border" />
						</div>

						{/* Content */}
						<ScrollArea className="flex-1">
							<div className="px-6 py-4">
								<AttendanceForm sessionId={sessionId} />
							</div>
						</ScrollArea>
					</SheetContent>
				</Sheet>
			);
		},
	);
