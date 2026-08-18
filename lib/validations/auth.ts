import { z } from 'zod'

// Esquemas de validacion de autenticacion (v1).
// El limite de 72 caracteres en password coincide con el truncamiento de
// bcrypt (72 bytes); dar el mismo limite en el formulario evita confundir
// al usuario con una contrasena que "se guarda distinto" a como la escribio.

export const registroSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(120, 'El nombre no puede exceder 120 caracteres'),
    email: z.string().trim().email('Correo invalido').max(255),
    password: z
      .string()
      .min(8, 'La contrasena debe tener al menos 8 caracteres')
      .max(72, 'La contrasena no puede exceder 72 caracteres'),
    confirmarPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmarPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmarPassword'],
  })

export type RegistroInput = z.infer<typeof registroSchema>

export const loginSchema = z.object({
  email: z.string().trim().email('Correo invalido'),
  password: z.string().min(1, 'La contrasena es obligatoria'),
})

export type LoginInput = z.infer<typeof loginSchema>
