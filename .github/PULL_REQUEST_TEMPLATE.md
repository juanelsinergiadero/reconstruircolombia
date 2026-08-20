## Descripción

Describe brevemente qué cambia este PR y por qué.

Issue relacionado (si aplica): #

## Tipo de cambio

- [ ] Corrección de bug
- [ ] Nueva funcionalidad
- [ ] Cambio en el modelo de datos (Prisma)
- [ ] Refactor / mejora técnica sin cambio de comportamiento
- [ ] Documentación

## Cómo se probó

Describe cómo verificaste que el cambio funciona (pasos manuales,
capturas si aplica, etc.).

## Checklist

- [ ] Los commits y la descripción de este PR están en español.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] `pnpm lint` pasa sin errores.
- [ ] No incluye secretos, credenciales, ni contenido de `.env`.
- [ ] No incluye datos reales de personas damnificadas ni de
      organizaciones (nombres, teléfonos, correos, documentos).
- [ ] Si toca datos sensibles de `Necesidad` (contacto, `radicadoRud`),
      confirmo que las consultas públicas siguen usando `select`
      explícito que los excluye.
- [ ] Si agrega UI nueva, es mobile-first.
- [ ] No cambia versiones mayores del stack fijado (Next.js, React,
      Prisma, etc.) sin haberlo discutido antes en un issue.
