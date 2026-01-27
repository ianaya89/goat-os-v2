import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { appConfig } from "@/config/app.config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Contacto",
	description: `Ponte en contacto con el equipo de ${appConfig.appName}. Estamos aqui para ayudarte.`,
};

export default function ContactPage() {
	return (
		<main className="isolate overflow-clip">
			{/* Hero Section */}
			<section className="py-16 pt-32 lg:pt-40" id="contact">
				<div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 text-center md:max-w-3xl lg:max-w-7xl lg:px-10">
					<h1
						className={cn(
							"text-balance font-display text-5xl leading-12 tracking-tight",
							"text-marketing-fg",
							"sm:text-[5rem] sm:leading-20",
						)}
					>
						Contacto
					</h1>
					<div className="max-w-xl text-lg leading-8 text-marketing-fg-muted">
						<p>
							Tienes preguntas? Estamos aqui para ayudarte. Contacta a nuestro
							equipo y te responderemos lo antes posible.
						</p>
					</div>
				</div>
			</section>

			{/* Contact Options */}
			<section className="py-16">
				<div className="mx-auto max-w-2xl px-6 md:max-w-3xl lg:max-w-5xl lg:px-10">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
						{/* Email */}
						<div className="flex flex-col items-center gap-4 rounded-2xl bg-marketing-card p-8 text-center">
							<div className="flex size-12 items-center justify-center rounded-full bg-slate-500/10">
								<MailIcon className="size-6 text-slate-500" />
							</div>
							<h3 className="text-lg font-semibold text-marketing-fg">Email</h3>
							<p className="text-sm text-marketing-fg-muted">
								Escribenos para consultas generales o soporte.
							</p>
							<Link
								href={`mailto:${appConfig.contact.email}`}
								className="text-sm font-medium text-slate-500 hover:underline"
							>
								{appConfig.contact.email}
							</Link>
						</div>

						{/* Phone */}
						<div className="flex flex-col items-center gap-4 rounded-2xl bg-marketing-card p-8 text-center">
							<div className="flex size-12 items-center justify-center rounded-full bg-slate-500/10">
								<PhoneIcon className="size-6 text-slate-500" />
							</div>
							<h3 className="text-lg font-semibold text-marketing-fg">
								Telefono
							</h3>
							<p className="text-sm text-marketing-fg-muted">
								Disponibles de lunes a viernes, 9:00 - 18:00.
							</p>
							<Link
								href={`tel:${appConfig.contact.phone}`}
								className="text-sm font-medium text-slate-500 hover:underline"
							>
								{appConfig.contact.phone}
							</Link>
						</div>

						{/* Location */}
						<div className="flex flex-col items-center gap-4 rounded-2xl bg-marketing-card p-8 text-center">
							<div className="flex size-12 items-center justify-center rounded-full bg-slate-500/10">
								<MapPinIcon className="size-6 text-slate-500" />
							</div>
							<h3 className="text-lg font-semibold text-marketing-fg">
								Ubicacion
							</h3>
							<p className="text-sm text-marketing-fg-muted">
								Visitanos en nuestras oficinas.
							</p>
							<span className="text-sm font-medium text-slate-500">
								Buenos Aires, Argentina
							</span>
						</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-16">
				<div className="mx-auto max-w-2xl px-6 text-center md:max-w-3xl lg:max-w-5xl lg:px-10">
					<div className="rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 p-12">
						<h2 className="text-2xl font-bold text-white sm:text-3xl">
							Agenda una demo personalizada
						</h2>
						<p className="mx-auto mt-4 max-w-lg text-slate-200">
							Descubre como GOAT OS puede transformar la gestion de tu equipo
							deportivo con una demostracion guiada por nuestro equipo.
						</p>
						<Link
							href={`mailto:${appConfig.contact.email}?subject=Solicitud de Demo`}
							className={cn(
								"mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold",
								"bg-white text-slate-700 hover:bg-slate-100",
								"transition-colors",
							)}
						>
							Solicitar Demo
						</Link>
					</div>
				</div>
			</section>
		</main>
	);
}
