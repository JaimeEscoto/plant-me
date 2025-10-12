const { registerSchema, loginSchema } = require('../../src/validations/authValidation');

describe('authValidation', () => {
  test('registerSchema validates correct payload', () => {
    const payload = {
      nombre_usuario: 'usuario123',
      email: 'user@example.com',
      contrasena: 'password1',
    };

    const { error } = registerSchema.validate(payload);
    expect(error).toBeUndefined();
  });

  test('registerSchema rejects weak password', () => {
    const payload = {
      nombre_usuario: 'usuario123',
      email: 'user@example.com',
      contrasena: 'password',
    };

    const { error } = registerSchema.validate(payload);
    expect(error).toBeDefined();
  });

  test('loginSchema requires both fields', () => {
    const { error: missingEmail } = loginSchema.validate({ contrasena: 'abc' });
    expect(missingEmail).toBeDefined();

    const { error: missingPassword } = loginSchema.validate({ email: 'user@example.com' });
    expect(missingPassword).toBeDefined();
  });
});
