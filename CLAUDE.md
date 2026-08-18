# reconstruircolombia

Plataforma humanitaria de codigo abierto que conecta necesidades de personas
damnificadas con ofrecimientos de ayuda, segmentada por departamento y municipio
(DIVIPOLA del DANE). Respuesta al terremoto del 10 de agosto de 2026 (Mw 7.4,
epicentro San Jose del Palmar, Choco).

Repo: github.com/juanelsinergiadero/reconstruircolombia (privado por ahora).
Licencia: AGPL-3.0-only.

---

## Principios NO negociables (mandan sobre velocidad y tecnica)

1. **Pensar primero en el damnificado.** La persona que perdio todo debe poder
   pedir ayuda con la minima barrera posible. Ninguna decision de producto puede
   subir esa barrera (esto ya descarto verificacion biometrica/facial en v1).
2. **Privacidad de datos sensibles.** Ubicacion, contacto y vulnerabilidades son
   datos delicados. Los campos de contacto de `Necesidad` (contactoNombre,
   contactoTelefono, contactoEmail) NUNCA se exponen en listados publicos ni en
   el mapa abierto; solo por canal controlado. La capa de API debe omitirlos por
   defecto.
3. **Anti-fraude y verificacion como nucleo**, no como extra. En v1 se apoya en
   registro con cuenta + (proximo) verificacion de email. La verificacion robusta
   (comunidad, canales oficiales UNGRD/alcaldias) llega en v2, NO con biometria.
4. **Separacion estricta codigo/datos.** El codigo es publico; los datos de
   personas jamas van al repo ni viajan sin cifrar. El `.env` y los CSV de
   DIVIPOLA estan en `.gitignore`.

---

## Stack y versiones (FIJADAS deliberadamente, no cambiar sin razon)

- **Next.js 15.5.23** (App Router). NO subir a 16: la tuberia y NextAuth estan
  validadas sobre 15. Fue decision explicita.
- **React 19.2**, **TypeScript estricto**, **Tailwind v4** (config por CSS, sin
  tailwind.config.ts).
- **Prisma 6.19.3**. NO subir a 7: la 7 rompe el singleton y exige driver adapter.
  Decision explicita por coherencia con la tuberia.
- **NextAuth v5** (5.0.0-beta.32) con CredentialsProvider + bcrypt, estrategia JWT.
- **PostgreSQL 16** en Docker. **pnpm** como gestor. **Zod 4** para validacion.

---

## Convenciones

- **Español siempre**: UI, comentarios, mensajes, y commits en español.
- **TypeScript estricto**, nunca JavaScript puro.
- **Nunca asumir codigo/rutas/config sin verificar.** Pedir el archivo o el
  comando de diagnostico antes de proponer.
- Nombres de dominio en español (Necesidad, Departamento, Municipio, Rol).
- Identidad geografica = codigo DIVIPOLA como String (2 digitos depto, 5 municipio).
  NUNCA como Int: perder el cero a la izquierda ("05") rompe el join.

---

## Infraestructura

- Servidor: srv1694606 (187.77.203.30), 2 vCPU, 7.8 GB RAM, Ubuntu 24.
- Proyecto en `/var/www/reconstruircolombia`.
- Postgres DEV en Docker: contenedor `reconstruir-db-dev`, puerto 127.0.0.1:5433,
  base `reconstruir_dev_db`, usuario `reconstruir_user`.
  Levantar: `docker compose -f docker-compose.dev.yml up -d`.
- PROD (pendiente): usara puerto 5434. Estrategia espejo DEV -> PROD con backups.
- Deploy key SSH: alias `github-reconstruircolombia` en ~/.ssh/config.
- ADVERTENCIA: el `.env` de dev tiene contraseña temporal `12345678`.
  CAMBIAR antes de prod (openssl rand -hex 24).

---

## Estado actual (que esta hecho y verificado)

- [x] Infra: servidor, Docker, Postgres dev aislado.
- [x] Schema Prisma migrado: Departamento, Municipio, User (rol + municipio),
      Necesidad. Enums: Rol, CategoriaNecesidad, Urgencia, EstadoNecesidad.
      (Ofrecimiento y Verificacion se dejaron para v2, no estan en el schema.)
- [x] Seed DIVIPOLA ejecutado: 33 departamentos, 1122 municipios, con coordenadas.
      CSV en prisma/data/ (ignorados por git; descargar del DANE si faltan, ver
      comentarios en prisma/seed.ts).
- [x] Auth: NextAuth v5 completo (lib/auth.ts, lib/auth.config.ts edge-safe,
      types/next-auth.d.ts, middleware.ts, route handler). Compila limpio.
- [x] Logica de registro de necesidades:
      - lib/validations/necesidad.ts (esquema Zod)
      - lib/geo.ts (departamentos, municipios por depto, municipioExiste)
      - app/necesidades/nueva/actions.ts (Server Action crearNecesidad:
        valida sesion + Zod + integridad de municipio, luego persiste)

## Lo que sigue (v1 MVP)

- [ ] Formulario `/necesidades/nueva` (page.tsx): selector jerarquico
      departamento -> municipio encadenado, campos, useActionState con la
      Server Action ya escrita. Requiere login (ya lo fuerza el middleware).
- [ ] Listado publico `/necesidades` (page.tsx): filtrable por departamento y
      municipio. NO mostrar campos de contacto sensibles.
- [ ] Paginas /sign-in y /registro (auth ya soporta el flujo).
- [ ] Verificacion de email con Resend.
- [ ] Ajustar layout.tsx: lang="es" y metadata real (aun tiene el del scaffold).

## Alcance por fases

- **v1 (MVP)**: registrar necesidad geo-etiquetada -> verla en lista/mapa
  filtrable -> contacto seguro. Nada mas.
- **v2**: verificacion de necesidades, emparejamiento de ofrecimientos, roles y
  moderacion.
- **v3**: dashboards, escala nacional, canales SMS/WhatsApp, integracion oficial.

Pagos/donaciones (Wompi): NO en v1. Solo cuando la verificacion este madura.
