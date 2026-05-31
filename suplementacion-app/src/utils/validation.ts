import { z } from 'zod';

export const supplmentSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre es demasiado largo'),
  dosis: z.string().min(1, 'La dosis es obligatoria').max(50, 'La dosis es demasiado larga'),
  frecuencia: z.enum(['diario', 'semanal', 'mensual'], {
    required_error: 'La frecuencia es obligatoria',
  }),
  hora: z.string().optional(),
  categoria: z.enum(['vitaminas', 'minerales', 'proteinas', 'aminoacidos', 'otros'], {
    required_error: 'La categoría es obligatoria',
  }),
  notas: z.string().max(500, 'Las notas son demasiado largas').optional(),
  activo: z.boolean().default(true),
});

export type SuplementoFormData = z.infer<typeof supplmentSchema>;

export const authSchema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
});

export type AuthFormData = z.infer<typeof authSchema>;
