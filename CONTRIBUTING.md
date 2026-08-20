# Contribuir a reconstruircolombia

Gracias por tu interés en contribuir. reconstruircolombia es una
plataforma humanitaria de código abierto que conecta las **necesidades**
de personas damnificadas por el terremoto del 10 de agosto de 2026 (Mw
7.4, epicentro San José del Palmar, Chocó) con las **ofrecimientos de
ayuda** de la comunidad, segmentada por departamento y municipio
(DIVIPOLA del DANE). Cada línea de código que se mejora aquí puede
traducirse en que una familia reciba ayuda más rápido, así que gracias
por tomarte el tiempo.

## Antes de empezar

Para cambios grandes (nuevas funcionalidades, cambios de modelo de
datos, refactors amplios), abre primero un issue para conversar el
enfoque antes de invertir tiempo escribiendo código. Para bugs pequeños
o mejoras puntuales, puedes ir directo al PR.

## Cómo levantar el proyecto en local

La guía completa está en el [README](README.md#cómo-levantar-el-proyecto-en-local).
En resumen:

1. Clona el repo e instala dependencias con `pnpm install`.
2. Copia `.env.example` a `.env` y completa los valores (ver el README
   para el detalle de cada variable). `.env` nunca se sube al repo.
3. Levanta Postgres con Docker: `docker compose -f docker-compose.dev.yml up -d`.
4. Corre las migraciones: `npx prisma migrate dev`.
5. Siembra los datos de geografía DIVIPOLA (`pnpm seed`) siguiendo las
   instrucciones del README para conseguir los CSV del DANE.
6. Levanta el servidor de desarrollo: `pnpm dev`.

## Convenciones del proyecto

- **Español siempre.** UI, comentarios, mensajes de commit y de PR van
  en español. Nombres de dominio también en español (`Necesidad`,
  `Organizacion`, `Validacion`, `Rol`).
- **TypeScript estricto, nunca JavaScript puro.** No se aceptan archivos
  `.js`/`.jsx` nuevos en el código de la aplicación. Escribe archivos
  completos, no fragmentos ni parches a mano.
- **Respeta el stack fijado.** El proyecto fija versiones de propósito
  (Next.js 15, React 19, Prisma 6, NextAuth v5, Tailwind v4, Zod 4).
  No propongas upgrades de major version (por ejemplo, Next.js 16 o
  Prisma 7) sin discutirlo antes en un issue: son decisiones deliberadas,
  no descuido.
- **Mobile-first.** Toda UI nueva se diseña primero para móvil de gama
  baja: es el dispositivo con el que la persona damnificada entra a la
  plataforma.
- **Antes de abrir el PR**, corre y verifica que pasen sin errores:

  ```bash
  npx tsc --noEmit
  pnpm lint
  ```

## Flujo de contribución

1. Haz un fork del repositorio.
2. Crea una rama descriptiva a partir de `main` (por ejemplo,
   `fix/validacion-duplicada` o `feat/filtro-por-categoria`).
3. Haz tus cambios siguiendo las convenciones de arriba.
4. Abre un Pull Request contra `main` con una descripción clara de qué
   cambia y por qué. Usa la plantilla de PR que aparece automáticamente.
5. Todas las contribuciones pasan por revisión del mantenedor antes de
   integrarse. Es normal que se pidan ajustes.

## Principios no negociables

Estos principios están por encima de la velocidad y de la conveniencia
técnica. Cualquier contribución debe respetarlos:

1. **Mínima barrera para pedir ayuda.** No propongas cambios que
   agreguen trámites o fricción al reporte de una necesidad (por
   ejemplo, verificación biométrica).
2. **Privacidad de los datos sensibles.** Los campos de contacto de la
   persona afectada (`contactoNombre`, `contactoTelefono`,
   `contactoEmail`) y su radicado oficial (`radicadoRud`) nunca se
   exponen en listados públicos ni en el mapa abierto. Cualquier
   consulta pública a la base de datos debe usar `select` explícito en
   Prisma que los excluya: no basta con ocultarlos en la UI, no deben
   salir de la base de datos.
3. **Anti-fraude por capas de confianza social, nunca por biometría.**
   La verificación (validación entre pares, respaldo institucional)
   suma confianza visible, pero nunca es requisito para publicar una
   necesidad.
4. **Separación de código y datos.** Nunca subas al repositorio tu
   archivo `.env`, credenciales, ni datos reales de personas o
   documentos de organizaciones. Los datos DIVIPOLA (`prisma/data/*.csv`)
   tampoco se versionan, aunque sean públicos.

Si tienes dudas sobre si un cambio choca con alguno de estos principios,
pregunta en el issue o en el PR antes de continuar.

## Código de conducta

Al participar en este proyecto aceptas seguir nuestro
[Código de Conducta](CODE_OF_CONDUCT.md).
