import { supplmentSchema, authSchema } from '../validation';

describe('Validation Schemas', () => {
  describe('supplmentSchema', () => {
    it('should validate valid supplement data', () => {
      const validData = {
        nombre: 'Vitamina D3',
        dosis: '5000 UI',
        frecuencia: 'diario' as const,
        hora: '08:00',
        categoria: 'vitaminas' as const,
        notas: 'Tomar con comida',
        activo: true,
      };

      const result = supplmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject data without nombre', () => {
      const invalidData = {
        nombre: '',
        dosis: '5000 UI',
        frecuencia: 'diario' as const,
        categoria: 'vitaminas' as const,
        activo: true,
      };

      const result = supplmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El nombre es obligatorio');
      }
    });

    it('should reject data without dosis', () => {
      const invalidData = {
        nombre: 'Vitamina D3',
        dosis: '',
        frecuencia: 'diario' as const,
        categoria: 'vitaminas' as const,
        activo: true,
      };

      const result = supplmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La dosis es obligatoria');
      }
    });

    it('should reject nombre longer than 100 characters', () => {
      const invalidData = {
        nombre: 'a'.repeat(101),
        dosis: '5000 UI',
        frecuencia: 'diario' as const,
        categoria: 'vitaminas' as const,
        activo: true,
      };

      const result = supplmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El nombre es demasiado largo');
      }
    });

    it('should reject invalid frecuencia', () => {
      const invalidData = {
        nombre: 'Vitamina D3',
        dosis: '5000 UI',
        frecuencia: 'invalid' as const,
        categoria: 'vitaminas' as const,
        activo: true,
      };

      const result = supplmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid supplement with optional fields missing', () => {
      const minimalValidData = {
        nombre: 'Vitamina D3',
        dosis: '5000 UI',
        frecuencia: 'diario' as const,
        categoria: 'vitaminas' as const,
      };

      const result = supplmentSchema.safeParse(minimalValidData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hora).toBeUndefined();
        expect(result.data.notas).toBeUndefined();
        expect(result.data.activo).toBe(true);
      }
    });
  });

  describe('authSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = authSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate valid register data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        nombre: 'Test User',
      };

      const result = authSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      };

      const result = authSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('correo electrónico');
      }
    });

    it('should reject password shorter than 6 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345',
      };

      const result = authSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos 6 caracteres');
      }
    });

    it('should reject nombre shorter than 2 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        nombre: 'A',
      };

      const result = authSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos 2 caracteres');
      }
    });
  });
});
