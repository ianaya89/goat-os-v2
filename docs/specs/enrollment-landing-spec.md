# Spec: Landing Page de Enrollment por Grupo

## Objetivo

Crear una página pública de enrollment (`/enroll/[slug]`) donde atletas pueden inscribirse a un grupo específico de una organización. La página consume el endpoint `POST /api/v1/enroll` ya implementado.

---

## 1. Modelo de datos: Enrollment Link

### 1.1 Nueva tabla `enrollment_link`

Agregar en `lib/db/schema/tables.ts`:

```
enrollmentLinkTable
├── id: uuid (PK)
├── organizationId: uuid (FK → organization, NOT NULL)
├── athleteGroupId: uuid (FK → athlete_group, NOT NULL)
├── slug: text (UNIQUE, NOT NULL) — URL-friendly identifier (ej: "escuela-river-sub17")
├── title: text — título personalizado para la landing (ej: "Inscripción Sub-17")
├── description: text — descripción opcional para mostrar en la landing
├── createAccount: boolean (default false) — si el enrollment crea cuenta de usuario
├── isActive: boolean (default true) — toggle on/off
├── expiresAt: timestamp — fecha de expiración opcional
├── maxEnrollments: integer — límite opcional de inscripciones
├── enrollmentCount: integer (default 0) — contador de usos
├── customFields: jsonb — campos extra configurables a futuro
├── createdAt: timestamp
├── updatedAt: timestamp
```

**Índices:**
- `uniqueIndex` en `slug`
- `index` en `organizationId`
- `index` en `athleteGroupId`
- `index` en `isActive`

### 1.2 Relaciones

Agregar en `lib/db/schema/relations.ts`:

```typescript
enrollmentLinkTable → organizationTable (many-to-one)
enrollmentLinkTable → athleteGroupTable (many-to-one)
```

### 1.3 Migración

```bash
# Después de agregar la tabla en tables.ts
npm run db:generate
npm run db:migrate
```

---

## 2. Endpoint público tRPC: Validar enrollment link

### 2.1 Archivo: `trpc/routers/public/public-enrollment-link-router.ts`

Procedure público (sin auth) que valida el slug y devuelve contexto para la landing.

```typescript
// Input
{ slug: string }

// Output (lo que necesita la landing para renderizarse)
{
  organizationName: string
  organizationLogo: string | null
  groupName: string
  groupSport: string | null
  title: string | null           // título custom del link
  description: string | null     // descripción custom
  createAccount: boolean         // si la landing debe mostrar campo password
}
```

**Lógica:**
1. Buscar `enrollmentLinkTable` por `slug` donde `isActive = true`
2. Validar que no haya expirado (`expiresAt` null o > now)
3. Validar que no se haya alcanzado el límite (`maxEnrollments` null o `enrollmentCount < maxEnrollments`)
4. Incluir relación con `organization` (name, logo) y `athleteGroup` (name, sport)
5. Si no se encuentra o no es válido → `TRPCError NOT_FOUND`

### 2.2 Registrar en el router público

En `trpc/routers/public/index.ts` (o donde se registren los routers públicos), agregar:

```typescript
enrollmentLink: publicEnrollmentLinkRouter
```

---

## 3. Página de Enrollment

### 3.1 Estructura de archivos

```
app/(saas)/enroll/
├── [slug]/
│   ├── page.tsx                    → Server component (entry point)
│   └── enroll-content.tsx          → Client component (valida slug, muestra form)
```

### 3.2 Server component: `page.tsx`

Patrón idéntico al de `app/(saas)/athlete-signup/page.tsx`:

```typescript
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Inscripción",
  description: "Inscribite en un grupo deportivo",
};

type EnrollPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EnrollPage({ params }: EnrollPageProps) {
  const { slug } = await params;
  return <EnrollContent slug={slug} />;
}
```

### 3.3 Client component: `enroll-content.tsx`

Patrón idéntico a `athlete-signup-content.tsx`:

