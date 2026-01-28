"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { LockIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { Field } from "@/components/ui/field";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const closeNotesSchema = z.object({
	notes: z.string().trim().max(1000).optional(),
});

export type CashRegisterCloseModalProps = NiceModalHocProps & {
	cashRegister: {
		id: string;
		openingBalance: number;
	};
};

export const CashRegisterCloseModal =
	NiceModal.create<CashRegisterCloseModalProps>(({ cashRegister }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const t = useTranslations("finance.cashRegister");
		const locale = useLocale();

		const { data: dailySummary } =
			trpc.organization.cashRegister.getDailySummary.useQuery({});

		const netFlow = dailySummary?.netCashFlow ?? 0;
		const calculatedClosingBalance = cashRegister.openingBalance + netFlow;

		const closeMutation = trpc.organization.cashRegister.close.useMutation({
			onSuccess: () => {
				toast.success(t("success.closed"));
				utils.organization.cashRegister.getCurrent.invalidate();
				utils.organization.cashRegister.getDailySummary.invalidate();
				utils.organization.cashRegister.getHistory.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.closeFailed"));
			},
		});

		const form = useZodForm({
			schema: closeNotesSchema,
			defaultValues: {
				notes: "",
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			closeMutation.mutate({
				id: cashRegister.id,
				closingBalance: calculatedClosingBalance,
				notes: data.notes,
			});
		});

		const formatAmount = (amount: number) => {
			return new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", {
				style: "currency",
				currency: "ARS",
			}).format(amount / 100);
		};

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("modal.closeTitle")}
				subtitle={t("modal.closeDescription")}
				icon={<LockIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={closeMutation.isPending}
				submitLabel={t("modal.close")}
				cancelLabel={t("modal.cancel")}
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection>
						<div className="grid grid-cols-3 gap-3">
							<div className="rounded-lg bg-muted/50 p-3">
								<p className="text-muted-foreground text-xs mb-1">
									{t("modal.closeOpeningBalance")}
								</p>
								<p className="font-semibold text-sm">
									{formatAmount(cashRegister.openingBalance)}
								</p>
							</div>
							<div className="rounded-lg bg-muted/50 p-3">
								<p className="text-muted-foreground text-xs mb-1">
									{t("modal.closeNetFlow")}
								</p>
								<p
									className={cn(
										"font-semibold text-sm",
										netFlow >= 0 ? "text-green-600" : "text-red-600",
									)}
								>
									{netFlow >= 0 ? "+" : ""}
									{formatAmount(netFlow)}
								</p>
							</div>
							<div className="rounded-lg bg-muted/50 p-3">
								<p className="text-muted-foreground text-xs mb-1">
									{t("modal.closeClosingBalance")}
								</p>
								<p className="font-semibold text-sm">
									{formatAmount(calculatedClosingBalance)}
								</p>
							</div>
						</div>
					</ProfileEditSection>

					<ProfileEditSection>
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("modal.notes")}</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("modal.notesClosePlaceholder")}
												className="resize-none"
												rows={3}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	});
