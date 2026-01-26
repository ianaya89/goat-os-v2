"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { CalendarCheckIcon, MapPinIcon } from "lucide-react";
import { AttendanceForm } from "@/components/organization/attendance-form";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

interface SessionAttendanceModalProps {
	sessionId: string;
	sessionTitle: string;
	sessionDate: Date;
	locationName?: string;
}

export const SessionAttendanceModal =
	NiceModal.create<SessionAttendanceModalProps>(
		({ sessionId, sessionTitle, sessionDate, locationName }) => {
			const modal = useModal();

			return (
				<Sheet
					open={modal.visible}
					onOpenChange={(open) => {
						if (!open) modal.hide();
					}}
				>
					<SheetContent className="sm:max-w-2xl p-0 flex flex-col">
						{/* Header */}
						<div className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent px-6 pt-6 pb-4">
							<SheetHeader>
								<SheetTitle className="flex items-center gap-3 text-xl">
									<div className="flex items-center justify-center size-10 rounded-full bg-green-500/10">
										<CalendarCheckIcon className="size-5 text-green-500" />
									</div>
									<div>
										<span>Session Attendance</span>
										<p className="text-sm font-normal text-muted-foreground mt-0.5">
											{sessionTitle}
										</p>
										<div className="flex items-center gap-3 text-xs font-normal text-muted-foreground mt-1">
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
								</SheetTitle>
							</SheetHeader>
						</div>

						{/* Content */}
						<div className="flex-1 overflow-y-auto px-6 py-4">
							<AttendanceForm sessionId={sessionId} />
						</div>
					</SheetContent>
				</Sheet>
			);
		},
	);
