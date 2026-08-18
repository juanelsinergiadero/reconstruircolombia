# reconstruircolombia

Plataforma humanitaria de codigo abierto que conecta necesidades de personas
damnificadas con ofrecimientos de ayuda, segmentada por departamento y municipio
(DIVIPOLA del DANE). Respuesta al terremoto del 10 de agosto de 2026 (Mw 7.4,
epicentro San Jose del Palmar, Choco).

Repo: github.com/juanelsinergiadero/reconstruircolombia. Licencia: AGPL-3.0-only.

---

## Principios NO negociables (mandan sobre velocidad y tecnica)

1. **Pensar primero en el damnificado.** Minima barrera posible para pedir ayuda.
   Ninguna decision de producto sube esa barrera (por eso se descarto biometria).
2. **Privacidad de datos sensibles.** En `Necesidad`, los campos `contactoNombre`,
   `contactoTelefono`, `contactoEmail` y `radicadoRud` NUNCA se exponen en listados
   publicos ni mapa abierto. La consulta Prisma publica DEBE usar `select` explicito
   que los excluya (no basta con no mostrarlos: no deben salir de la BD).
3. **Anti-fraude por capas de confianza social, NO biometria.** La verificacion
   SUMA confianza visible, nunca es requisito para publicar (protege al aislado).
4. **Separacion codigo/datos.** `.env` y `prisma/data/*.csv` en `.gitignore`.
   Documentos de organizaciones y datos de personas jamas al repo ni sin cifrar.

---

## Stack y versiones (FIJADAS, no cambiar sin razon)

- **Next.js 15.5.23** (App Router). NO subir a 16.
- **React 19.2**, **TypeScript estricto**, **Tailwind v4** (config por CSS).
- **Prisma 6.19.3**. NO subir a 7.
- **NextAuth v5** (5.0.0-beta.32), CredentialsProvider + bcrypt, JWT. AUTH_SECRET en .env.
- **PostgreSQL 16** en Docker. **pnpm**. **Zod 4**.

---

## Convenciones

- **Español siempre**: UI, comentarios, mensajes, commits.
- **TypeScript estricto**, nunca JS puro. Codigo por archivos completos.
- Nombres de dominio en español (Necesidad, Organizacion, Validacion, Rol).
- Codigo DIVIPOLA como String (2 digitos depto, 5 municipio). NUNCA Int.
- Mobile-first en toda UI nueva (el damnificado entra desde movil gama baja).

---

## Infraestructura

- Servidor srv1694606 (187.77.203.30). Proyecto en `/var/www/reconstruircolombia`.
- Postgres DEV: contenedor `reconstruir-db-dev`, 127.0.0.1:5433, base
  `reconstruir_dev_db`, usuario `reconstruir_user`.
  Levantar: `docker compose -f docker-compose.dev.yml up -d`.
- ADVERTENCIA: `.env` de dev tiene contraseña temporal `12345678` y un AUTH_SECRET
  de dev. CAMBIAR ambos antes de prod (openssl rand -hex 24).

---

## Modelo de dominio (schema.prisma — dominio ampliado, ya migrado)

Anclado en marcos humanitarios reales (clusteres ONU/Esfera, RUD/RUNDA de la UNGRD).

**6 tablas:** Departamento, Municipio, Organizacion, User, Necesidad, Validacion.

**Categorias de Necesidad** (alineadas a clusteres ONU, en lenguaje de la persona):
AGUA_SANEAMIENTO, ALIMENTOS, ALOJAMIENTO, SALUD, HIGIENE, ROPA_ABRIGO,
PROTECCION, EDUCACION, RESCATE, OTRO.

**Poblacion vulnerable** (booleanos en Necesidad, para priorizar sin exponer):
hayMenores, hayAdultosMayores, hayPersonasDiscapacidad, hayGestantes,
hayEnfermosCronicos.

**Organizacion** (sociedad civil, entidad propia): tipo (INSTITUCION_EDUCATIVA,
JAC, FUNDACION, COLECTIVO, ENTIDAD_OFICIAL, OTRA), estado (REGISTRADA / VERIFICADA).
Un User pertenece a UNA organizacion (opcional). La subida de documentos de
verificacion esta MODELADA (documentoUrl) pero se implementa despues (requiere
almacenamiento privado). En v1 un moderador marca VERIFICADA manualmente.

**Verificacion por niveles de confianza** (hibrido: estado de moderacion +
validaciones contadas). El `estado` de Necesidad (PENDIENTE/EN_PROCESO/RESUELTA/
RECHAZADA) lo maneja moderacion. El nivel de confianza que ve el donante se
DERIVA de contar/ponderar las Validacion. Niveles: 0 sin verificar (siempre se
publica), 1a respaldo comunitario (pares), 1b institucional (organizacion),
2 oficial (radicadoRud, cotejo activo -> despues).

**Validacion (anti-fraude, validacion por pares — ACTIVA en v1):** salvaguardas
como constraints: validadorId obligatorio (nunca anonimo), @@unique(validadorId,
necesidadId) (una por usuario por necesidad), onDelete Cascade. La no-autovalidacion
(validador != autor de la necesidad) se valida en la Server Action. Peso por
confianza del validador se calcula en logica (cuentas nuevas pesan menos). Tipo:
COMUNITARIA (vecino) / INSTITUCIONAL (organizacion).

**tipoReporte** en Necesidad: PROPIA / EN_NOMBRE_DE (+ organizacionId opcional).

---

## Estado actual

HECHO Y MIGRADO: infra, schema ampliado (6 tablas), DIVIPOLA sembrada (33/1122),
auth (NextAuth v5), y las paginas de registro/sign-in.

CODIGO QUE QUEDO DESACTUALIZADO tras la ampliacion del schema (arreglar):
- lib/validations/necesidad.ts: usa categorias VIEJAS (AGUA, REFUGIO, ROPA).
  Actualizar al enum nuevo.
- app/necesidades/nueva/actions.ts y necesidad-form.tsx: formulario viejo, sin
  poblacion vulnerable ni tipoReporte. Rediseñar mobile-first.
- app/necesidades/page.tsx: listado usa labels de categorias viejas.

## Lo que sigue (v1)

- [ ] Actualizar codigo roto a categorias nuevas.
- [ ] Formulario /necesidades/nueva rediseñado mobile-first: categorias nuevas,
      poblacion vulnerable, tipoReporte. Contacto y radicadoRud nunca publicos.
- [ ] Listado /necesidades con categorias nuevas y filtros. Sin datos sensibles.
- [ ] Registro y gestion de Organizaciones (nivel REGISTRADA en v1).
- [ ] Validacion por pares en las necesidades (con salvaguardas anti-fraude).
- [ ] Detalle de necesidad /necesidades/[id] (contacto visible solo a logueados).
- [ ] Landing (/) y layout (lang="es", metadata) — aun del scaffold.
- [ ] Verificacion de email con Resend.

## Fases futuras (NO en v1, ya decididas)

- Modulo de IA (Groq) para orientar rehabilitacion de viviendas de bahareque y
  tapia pisada (tecnicas tradicionales, muy afectadas en sismos).
- Subida segura de documentos de organizaciones (nivel VERIFICADA).
- Enlace activo con RUD/RUNDA de la UNGRD (nivel 2 de verificacion).
- Emparejamiento de ofrecimientos, dashboards, escala nacional, SMS/WhatsApp.

Pagos/donaciones (Wompi): NO en v1. Solo cuando la verificacion este madura.