```typescript
"use client";

// 1. Validar slug via tRPC público
const { data, isLoading, error } = trpc.public.enrollmentLink.validate.useQuery(
  { slug },
  { retry: false }
);

// 2. Loading state → spinner con AuthSplitLayout
// 3. Error state → card con ícono de error y mensaje
// 4. Success → renderizar <EnrollCard {...data} slug={slug} />
```

**Layout:** Usar `AuthSplitLayout` con features contextuales al enrollment:
- "Inscripción rápida" — Completa tu registro en minutos
- "Grupo deportivo" — Ingresá directamente a tu grupo
- "Seguimiento" — Accedé a métricas y entrenamientos
- "Equipo" — Conectá con entrenadores y compañeros

---

## 4. Componente del formulario: `EnrollCard`

### 4.1 Archivo: `components/public/enroll-card.tsx`

Formulario multi-step animado. Seguir exactamente el patrón de `components/auth/athlete-sign-up-card.tsx`.

### 4.2 Props

```typescript
type EnrollCardProps = {
  slug: string;
  organizationName: string;
  organizationLogo: string | null;
  groupName: string;
  groupSport: string | null;
  title: string | null;
  description: string | null;
  createAccount: boolean;       // controla si se muestra password
};
```

### 4.3 Steps del wizard (3 o 4 según `createAccount`)

**Step 1: Datos personales**
- `name` — Nombre completo (Input con ícono UserIcon)
- `email` — Email (Input con ícono MailIcon)
- `phone` — Teléfono (Input con ícono PhoneIcon)
- `password` — Contraseña (**solo si `createAccount: true`**, InputPassword con ícono LockIcon)

**Step 2: Datos deportivos**
- `sport` — Deporte (Input, pre-fill con `groupSport` si disponible)
- `category` — Categoría (Input)
- `birthDate` — Fecha de nacimiento (Calendar picker)
- `level` — Nivel (Select: Principiante/Intermedio/Avanzado/Elite)
- `position` — Posición (Input)
- `jerseyNumber` — N° camiseta (Input number, opcional)

**Step 3: Legal + Tutor (si menor)**
- `acceptTerms` — Checkbox términos y condiciones
- `confirmMedicalFitness` — Checkbox aptitud médica
- Si `isMinor(birthDate)`:
  - `parentName` — Nombre del tutor
  - `parentPhone` — Teléfono del tutor
  - `parentEmail` — Email del tutor (opcional)
  - `parentRelationship` — Relación (opcional)
  - `parentalConsent` — Checkbox consentimiento parental

### 4.4 Header del card

Mostrar contexto de la organización en el header del formulario:

```
[Logo org]  Organización Name
            Inscripción a: Grupo Name
            (título custom si existe)
```

### 4.5 Schema de validación

Reutilizar `enrollSchema` de `schemas/enroll-schemas.ts` directamente. El campo `groupId` no se muestra en el form — se inyecta al enviar.

**IMPORTANTE**: El `enrollSchema` actual requiere `groupId` como campo del schema. Hay dos opciones:
- **Opción A (recomendada)**: Crear un `enrollFormSchema` que sea el `enrollSchema` sin `groupId`, y agregar `groupId` al momento del submit.
- **Opción B**: Usar un hidden field con el `groupId` en el form.

Para la opción A, agregar en `schemas/enroll-schemas.ts`:

```typescript
// Schema para el formulario (sin groupId, se agrega al submit)
export const enrollFormSchema = enrollSchema.innerType().omit({ groupId: true });
export type EnrollFormInput = z.infer<typeof enrollFormSchema>;
```

### 4.6 Submit

```typescript
const onSubmit = methods.handleSubmit(async (formData) => {
  setIsSubmitting(true);
  try {
    const response = await fetch("/api/v1/enroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,  // ← ver sección 5
      },
      body: JSON.stringify({
        ...formData,
        groupId,  // inyectado desde props/context
      }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setSubmitSuccess(true);
  } catch (e) {
    methods.setError("root", {
      message: e instanceof Error ? e.message : "Error al inscribirse",
    });
  } finally {
    setIsSubmitting(false);
  }
});
```

