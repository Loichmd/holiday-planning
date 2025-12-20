# 🏗️ Architecture - Planning Vacances

Documentation technique de l'architecture de l'application.

---

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                         UTILISATEUR                         │
│                    (Navigateur Web)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Nginx)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  index.html + styles.css + app.js + supabase.js      │   │
│  │                                                       │   │
│  │  • Interface utilisateur (calendrier, planning)      │   │
│  │  • Client Supabase JS                                │   │
│  │  • Gestion des vues et états                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Déployé sur: Dokploy (Docker + Nginx)                     │
│  HTTPS: Let's Encrypt                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS/REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              AUTHENTICATION                         │    │
│  │  • OAuth 2.0 (Google, Microsoft, Apple)            │    │
│  │  • JWT tokens                                       │    │
│  │  • Session management                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              PostgreSQL DATABASE                    │    │
│  │  Tables:                                            │    │
│  │  • profiles (users)                                 │    │
│  │  • projects (voyages)                               │    │
│  │  • project_shares (partage)                         │    │
│  │  • activities (activités)                           │    │
│  │  • activity_attachments (métadonnées fichiers)      │    │
│  │  • day_regions (lieux par jour)                     │    │
│  │                                                      │    │
│  │  Sécurité: Row Level Security (RLS)                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              STORAGE (S3-compatible)                │    │
│  │  Buckets:                                           │    │
│  │  • activity-attachments (fichiers users)           │    │
│  │                                                      │    │
│  │  Sécurité: Storage Policies                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              REALTIME (optionnel)                   │    │
│  │  • WebSocket pour sync temps réel                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              BACKEND NODE.JS (Optionnel)                    │
│  • Logique métier complexe                                  │
│  • Migration localStorage → Supabase                        │
│  • Opérations bulk                                          │
│                                                              │
│  Déployé sur: Dokploy (Docker)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 Flux de Données

### 1. Authentification

```
User clique "Google"
    ↓
Frontend: supabase.auth.signInWithOAuth('google')
    ↓
Redirect vers Google OAuth
    ↓
User se connecte à Google
    ↓
Google redirect vers: https://xxxxx.supabase.co/auth/v1/callback
    ↓
Supabase valide le token OAuth
    ↓
Supabase crée/récupère l'user dans auth.users
    ↓
Trigger SQL crée le profil dans profiles
    ↓
Redirect vers: https://planning-vacances.ton-domaine.com
    ↓
Frontend: onAuthStateChange() détecte la session
    ↓
Frontend charge les données de l'user
```

### 2. Chargement des Données

```
User connecté
    ↓
Frontend: getProjects()
    ↓
Supabase: SELECT * FROM projects WHERE owner_id = user.id (RLS)
    ↓
Frontend: getActivities(projectId)
    ↓
Supabase: SELECT * FROM activities WHERE project_id = ... (RLS)
    ↓
Frontend: getDayRegions(projectId)
    ↓
Supabase: SELECT * FROM day_regions WHERE project_id = ... (RLS)
    ↓
Frontend: render UI
```

### 3. Création d'une Activité

```
User remplit le formulaire
    ↓
Frontend: saveActivity()
    ↓
Frontend: createActivity(data)
    ↓
Supabase: INSERT INTO activities VALUES (...)
    ↓
RLS vérifie que user a accès au project_id
    ↓
Trigger SQL: update updated_at timestamp
    ↓
Supabase retourne la nouvelle activité
    ↓
Frontend: reload activities
    ↓
Frontend: re-render calendrier/planning
```

### 4. Upload de Fichier

```
User sélectionne un fichier
    ↓
Frontend: uploadAttachment(activityId, projectId, file)
    ↓
Supabase Storage: upload vers activity-attachments/projects/{projectId}/activities/{activityId}/{filename}
    ↓
Storage Policy vérifie que user a accès au projectId
    ↓
Supabase retourne le file_path
    ↓
Frontend: INSERT INTO activity_attachments (activity_id, file_path, ...)
    ↓
RLS vérifie que user a accès à l'activité
    ↓
Frontend: affiche le fichier dans la liste
```

