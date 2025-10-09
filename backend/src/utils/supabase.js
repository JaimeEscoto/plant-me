const toHttpError = (supabaseError, fallbackMessage = 'Error al comunicarse con Supabase') => {
  if (!supabaseError) {
    return null;
  }

  const error = new Error(fallbackMessage);
  error.status = 500;
  error.details = {
    message: supabaseError.message,
    hint: supabaseError.hint,
    details: supabaseError.details,
    code: supabaseError.code,
  };
  return error;
};

module.exports = { toHttpError };