### 4.7 Success state

Después de submit exitoso, mostrar modal/card de éxito:
- Ícono CheckCircle2 verde
- "¡Inscripción exitosa!"
- Si `createAccount` y no se pasó password: "Te enviamos un email para configurar tu contraseña"
- Si `createAccount` y se pasó password: "Ya podés iniciar sesión"
- Si NO `createAccount`: "Tu inscripción fue registrada correctamente"
- Botón para volver al inicio o cerrar

### 4.8 Animaciones

Copiar los mismos patrones de `athlete-sign-up-card.tsx`:
- `stepVariants` para transición entre steps (slide horizontal con fade)
- `formItemVariants` para entrada escalonada de campos (stagger 80ms)
- `AnimatePresence` con `mode="wait"` para los steps
- `Progress` bar animada con spring

---

## 5. Autenticación del endpoint desde la landing

El endpoint `POST /api/v1/enroll` requiere API key (`Authorization: Bearer goat_sk_...`). La landing page es pública y NO puede exponer la API key en el cliente.

### Solución: Proxy API route interno

Crear `app/api/enroll/route.ts` como proxy interno que:
1. Recibe el body del form + el `slug`
2. Busca el `enrollmentLink` por slug (valida activo, no expirado, no excedido)
3. Obtiene el `organizationId` y `groupId` del link
4. Llama internamente a la lógica del enrollment (reutilizar la lógica, NO hacer HTTP a sí mismo)
5. Incrementa `enrollmentCount` del link
6. Retorna el resultado

```
app/api/enroll/route.ts    ← proxy público (sin auth)
```

**Lógica:**

```typescript
export async function POST(request: Request) {
  const body = await request.json();
  const { slug, ...formData } = body;

  // 1. Buscar enrollment link por slug
  const link = await db.query.enrollmentLinkTable.findFirst({
    where: and(
      eq(enrollmentLinkTable.slug, slug),
      eq(enrollmentLinkTable.isActive, true),
    ),
  });

  if (!link) return error 400;
  if (link.expiresAt && link.expiresAt < new Date()) return error 400;
  if (link.maxEnrollments && link.enrollmentCount >= link.maxEnrollments) return error 400;

  // 2. Parsear con enrollSchema (inyectar groupId y createAccount del link)
  const parsed = enrollSchema.safeParse({
    ...formData,
    groupId: link.athleteGroupId,
    createAccount: link.createAccount,
  });

  // 3. Ejecutar la misma lógica del enrollment (extraer a función compartida)
  // 4. Incrementar enrollmentCount
  // 5. Retornar resultado
}
```

### Refactor sugerido: Extraer lógica core a `lib/enrollment.ts`

Para evitar duplicación entre `app/api/v1/enroll/route.ts` y `app/api/enroll/route.ts`:

```typescript
// lib/enrollment.ts
export async function processEnrollment(
  organizationId: string,
  data: EnrollInput,
): Promise<EnrollmentResult> {
  // Toda la lógica de Cases A/B/C1/C2 que hoy está en el route handler
}
```

Luego ambos endpoints llaman a `processEnrollment()`.

---

## 6. Admin: CRUD de Enrollment Links

### 6.1 Router tRPC: `trpc/routers/organization/organization-enrollment-link-router.ts`

Procedures protegidos (org admin):

| Procedure | Input | Descripción |
|-----------|-------|-------------|
| `list` | `{ limit, offset }` | Lista links de la org con grupo asociado |
| `create` | `{ athleteGroupId, slug, title?, description?, createAccount?, expiresAt?, maxEnrollments? }` | Crea nuevo link |
| `update` | `{ id, slug?, title?, description?, createAccount?, isActive?, expiresAt?, maxEnrollments? }` | Actualiza link |
| `delete` | `{ id }` | Elimina link |