---

## 🗄️ Schéma de Base de Données

### Tables et Relations

```sql
auth.users (géré par Supabase)
    ↓ 1:1
profiles
    id (UUID, PK, FK → auth.users.id)
    email
    full_name
    avatar_url
    created_at, updated_at

    ↓ 1:N
projects
    id (UUID, PK)
    owner_id (UUID, FK → profiles.id)
    name
    description
    travelers (TEXT[])
    created_at, updated_at

    ↓ 1:N
activities
    id (UUID, PK)
    project_id (UUID, FK → projects.id)
    title, date, time, duration
    category (ENUM)
    location, url, notes
    travelers (TEXT[])
    created_at, updated_at

    ↓ 1:N
activity_attachments
    id (UUID, PK)
    activity_id (UUID, FK → activities.id)
    filename, file_path, file_type, file_size
    created_at

projects
    ↓ 1:N
day_regions
    id (UUID, PK)
    project_id (UUID, FK → projects.id)
    date (DATE)
    region (TEXT)
    created_at, updated_at
    UNIQUE(project_id, date)

projects
    ↓ N:N
profiles (via project_shares)

project_shares
    id (UUID, PK)
    project_id (UUID, FK → projects.id)
    user_id (UUID, FK → profiles.id)
    role (ENUM: owner, editor, viewer)
    created_at
    UNIQUE(project_id, user_id)
```

### Indexes

```sql
-- Performances optimisées avec ces indexes:
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_shares_project ON project_shares(project_id);
CREATE INDEX idx_shares_user ON project_shares(user_id);
CREATE INDEX idx_activities_project ON activities(project_id);
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_activities_project_date ON activities(project_id, date);
CREATE INDEX idx_attachments_activity ON activity_attachments(activity_id);
CREATE INDEX idx_regions_project ON day_regions(project_id);
CREATE INDEX idx_regions_date ON day_regions(date);
CREATE INDEX idx_regions_project_date ON day_regions(project_id, date);
```

---

## 🔐 Sécurité

### Row Level Security (RLS)

**Principe** : Chaque user ne peut accéder qu'à ses propres données ou aux données partagées avec lui.

#### Exemple : Policies sur `activities`

```sql
-- SELECT: User peut voir les activités de ses projets ou projets partagés
CREATE POLICY "Users can view activities of accessible projects"
ON activities FOR SELECT
USING (
    project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_shares WHERE user_id = auth.uid()
    )
);

-- INSERT: User peut créer des activités dans projets où il est owner/editor
CREATE POLICY "Users can create activities in accessible projects"
ON activities FOR INSERT
WITH CHECK (
    project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_shares
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
);
```

### Storage Policies

Les fichiers sont protégés par des policies similaires basées sur le `project_id` dans le path.

### JWT Tokens

- **anon key** : Utilisée côté frontend, accès limité par RLS
- **service_role key** : Utilisée côté backend (optionnel), bypass RLS ⚠️

---

## 🎨 Frontend

### Structure des Fichiers

```
frontend/
├── index.html          # UI (calendrier, planning, modals)
├── styles.css          # Design responsive (mobile-first)
├── app.js              # Logique applicative principale
├── supabase.js         # Client Supabase et fonctions API
├── config.js           # Configuration (URL, keys)
├── Dockerfile          # Build Nginx
└── nginx.conf          # Configuration serveur
```

### Technologies

- **HTML5** : Sémantique, accessibilité
- **CSS3** : Grid, Flexbox, variables CSS
- **JavaScript ES6+** : Modules, async/await, destructuring
- **Supabase JS Client** : v2.39.0

### Patterns

```javascript
// Séparation des responsabilités
supabase.js     → Appels API (CRUD)
app.js          → Logique métier + UI
styles.css      → Présentation

// State management (simple)
let currentUser = null;
let projects = [];
let activities = [];
let currentProject = null;

// Event-driven
onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') showApp();
    if (event === 'SIGNED_OUT') showLogin();
});
```

