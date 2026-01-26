"use client";

import { LockIcon, MailIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { withQuery } from "ufo";
import { SocialSigninButton } from "@/components/auth/social-signin-button";
import { OrganizationInvitationAlert } from "@/components/invitations/organization-invitation-alert";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { InputPassword } from "@/components/ui/custom/input-password";
import { TurnstileCaptcha } from "@/components/ui/custom/turnstile";
import { Field } from "@/components/ui/field";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { TranslatedFormMessage } from "@/components/ui/form-message-translated";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group";
import { authConfig } from "@/config/auth.config";
import { useProgressRouter } from "@/hooks/use-progress-router";
import { useSession } from "@/hooks/use-session";
import { useTurnstile } from "@/hooks/use-turnstile";
import { useZodForm } from "@/hooks/use-zod-form";
import { authClient } from "@/lib/auth/client";
import {
	CAPTCHA_RESPONSE_HEADER,
	getAuthErrorMessage,
} from "@/lib/auth/constants";
import { type OAuthProvider, oAuthProviders } from "@/lib/auth/oauth-providers";
import { signInSchema } from "@/schemas/auth-schemas";

const formItemVariants = {
	hidden: { opacity: 0, y: 10 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			delay: i * 0.1,
			duration: 0.3,
			ease: "easeOut" as const,
		},
	}),
};