**Validaciones en `create`:**
- `slug` debe ser URL-safe (`/^[a-z0-9-]+$/`) y único
- `athleteGroupId` debe pertenecer a la org
- Auto-generar slug si no se provee (basado en nombre del grupo)

### 6.2 Registrar en el router de organización

En el router de organización agregar:

```typescript
enrollmentLink: organizationEnrollmentLinkRouter
```

### 6.3 UI de admin: Tab en Settings

Agregar una nueva tab "Links de inscripción" en `components/organization/organization-settings-tabs.tsx` (usa `nuqs` para URL state).

Patrón similar a `components/organization/athlete-signup-links-tab.tsx`:

**Componente:** `components/organization/enrollment-links-tab.tsx`

**Contenido:**
- Tabla con columnas: Nombre (slug), Grupo, Estado (activo/inactivo badge), Inscripciones (count/max), Expira, Acciones
- Botón "Crear link" → Dialog con formulario
- Acciones por fila: Copiar URL, Editar, Toggle activo, Eliminar
- URL copiable: `{baseUrl}/enroll/{slug}`

---

## 7. Traducciones

### 7.1 Agregar namespace `enroll` en ambos idiomas

**`messages/es/enroll.json`:**
```json
{
  "pageTitle": "Inscripción",
  "pageDescription": "Completá tus datos para inscribirte",
  "steps": {
    "personal": "Datos personales",
    "sports": "Datos deportivos",
    "legal": "Legal"
  },
  "fields": {
    "name": "Nombre completo",
    "email": "Email",
    "phone": "Teléfono",
    "password": "Contraseña",
    "sport": "Deporte",
    "category": "Categoría",
    "birthDate": "Fecha de nacimiento",
    "level": "Nivel",
    "position": "Posición",
    "jerseyNumber": "N° de camiseta",
    "acceptTerms": "Acepto los términos y condiciones",
    "confirmMedicalFitness": "Confirmo mi aptitud médica",
    "parentName": "Nombre del padre/tutor",
    "parentPhone": "Teléfono del padre/tutor",
    "parentEmail": "Email del padre/tutor",
    "parentRelationship": "Relación",
    "parentalConsent": "Consentimiento parental"
  },
  "enrollTo": "Inscripción a: {groupName}",
  "next": "Siguiente",
  "previous": "Anterior",
  "submit": "Inscribirse",
  "submitting": "Inscribiendo...",
  "success": {
    "title": "¡Inscripción exitosa!",
    "withAccountNoPassword": "Te enviamos un email para configurar tu contraseña.",
    "withAccountPassword": "Ya podés iniciar sesión con tu cuenta.",
    "withoutAccount": "Tu inscripción fue registrada correctamente."
  },
  "errors": {
    "linkNotFound": "El link de inscripción no es válido o está desactivado.",
    "linkExpired": "El link de inscripción ha expirado.",
    "linkFull": "Se alcanzó el límite de inscripciones.",
    "submitError": "Error al inscribirse. Por favor intentá nuevamente."
  },
  "validating": "Validando link de inscripción...",
  "admin": {
    "tabTitle": "Links de inscripción",
    "createLink": "Crear link",
    "editLink": "Editar link",
    "deleteLink": "Eliminar link",
    "deleteConfirm": "¿Estás seguro de eliminar este link?",
    "slug": "Slug (URL)",
    "slugHelp": "Se usará en la URL: /enroll/{slug}",
    "title": "Título personalizado",
    "description": "Descripción",
    "selectGroup": "Seleccionar grupo",
    "createAccount": "Crear cuenta de usuario",
    "createAccountHelp": "Si está activo, se creará una cuenta para el atleta",
    "expiresAt": "Fecha de expiración",
    "maxEnrollments": "Máximo de inscripciones",
    "copyUrl": "Copiar URL",
    "urlCopied": "URL copiada",
    "active": "Activo",
    "inactive": "Inactivo",
    "enrollments": "Inscripciones",
    "noLinks": "No hay links de inscripción",
    "noLinksDescription": "Creá tu primer link para que los atletas puedan inscribirse."
  }
}
```

