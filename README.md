# ✈️ Planning Vacances

Application web collaborative de planification de voyages avec authentification OAuth et stockage cloud.

## 📱 Fonctionnalités

### Vue Calendrier
- Calendrier mensuel interactif avec timeline des activités
- Visualisation jour par jour
- Indicateurs de présence d'activités

### Vue Planning Hebdomadaire
- 52 semaines scrollables de l'année
- Responsive : 7 colonnes (desktop) / 1 colonne (mobile)
- Champ région/ville/étape par jour
- Scroll automatique intelligent

### Gestion Multi-Projets
- Créer et gérer plusieurs voyages simultanément
- Sélecteur dropdown avec compteur d'activités
- Modification et suppression de projets

### Activités Complètes
- Types : ✈️ Vol, 🏨 Hôtel, 🎯 Activité, 🍽️ Restaurant
- Date, heure, durée
- Lieu, URL de référence, notes
- Voyageurs par activité
- Pièces jointes (stockage cloud)

### Authentification OAuth
- Google
- Microsoft (Azure AD)
- Apple (optionnel)
- Session sécurisée avec JWT

## 🏗️ Architecture

```
Frontend (Nginx)
    ↓
Supabase Cloud
├── Authentication (OAuth)
├── PostgreSQL Database
├── Storage (Fichiers)
└── Row Level Security
```

### Stack Technique

**Frontend :**
- HTML5 + CSS3 (Grid, Flexbox)
- Vanilla JavaScript (ES6+)
- Supabase JS Client
- Responsive Mobile-First

**Backend :**
- Supabase (BaaS)
- PostgreSQL 15
- Row Level Security (RLS)
- Storage S3-compatible

**Infrastructure :**
- GitHub (code repository)
- Coolify (orchestration + CI/CD auto-deploy)
- Docker + Nginx
- Let's Encrypt SSL
- VPS Hostinger

## 🚀 Déploiement

**⭐ Recommandé : GitHub + Coolify**

Voir le [Guide de Déploiement Coolify](./DEPLOYMENT_COOLIFY.md) pour :
- Configuration Supabase pas à pas
- Setup OAuth (Google, Microsoft)
- Déploiement Coolify + Auto-deploy sur push
- Configuration DNS et SSL automatique
- Migration des données

**Alternative : Dokploy**

Voir le [Guide de Déploiement Dokploy](./DEPLOYMENT.md) (alternative si tu préfères Dokploy)

**Résumé rapide (Coolify) :**

```bash
# 1. Configurer Supabase (15 min)
# - Créer un projet sur supabase.com
# - Exécuter database/schema.sql
# - Configurer OAuth Google

# 2. Créer repo GitHub (5 min)
cp frontend/config.js.example frontend/config.js
# Éditer config.js avec tes clés Supabase
git init && git add . && git commit -m "Initial commit"
git push origin main

# 3. Déployer sur Coolify (15 min)
# - Connecter GitHub à Coolify (GitHub App)
# - Créer application : planning-vacances
# - Build context: ./frontend
# - Activer auto-deploy
# - Deploy !

# 4. Push = Auto-deploy 🎉
git push origin main  # → Coolify redéploie automatiquement
```

**⚡ Guide rapide : [QUICKSTART_COOLIFY.md](./QUICKSTART_COOLIFY.md)** (45-60 min)

## 📂 Structure du Projet

```
planning-vacances/
├── frontend/
│   ├── index.html          # Interface utilisateur
│   ├── styles.css          # Design responsive
│   ├── app.js              # Logique applicative
│   ├── supabase.js         # Client Supabase
│   ├── config.js           # Configuration API
│   ├── Dockerfile          # Build Nginx
│   └── nginx.conf          # Config serveur
│
├── backend/ (optionnel)
│   ├── server.js           # API Node.js custom
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── database/
│   └── schema.sql          # Schéma PostgreSQL complet
│
├── docker-compose.yml      # Orchestration complète
├── .env.example
├── DEPLOYMENT.md           # Guide complet
└── README.md
```