export function SignInCard(): React.JSX.Element {
	const t = useTranslations("auth.signIn");
	const router = useProgressRouter();
	const searchParams = useSearchParams();
	const { user, loaded: sessionLoaded } = useSession();

	const {
		turnstileRef,
		captchaToken,
		captchaEnabled,
		resetCaptcha,
		handleSuccess,
		handleError,
		handleExpire,
	} = useTurnstile();

	const invitationId = searchParams.get("invitationId");
	const emailParam = searchParams.get("email");
	const redirectTo = searchParams.get("redirectTo");

	const methods = useZodForm({
		schema: signInSchema,
		defaultValues: {
			email: emailParam ?? "",
			password: "",
		},
	});

	const redirectPath = invitationId
		? `/dashboard/organization-invitation/${invitationId}`
		: (redirectTo ?? authConfig.redirectAfterSignIn);

	React.useEffect(() => {
		if (sessionLoaded && user) {
			router.replace(redirectPath);
		}
	}, [user, sessionLoaded, router, redirectPath]);

	const onSubmit = methods.handleSubmit(async (values) => {
		try {
			const { data, error } = await authClient.signIn.email({
				...values,
				fetchOptions: captchaEnabled
					? {
							headers: {
								[CAPTCHA_RESPONSE_HEADER]: captchaToken,
							},
						}
					: undefined,
			});
			if (error) {
				throw error;
			}

			if ((data as any).twoFactorRedirect) {
				router.replace(
					withQuery("/auth/verify", Object.fromEntries(searchParams.entries())),
				);
				return;
			}

			// Use window.location.href instead of router.replace to force a full page refresh
			// This ensures that all global providers (SessionProvider, TRPCProvider)
			// are re-initialized with the correct server-side session data.
			window.location.href = redirectPath;
		} catch (e) {
			resetCaptcha();

			if (
				e &&
				typeof e === "object" &&
				"code" in e &&
				"message" in e &&
				e.code === "INVALID_ALLOWLIST"
			) {
				methods.setError("root", {
					message: e.message as string,
				});
			} else if (
				e &&
				typeof e === "object" &&
				"code" in e &&
				"message" in e &&
				e.code === "USER_BANNED"
			) {
				// Store the full message with special marker for parsing in the UI
				methods.setError("root", {
					message: `USER_BANNED|${e.message}`,
				});
			} else {
				methods.setError("root", {
					message: getAuthErrorMessage(
						e && typeof e === "object" && "code" in e
							? (e.code as string)
							: undefined,
					),
				});
			}
		}
	});

	return (
		<Card className="w-full border-0 bg-white/70 px-6 py-8 shadow-2xl shadow-primary/10 backdrop-blur-md transition-all duration-300 hover:shadow-primary/15 dark:bg-card/70 dark:shadow-primary/5">
			<CardHeader>
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					<CardTitle className="text-base lg:text-lg">{t("title")}</CardTitle>
					<CardDescription>{t("description")}</CardDescription>
				</motion.div>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{invitationId && <OrganizationInvitationAlert className="mb-6" />}
				<Form {...methods}>
					<form className="space-y-4" onSubmit={onSubmit}>
						<motion.div
							custom={0}
							variants={formItemVariants}
							initial="hidden"
							animate="visible"
						>
							<FormField
								control={methods.control}
								name="email"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("email")}</FormLabel>
											<FormControl>
												<InputGroup
													className={`transition-all duration-200 focus-within:scale-[1.01] focus-within:shadow-md ${field.disabled ? "opacity-50" : ""}`}
												>
													<InputGroupAddon align="inline-start">
														<InputGroupText>
															<MailIcon className="size-4 shrink-0" />
														</InputGroupText>
													</InputGroupAddon>
													<InputGroupInput
														{...field}
														autoCapitalize="off"
														autoComplete="username"
														disabled={methods.formState.isSubmitting}
														maxLength={255}
														type="email"
													/>
												</InputGroup>
											</FormControl>
											<TranslatedFormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</motion.div>
						<motion.div
							custom={1}
							variants={formItemVariants}
							initial="hidden"
							animate="visible"
						>
							<FormField
								control={methods.control}
								name="password"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<div className="flex flex-row items-center justify-between">
												<FormLabel>{t("password")}</FormLabel>
												<Link
													className="ml-auto inline-block text-sm underline transition-colors hover:text-primary"
													href="/auth/forgot-password"
												>
													{t("forgotPassword")}
												</Link>
											</div>
											<FormControl>
												<InputPassword
													{...field}
													autoCapitalize="off"
													autoComplete="current-password"
													disabled={methods.formState.isSubmitting}
													maxLength={72}
													startAdornment={
														<LockIcon className="size-4 shrink-0" />
													}
													className="transition-all duration-200 focus-within:scale-[1.01] focus-within:shadow-md"
												/>
											</FormControl>
											<TranslatedFormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</motion.div>
						{captchaEnabled && (
							<motion.div
								custom={2}
								variants={formItemVariants}
								initial="hidden"
								animate="visible"
							>
								<TurnstileCaptcha
									ref={turnstileRef}
									onSuccess={handleSuccess}
									onError={handleError}
									onExpire={handleExpire}
								/>
							</motion.div>
						)}
						{methods.formState.isSubmitted &&
							methods.formState.errors.root?.message && (
								<motion.div
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.2 }}
								>
									<Alert variant="destructive">
										<AlertDescription>
											{(() => {
												const message = methods.formState.errors.root.message;
												if (message.startsWith("USER_BANNED|")) {
													const baseMessage =
														getAuthErrorMessage("USER_BANNED");
													const serverMessage = message.replace(
														"USER_BANNED|",
														"",
													);
													const [reason, expiresInfo] =
														serverMessage.split("|expires:");

													return (
														<div className="space-y-2">
															<p>{baseMessage}</p>
															{reason &&
																reason !==
																	"Your account has been suspended" && (
																	<p>
																		<span className="font-medium">Reason:</span>{" "}
																		{reason}
																	</p>
																)}
															{expiresInfo && (
																<p className="text-sm opacity-90">
																	This suspension will be lifted on{" "}
																	{expiresInfo}.
																</p>
															)}
														</div>
													);
												}
												return message;
											})()}
										</AlertDescription>
									</Alert>
								</motion.div>
							)}
						<motion.div
							custom={3}
							variants={formItemVariants}
							initial="hidden"
							animate="visible"
						>
							<Button
								className="w-full transition-transform duration-200 active:scale-[0.98]"
								loading={methods.formState.isSubmitting}
								type="submit"
								disabled={
									methods.formState.isSubmitting ||
									(captchaEnabled && !captchaToken)
								}
							>
								{t("submit")}
							</Button>
						</motion.div>
					</form>
				</Form>
				{authConfig.enableSignup && authConfig.enableSocialLogin && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4, duration: 0.3 }}
					>
						<div className="relative my-1 h-4">
							<hr className="relative top-2" />
							<p className="-translate-x-1/2 absolute top-0 left-1/2 mx-auto inline-block h-4 bg-white/90 px-2 text-center font-medium text-foreground/60 text-sm leading-tight dark:bg-card/90">
								{t("orContinueWith")}
							</p>
						</div>
						<div className="mt-4 grid grid-cols-1 items-stretch gap-2">
							{Object.keys(oAuthProviders).map((providerId, index) => (
								<motion.div
									key={providerId}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.5 + index * 0.1, duration: 0.2 }}
								>
									<SocialSigninButton provider={providerId as OAuthProvider} />
								</motion.div>
							))}
						</div>
					</motion.div>
				)}
			</CardContent>
			{authConfig.enableSignup && (
				<CardFooter className="flex justify-center gap-1 text-muted-foreground text-sm">
					<motion.span
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.6, duration: 0.3 }}
					>
						{t("noAccount")}{" "}
						<Link
							className="text-foreground underline transition-colors hover:text-primary"
							href={withQuery(
								"/auth/sign-up",
								Object.fromEntries(searchParams.entries()),
							)}
						>
							{t("signUp")}
						</Link>
					</motion.span>
				</CardFooter>
			)}
		</Card>
	);
}