**`messages/en/enroll.json`:** (equivalente en inglés)

---

## 8. Resumen de archivos a crear/modificar

### Crear:
| Archivo | Tipo |
|---------|------|
| `app/(saas)/enroll/[slug]/page.tsx` | Server component |
| `app/(saas)/enroll/[slug]/enroll-content.tsx` | Client component |
| `components/public/enroll-card.tsx` | Client component (formulario wizard) |
| `app/api/enroll/route.ts` | API route (proxy público) |
| `lib/enrollment.ts` | Lógica core compartida (refactor desde `app/api/v1/enroll/route.ts`) |
| `trpc/routers/public/public-enrollment-link-router.ts` | tRPC router público |
| `trpc/routers/organization/organization-enrollment-link-router.ts` | tRPC router admin |
| `schemas/enrollment-link-schemas.ts` | Zod schemas para CRUD del admin |
| `components/organization/enrollment-links-tab.tsx` | UI admin tab |
| `messages/es/enroll.json` | Traducciones ES |
| `messages/en/enroll.json` | Traducciones EN |

### Modificar:
| Archivo | Cambio |
|---------|--------|
| `lib/db/schema/tables.ts` | Agregar `enrollmentLinkTable` |
| `lib/db/schema/relations.ts` | Agregar relaciones del nuevo table |
| `trpc/routers/public/index.ts` | Registrar `publicEnrollmentLinkRouter` |
| `trpc/routers/organization/index.ts` | Registrar `organizationEnrollmentLinkRouter` |
| `components/organization/organization-settings-tabs.tsx` | Agregar tab de enrollment links |
| `app/api/v1/enroll/route.ts` | Refactorizar para usar `lib/enrollment.ts` |
| `schemas/enroll-schemas.ts` | Agregar `enrollFormSchema` (sin groupId) |

---

## 9. Orden de implementación sugerido

1. **Tabla + migración**: `enrollmentLinkTable` en schema, generar y correr migración
2. **Schema Zod admin**: `schemas/enrollment-link-schemas.ts` para CRUD
3. **tRPC admin router**: `organization-enrollment-link-router.ts` (list, create, update, delete)
4. **tRPC público**: `public-enrollment-link-router.ts` (validate por slug)
5. **Refactor lógica core**: Extraer `lib/enrollment.ts` desde `app/api/v1/enroll/route.ts`
6. **Proxy API route**: `app/api/enroll/route.ts`
7. **Traducciones**: `messages/es/enroll.json` y `messages/en/enroll.json`
8. **Landing page**: `page.tsx` + `enroll-content.tsx` + `enroll-card.tsx`
9. **Admin UI**: `enrollment-links-tab.tsx` + registrar tab
10. **Verificación**: `npm run typecheck && npm run lint`

---

## 10. Patrones de referencia clave

| Patrón | Archivo de referencia |
|--------|----------------------|
| Server page con params async | `app/(saas)/athlete-signup/page.tsx` |
| Client content con tRPC validation | `app/(saas)/athlete-signup/athlete-signup-content.tsx` |
| Formulario multi-step animado | `components/auth/athlete-sign-up-card.tsx` |
| AuthSplitLayout | `components/auth/auth-split-layout.tsx` |
| Tab en settings con nuqs | `components/organization/organization-settings-tabs.tsx` |
| Tab CRUD con tabla + dialogs | `components/organization/athlete-signup-links-tab.tsx` |
| tRPC router público | `trpc/routers/public/public-athlete-signup-link-router.ts` |
| tRPC router admin (CRUD) | `trpc/routers/organization/organization-athlete-signup-link-router.ts` |
| API route público (proxy) | `app/api/auth/athlete-signup/route.ts` |
| Enrollment core logic | `app/api/v1/enroll/route.ts` |
| Zod form hook | `hooks/use-zod-form.tsx` |
