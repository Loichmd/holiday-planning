// Configuration Supabase pour Holiday Planning
// Ce fichier contient uniquement la clé PUBLIQUE (anon key) qui est sécurisée par RLS

const SUPABASE_CONFIG = {
    // URL de votre projet Supabase
    url: 'https://tlvppqhpqgldvcnhnlun.supabase.co',

    // Clé publique (anon key) - SAFE pour être exposée côté client
    // Cette clé est protégée par Row Level Security (RLS)
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdnBwcWhwcWdsZHZjbmhubHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjc5NzMsImV4cCI6MjA4MTc0Mzk3M30.E8M3t8gygPgvdyI6Shp4mtwNGJhIqg2KW7JBdVXRd0A',

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

// Configuration OpenWeatherMap
const WEATHER_CONFIG = {
    apiKey: 'VOTRE_CLE_API_OPENWEATHERMAP_ICI', // Remplacez par votre vraie clé API
    units: 'metric', // Pour avoir les températures en Celsius
    lang: 'fr' // Pour avoir les descriptions en français
};
