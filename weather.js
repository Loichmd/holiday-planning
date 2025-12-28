// ============================================
// WEATHER API - OpenWeatherMap
// ============================================

/**
 * Récupère la météo pour une ville et une date
 * @param {string} location - Nom de la ville (ex: "Paris, FR")
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {Promise<{success: boolean, weather?: {temp: number, description: string, icon: string}, error?: string}>}
 */
async function getWeatherForLocation(location, date) {
    if (!location || !WEATHER_CONFIG.apiKey || WEATHER_CONFIG.apiKey === 'VOTRE_CLE_API_OPENWEATHERMAP_ICI') {
        return { success: false, error: 'Clé API non configurée ou lieu manquant' };
    }

    try {
        // D'abord géocoder le lieu pour obtenir les coordonnées
        const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${WEATHER_CONFIG.apiKey}`;

        const geocodeResponse = await fetch(geocodeUrl);
        if (!geocodeResponse.ok) {
            throw new Error('Erreur lors du géocodage');
        }

        const geocodeData = await geocodeResponse.json();
        if (!geocodeData || geocodeData.length === 0) {
            return { success: false, error: 'Lieu non trouvé' };
        }

        const { lat, lon } = geocodeData[0];

        // Calculer le nombre de jours entre aujourd'hui et la date demandée
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(date + 'T12:00:00');
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Si c'est dans le futur (< 8 jours), utiliser les prévisions
        if (diffDays >= 0 && diffDays < 8) {
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${WEATHER_CONFIG.units}&lang=${WEATHER_CONFIG.lang}&appid=${WEATHER_CONFIG.apiKey}`;

            const forecastResponse = await fetch(forecastUrl);
            if (!forecastResponse.ok) {
                throw new Error('Erreur lors de la récupération des prévisions');
            }

            const forecastData = await forecastResponse.json();

            // Filtrer les prévisions pour la date demandée
            const targetDateStr = date;
            const dayForecasts = forecastData.list.filter(item => {
                const itemDate = item.dt_txt.split(' ')[0];
                return itemDate === targetDateStr;
            });

            if (dayForecasts.length === 0) {
                return { success: false, error: 'Pas de prévisions pour cette date' };
            }

            // Calculer la température moyenne et prendre la description la plus fréquente
            const avgTemp = dayForecasts.reduce((sum, item) => sum + item.main.temp, 0) / dayForecasts.length;
            const midDayForecast = dayForecasts[Math.floor(dayForecasts.length / 2)] || dayForecasts[0];

            return {
                success: true,
                weather: {
                    temp: Math.round(avgTemp),
                    description: midDayForecast.weather[0].description,
                    icon: midDayForecast.weather[0].icon
                }
            };
        } else {
            // Pour les dates trop lointaines ou passées, ne pas afficher la météo
            return { success: false, error: 'Date hors période de prévisions (8 jours max)' };
        }
    } catch (error) {
        console.error('Erreur météo:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Récupère l'icône météo OpenWeatherMap
 * @param {string} iconCode - Code de l'icône (ex: "01d")
 * @returns {string} URL de l'icône
 */
function getWeatherIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

/**
 * Cache pour stocker les données météo et éviter trop d'appels API
 */
const weatherCache = new Map();

/**
 * Récupère la météo avec cache
 * @param {string} location - Nom de la ville
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {Promise<Object>}
 */
async function getWeatherWithCache(location, date) {
    const cacheKey = `${location}_${date}`;

    // Vérifier le cache (valide 1 heure)
    if (weatherCache.has(cacheKey)) {
        const cached = weatherCache.get(cacheKey);
        const age = Date.now() - cached.timestamp;
        if (age < 3600000) { // 1 heure
            return cached.data;
        }
    }

    // Récupérer la météo
    const result = await getWeatherForLocation(location, date);

    // Mettre en cache si succès
    if (result.success) {
        weatherCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
    }

    return result;
}
