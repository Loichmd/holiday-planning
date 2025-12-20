# Planning Vacances

Une application web complète pour organiser vos voyages et vacances en toute simplicité.

## Fonctionnalités

- **Multi-projets** : Gérez plusieurs voyages simultanément
- **Calendrier intuitif** : Visualisez vos activités jour par jour
- **Vue planning hebdomadaire** : Vue d'ensemble de toutes vos semaines
- **Catégories d'activités** : Vols, Hôtels, Restaurants, Activités
- **Gestion des voyageurs** : Attribuez des participants à chaque activité
- **Pièces jointes** : Ajoutez des documents (billets, réservations, etc.)
- **Localisation** : Enregistrez les lieux pour chaque jour
- **Stockage local** : Toutes vos données restent dans votre navigateur

## Utilisation

L'application fonctionne entièrement côté client (pas de serveur requis). Vos données sont stockées localement dans votre navigateur via localStorage.

### Mode démo

Cliquez sur "Essayer sans compte" pour tester l'application immédiatement.

### Multi-utilisateurs (simulation)

L'application simule une authentification avec Google, Microsoft ou Apple. En production, ces boutons devraient être connectés à de vrais services OAuth.

## Déploiement sur GitHub Pages

Ce projet est déployé sur GitHub Pages et accessible directement via votre navigateur.

### URL de déploiement

Une fois configuré, votre application sera accessible à l'adresse :
`https://[votre-username].github.io/holiday-planning/`

### Configuration

1. Allez dans les paramètres de votre repository GitHub
2. Section "Pages"
3. Source : Sélectionnez "Deploy from a branch"
4. Branch : Sélectionnez "main" et dossier "/ (root)"
5. Cliquez sur "Save"

## Structure du projet

```
/
├── index.html              # Application principale
├── planning-with-views.html # Fichier source original
├── OLD/                    # Anciens fichiers
├── README.md              # Cette documentation
└── .gitignore            # Fichiers ignorés par git
```

## Technologies utilisées

- HTML5
- CSS3 (Responsive design)
- JavaScript Vanilla (pas de framework)
- Supabase (base de données et authentification)
- localStorage pour la persistance locale (mode hors ligne)

## Sécurité avec Supabase

### Configuration sécurisée pour GitHub Pages public

Ce projet utilise Supabase avec une configuration sécurisée adaptée à un repository public :

1. **Seule la clé publique (`anon key`) est exposée** dans `config.js`
2. **Row Level Security (RLS) protège toutes les données**
3. **Chaque utilisateur ne voit que ses propres données**

### Configuration rapide

1. Créez un compte sur [Supabase](https://supabase.com)
2. Récupérez vos clés dans **Settings > API**
3. Éditez `config.js` avec votre URL et votre `anon key`
4. Configurez les policies RLS (voir [SECURITY.md](SECURITY.md))

### Documentation de sécurité complète

📖 **Lisez le guide complet** : [SECURITY.md](SECURITY.md)

Ce guide contient :
- Explication des 2 types de clés Supabase
- Configuration complète des Row Level Security (RLS)
- Schéma de base de données
- Policies SQL pour protéger vos données
- Checklist de sécurité
- Configuration de l'authentification OAuth

⚠️ **Important** : Sans RLS, vos données seront accessibles à tous, même avec la clé publique !

## Licence

Libre d'utilisation pour vos projets personnels.
