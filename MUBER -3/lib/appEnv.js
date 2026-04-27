const appEnv = process.env.EXPO_PUBLIC_APP_ENV || "TEST";
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan variables de entorno de Supabase. Revisa tu archivo .env activo."
  );
}

export const APP_ENV = appEnv;
export const IS_REAL_ENV = appEnv === "REAL";
export const IS_TEST_ENV = appEnv === "TEST";
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;