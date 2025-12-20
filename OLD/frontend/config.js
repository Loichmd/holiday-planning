// Configuration Supabase
// ⚠️ IMPORTANT: Remplacer ces valeurs par celles de ton projet Supabase
export const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co', // Ton URL Supabase
    anonKey: 'your-anon-key-here' // Ta clé publique (anon key)
};

// Configuration OAuth (URLs de redirection)
export const AUTH_CONFIG = {
    redirectTo: window.location.origin // URL de redirection après OAuth
};
