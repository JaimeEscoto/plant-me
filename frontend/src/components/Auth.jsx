import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  nombre_usuario: '',
  email: '',
  contrasena: '',
};

const Auth = () => {
  const { login, register, loading, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (isLogin) {
        await login({ email: form.email, contrasena: form.contrasena });
      } else {
        await register(form);
      }
    } catch (err) {
      // El error se maneja desde el contexto
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gardenSky to-gardenGreen/40">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-center text-3xl font-bold text-gardenGreen">
          {isLogin ? 'Bienvenido a Mi Jardín Mental' : 'Crear una cuenta'}
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="nombre_usuario">
                Nombre de usuario
              </label>
              <input
                id="nombre_usuario"
                name="nombre_usuario"
                type="text"
                value={form.nombre_usuario}
                onChange={handleChange}
                className="w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                required
              />
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="contrasena">
              Contraseña
            </label>
            <input
              id="contrasena"
              name="contrasena"
              type="password"
              value={form.contrasena}
              onChange={handleChange}
              className="w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-full bg-gardenGreen py-2 font-semibold text-white transition hover:bg-emerald-600"
            disabled={loading}
          >
            {loading ? 'Procesando...' : isLogin ? 'Iniciar sesión' : 'Registrarme'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            type="button"
            className="font-semibold text-gardenGreen hover:underline"
            onClick={() => {
              setIsLogin((prev) => !prev);
              setForm(initialForm);
            }}
          >
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
