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
- localStorage pour la persistance des données

## Licence

Libre d'utilisation pour vos projets personnels.
