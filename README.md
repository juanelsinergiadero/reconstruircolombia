# reconstruircolombia

Plataforma humanitaria de código abierto que conecta las **necesidades**
de personas damnificadas con las **ofrecimientos de ayuda** de la
comunidad, segmentada por departamento y municipio (DIVIPOLA del DANE).

Respuesta al terremoto del **10 de agosto de 2026** (Mw 7.4, epicentro San
José del Palmar, Chocó).

## Por qué existe

Tras un desastre, la ayuda y las necesidades casi nunca se encuentran a
tiempo: la información se dispersa en grupos de WhatsApp, publicaciones
sueltas en redes sociales y llamadas que no llegan a nadie. reconstruircolombia
es un punto de encuentro único, público y verificable por la comunidad,
donde:

- Una persona afectada puede **reportar su necesidad** (agua, alimentos,
  alojamiento, salud, etc.) en minutos, sin trámites ni barreras.
- Vecinos, voluntarios, organizaciones y donantes pueden **ver esas
  necesidades**, confirmarlas si les consta que son reales, y **pedir
  contacto** para ayudar directamente.
- Organizaciones de sociedad civil (instituciones educativas, Juntas de
  Acción Comunal, fundaciones, colectivos) pueden reportar en nombre de su
  comunidad y sumar respaldo institucional.

## Principios del proyecto

Estos principios no negocian con la velocidad ni con la conveniencia
técnica:

1. **Mínima barrera para pedir ayuda.** Nada de lo que pide la plataforma
   sube el costo de reportar una necesidad. Por eso, por ejemplo, se
   descartó cualquier forma de verificación biométrica.
2. **Privacidad de los datos sensibles.** El contacto de la persona
   afectada (nombre, teléfono, correo) y su radicado oficial (RUD/RUNDA)
   **nunca** se muestran en listados públicos ni en el mapa abierto. Las
   consultas públicas usan `select` explícito en Prisma que los excluye:
   no basta con no pintarlos en la UI, no deben salir de la base de
   datos. El contacto real solo se revela dentro de la plataforma, tras
   iniciar sesión, y solo cuando ambas partes aceptaron un canal de
   contacto mediado.
3. **Anti-fraude por capas de confianza social, no por biometría.** La
   verificación (validación entre pares, respaldo institucional,
   verificación de correo) **suma** confianza visible; nunca es un
   requisito para publicar una necesidad. Eso protegería menos a quien
   más lo necesita: la persona más aislada, sin red de apoyo cercana.
4. **Separación de código y datos.** El código es público; los datos de
   personas y documentos de organizaciones, no. `.env` y los datos
   DIVIPOLA nunca se versionan en el repositorio.
5. **Código abierto, licencia AGPL-3.0.** Cualquiera puede auditar,
   adaptar y reutilizar esta plataforma para su propio contexto.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** estricto.
- **Tailwind CSS v4** (configuración por CSS, sin `tailwind.config.js`).
- **PostgreSQL 16** + **Prisma 6** como ORM.
- **NextAuth v5** (credenciales + bcrypt, sesión JWT).
- **Zod** para validación de formularios y Server Actions.
- **MailerSend** para correo transaccional (verificación de cuenta,
  avisos del canal de contacto).
- **pnpm** como gestor de paquetes.

## Cómo levantar el proyecto en local

### Requisitos

- Node.js 20+
- [pnpm](https://pnpm.io/) (el repo fija la versión en `packageManager`)
- Docker y Docker Compose (para Postgres)

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/juanelsinergiadero/reconstruircolombia.git
cd reconstruircolombia
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Completa `.env` con tus propios valores:

- `AUTH_SECRET`: genera uno con `openssl rand -hex 24`.
- `DATABASE_URL` / `DB_PASSWORD`: deben coincidir entre sí; el valor por
  defecto en `.env.example` funciona con el Postgres de desarrollo del
  paso siguiente.
- `MAILERSEND_API_KEY`: un token con alcance "Email" de
  [MailerSend](https://www.mailersend.com/). Sin esta variable, el envío
  de correos falla de forma controlada (no rompe el flujo que lo llama)
  y simplemente no se envían avisos.
- `APP_URL`: URL base para los enlaces de los correos (en local,
  `http://localhost:3000`).

`.env` nunca se sube al repositorio (está en `.gitignore`).

### 3. Levantar Postgres

```bash
docker compose -f docker-compose.dev.yml up -d
```

Esto crea un contenedor `reconstruir-db-dev` en `127.0.0.1:5433`, atado
solo a la propia máquina.

### 4. Migrar la base de datos

```bash
npx prisma migrate dev
```

### 5. Sembrar los datos de geografía (DIVIPOLA)

El seed espera dos CSV en `prisma/data/`, que **no** se versionan por ser
datos externos voluminosos (son datos públicos del DANE, no información
sensible):

- `prisma/data/departamentos.csv` con columnas
  `codigo_departamento, nombre_departamento, longitud, latitud`
- `prisma/data/municipios.csv` con columnas
  `cod_dpto, dpto, cod_mpio, nom_mpio, tipo_municipio, longitud, latitud`

Consigue la codificación DIVIPOLA vigente desde las fuentes oficiales del
DANE (por ejemplo, el portal de datos abiertos del Estado colombiano) y
guárdala en esas rutas con esas columnas. Luego:

```bash
pnpm seed
```

El seed es idempotente (usa `upsert`): puedes correrlo varias veces sin
duplicar datos.

### 6. Levantar el servidor de desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Otros comandos útiles

```bash
pnpm build        # build de produccion
pnpm lint         # ESLint
npx tsc --noEmit  # chequeo de tipos sin emitir archivos
```

## Estructura del dominio

El modelo de datos está anclado en marcos humanitarios reales (clústeres
ONU/Esfera, RUD/RUNDA de la UNGRD):

- **Necesidad**: el núcleo del MVP. Categorías en lenguaje de la persona
  (agua y saneamiento, alimentos, alojamiento, salud, higiene, ropa y
  abrigo, protección, educación, rescate, otro), urgencia, población
  vulnerable presente (menores, adultos mayores, personas con
  discapacidad, gestantes, enfermos crónicos), y quién reporta (la propia
  persona u otra en su nombre).
- **Organizacion**: instituciones educativas, Juntas de Acción Comunal,
  fundaciones, colectivos y entidades oficiales que pueden reportar en
  nombre de su comunidad.
- **Validacion**: validación por pares con salvaguardas anti-fraude —
  identidad siempre requerida (nunca anónima), no autovalidación, y una
  validación por persona por necesidad.
- **SolicitudContacto**: el canal de contacto mediado. Un donante pide
  ayudar; el autor de la necesidad decide si acepta. Solo entonces se
  revela el contacto, dentro de la plataforma, a las dos partes.

## Licencia

[AGPL-3.0-only](LICENSE).

## Contribuciones

El proyecto es de código abierto y recibe contribuciones externas. Lee
la [guía de contribución](CONTRIBUTING.md) para instrucciones de cómo
levantar el proyecto en local, las convenciones del repositorio y el
flujo de fork → rama → Pull Request. Al participar aceptas seguir el
[Código de Conducta](CODE_OF_CONDUCT.md).
