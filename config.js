// Configuration Supabase pour Holiday Planning
// Ce fichier contient uniquement la clé PUBLIQUE (anon key) qui est sécurisée par RLS

const SUPABASE_CONFIG = {
    // URL de votre projet Supabase
    url: 'https://your-project-id.supabase.co',

    // Clé publique (anon key) - SAFE pour être exposée côté client
    // Cette clé est protégée par Row Level Security (RLS)
    anonKey: 'your-anon-key-here',

    // Options de configuration
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
};

// ⚠️ IMPORTANT : JAMAIS mettre la service_role key ici !
// La service_role key doit rester SECRÈTE et utilisée uniquement côté serveur