---

## 🐳 Infrastructure

### Docker Containers

**Frontend (Nginx)**
```dockerfile
FROM nginx:alpine
COPY index.html styles.css app.js supabase.js config.js /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Backend (Node.js - optionnel)**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server.js ./
EXPOSE 3000
CMD ["node", "server.js"]
```

### Nginx Configuration

```nginx
# Compression
gzip on;
gzip_types text/plain text/css application/javascript application/json;

# Cache assets
location ~* \.(js|css|png|jpg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# SPA routing
location / {
    try_files $uri $uri/ /index.html;
}
```

### Dokploy

- **Orchestration** : Docker Compose
- **Reverse Proxy** : Traefik (intégré)
- **SSL** : Let's Encrypt (auto-renewal)
- **Monitoring** : Metrics CPU/RAM/Network
- **Logs** : Centralisés par container

---

## 📊 Performance

### Optimisations Frontend

- **Lazy Loading** : Chargement des données uniquement au besoin
- **Caching** : Assets statiques (CSS, JS) cachés 1 an
- **Compression** : Gzip activé (ratio ~70%)
- **Minification** : Pas encore implémentée (TODO)

### Optimisations Database

- **Indexes** : Sur toutes les foreign keys et dates
- **RLS** : Filtre côté database (pas de data leaks)
- **Select ciblés** : Uniquement les colonnes nécessaires
- **Pagination** : Pas encore implémentée (TODO si > 1000 activités)

### Métriques Attendues

| Métrique | Valeur |
|----------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Lighthouse Score | > 90 |
| Bundle Size | < 100 KB |

---

## 🔄 Scalabilité

### Limites Actuelles (Plan Gratuit Supabase)

| Ressource | Limite |
|-----------|--------|
| Database | 500 MB |
| Storage | 1 GB |
| Bandwidth | 5 GB/mois |
| Concurrent connections | 60 |

### Plan de Scalabilité

**Phase 1 : 0-100 users**
- Plan gratuit Supabase suffit
- Frontend sur Dokploy (1 container)

**Phase 2 : 100-1000 users**
- Upgrade Supabase Pro (25$/mois)
- 8 GB database, 100 GB storage
- CDN pour les assets statiques (Cloudflare)

**Phase 3 : 1000+ users**
- Supabase Pro + Database extensions
- Cache Redis pour les requêtes fréquentes
- Load balancer Dokploy (multiple containers)
- Monitoring avancé (Sentry, Datadog)

---

## 🔌 APIs

### Supabase Auto-Generated REST API

Toutes les tables ont une API REST automatique :

```javascript
// GET /rest/v1/projects?owner_id=eq.{userId}
const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', userId);

// POST /rest/v1/activities
const { data } = await supabase
    .from('activities')
    .insert({ title, date, project_id, ... });

// PATCH /rest/v1/activities?id=eq.{activityId}
const { data } = await supabase
    .from('activities')
    .update({ title: 'New title' })
    .eq('id', activityId);

// DELETE /rest/v1/activities?id=eq.{activityId}
const { data } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId);
```

### Backend Custom Endpoints (optionnel)

```
POST /api/upload
POST /api/migrate
POST /api/projects/:id/duplicate
GET  /health
```

---

## 📦 Dépendances

### Frontend

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

**Chargé via CDN** :
```html
<script type="module">
  import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
</script>
```

### Backend (optionnel)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-fileupload": "^1.4.3"
  }
}
```

---

## 🚀 CI/CD (Future)

### Pipeline Automatique (TODO)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Dokploy
        run: |
          curl -X POST https://dokploy.ton-domaine.com/api/deploy
```

---

## 📚 Documentation Complémentaire

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide de déploiement complet
- [CHECKLIST.md](./CHECKLIST.md) - Checklist étape par étape
- [README.md](./README.md) - Vue d'ensemble et guide utilisateur

---

**Version Architecture** : 1.0
**Dernière mise à jour** : 2025-01-XX
**Auteur** : Loic
