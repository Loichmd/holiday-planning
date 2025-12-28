# Configuration Météo OpenWeatherMap

## 🌤️ Obtenir votre clé API (gratuite)

1. Allez sur [https://openweathermap.org/](https://openweathermap.org/)
2. Cliquez sur **Sign Up** (ou Sign In si vous avez déjà un compte)
3. Créez votre compte gratuit
4. Allez dans **API Keys** dans votre profil
5. Copiez votre clé API (ou créez-en une nouvelle)

## 🔧 Configuration

1. Ouvrez le fichier **`config.js`**
2. Trouvez la ligne :
   ```javascript
   apiKey: 'VOTRE_CLE_API_OPENWEATHERMAP_ICI',
   ```
3. Remplacez `VOTRE_CLE_API_OPENWEATHERMAP_ICI` par votre vraie clé API
4. Sauvegardez le fichier

**Exemple :**
```javascript
const WEATHER_CONFIG = {
    apiKey: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', // Votre vraie clé
    units: 'metric',
    lang: 'fr'
};
```

## ✅ Vérification

1. Ouvrez votre application
2. Allez dans la vue **Planning Hebdomadaire**
3. Ajoutez un **lieu** à un jour (ex: "Paris, France")
4. La météo devrait s'afficher en haut à droite du jour

## 📌 Important

- La clé API gratuite permet **1000 appels/jour**
- Les prévisions sont disponibles jusqu'à **8 jours** dans le futur
- La météo est mise en **cache 1 heure** pour économiser les appels
- Si un jour n'a pas de lieu, la météo ne s'affiche pas

## 🔒 Sécurité

Le fichier `config.js` est dans `.gitignore` et ne sera **jamais commité** sur GitHub.
Votre clé API reste **privée** sur votre machine.

## 🐛 Problèmes courants

**La météo ne s'affiche pas ?**
- Vérifiez que vous avez bien ajouté votre clé API dans `config.js`
- Vérifiez que le jour a un lieu défini (📍 en haut du jour)
- Ouvrez la console (F12) pour voir les erreurs éventuelles
- Attendez quelques minutes après création du compte OpenWeatherMap (activation de la clé)

**Erreur 401 (Unauthorized) ?**
- Votre clé API n'est pas valide ou pas encore activée
- Attendez 10-15 minutes après création du compte

**Pas de prévisions ?**
- Les prévisions sont disponibles uniquement pour les 8 prochains jours
- Pour les dates passées ou trop lointaines, la météo n'est pas affichée