## 🗄️ Schéma de Base de Données

**Tables principales :**

- `profiles` - Profils utilisateurs (lié à Supabase Auth)
- `projects` - Voyages/projets
- `project_shares` - Partage de projets (owner/editor/viewer)
- `activities` - Activités planifiées
- `activity_attachments` - Pièces jointes (métadonnées)
- `day_regions` - Lieux/étapes par jour

**Sécurité :**
- Row Level Security (RLS) activée sur toutes les tables
- Policies par rôle (owner, editor, viewer)
- Storage policies pour les fichiers

## 🔐 Sécurité

- ✅ Authentification OAuth sécurisée
- ✅ JWT tokens avec expiration
- ✅ Row Level Security (RLS)
- ✅ HTTPS obligatoire
- ✅ Protection CORS
- ✅ Headers de sécurité (CSP, X-Frame-Options)
- ✅ Validation côté serveur

## 🎨 Design

- **Mobile-First** : Optimisé pour smartphones
- **Responsive** : S'adapte de 320px à 4K
- **Moderne** : Inspiration Apple/Google Calendar
- **Accessible** : Couleurs contrastées, hover states
- **Performance** : Lazy loading, caching

## 📊 Limites & Performance

**Plan Gratuit Supabase :**
- 500 MB de database
- 1 GB de storage
- 5 GB de bande passante/mois
- Illimité en users

**Optimisations :**
- Gzip compression
- Cache navigateur (1 an pour assets)
- Index database optimisés
- Requêtes avec `.select()` ciblées

## 🧪 Développement Local

### Frontend uniquement

```bash
cd frontend
python3 -m http.server 8080
# Ouvre http://localhost:8080
```

### Avec Docker

```bash
docker-compose up
# Frontend: http://localhost
# Backend: http://localhost:3000
```

### Variables d'environnement

Crée un fichier `frontend/config.js` :

```javascript
export const SUPABASE_CONFIG = {
    url: 'http://localhost:54321', // Supabase local
    anonKey: 'your-anon-key'
};
```

## 🛠️ Maintenance

### Backups

Supabase fait des backups automatiques quotidiens (7 jours de rétention).

Pour un backup manuel :
```bash
# Via Supabase Dashboard
Database → Backups → Create Backup
```

### Monitoring

- Logs : Dokploy Dashboard
- Métriques : Supabase Dashboard
- Errors : Browser Console + Supabase Logs

### Mises à jour

```bash
git pull origin main
# Dans Dokploy, cliquer "Redeploy"
```

## 🐛 Troubleshooting

Voir [DEPLOYMENT.md - Troubleshooting](./DEPLOYMENT.md#troubleshooting) pour :
- Problèmes OAuth
- Erreurs CORS
- Upload de fichiers
- Migration de données

## 📝 Roadmap

**Version 1.0 (actuelle)**
- ✅ Authentification OAuth
- ✅ CRUD Projets & Activités
- ✅ Upload fichiers
- ✅ Vue Calendrier & Planning
- ✅ Responsive mobile

**Version 1.1 (future)**
- [ ] Partage de projets entre users
- [ ] Notifications email
- [ ] Export PDF du planning
- [ ] Mode hors-ligne (PWA)
- [ ] Dark mode

**Version 2.0 (long terme)**
- [ ] Application mobile (React Native)
- [ ] Intégration Google Maps
- [ ] Suggestions d'activités (IA)
- [ ] Calcul budget automatique

## 📄 Licence

Projet personnel - Tous droits réservés

## 🤝 Contribution

Ce projet est actuellement privé. Pour toute suggestion :
- Ouvre une issue
- Contacte-moi directement

## 📞 Support

**Documentation :**
- [Guide de Déploiement](./DEPLOYMENT.md)
- [Supabase Docs](https://docs.supabase.com)
- [Dokploy Docs](https://docs.dokploy.com)

**Contact :**
- Email : [ton-email@example.com]
- GitHub : [@ton-username]

---

**Développé avec ❤️ et Claude Code**

Bon voyage ! ✈️🌍
