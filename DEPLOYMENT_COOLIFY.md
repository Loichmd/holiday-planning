# 🚀 Guide de Déploiement - Planning Vacances (Coolify)

Guide complet pour déployer l'application Planning Vacances sur **GitHub + Coolify (VPS Hostinger)**.

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration Supabase](#configuration-supabase)
3. [Configuration GitHub](#configuration-github)
4. [Configuration Coolify](#configuration-coolify)
5. [Configuration OAuth](#configuration-oauth)
6. [Tests et Vérification](#tests-et-vérification)
7. [Migration des données](#migration-des-données)
8. [Maintenance](#maintenance)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Prérequis

### Ce dont tu as besoin :

- ✅ **VPS Hostinger** avec accès SSH
- ✅ **Coolify installé** sur le VPS ([guide installation](https://coolify.io/docs/installation))
- ✅ **Compte GitHub** (gratuit)
- ✅ **Compte Supabase** (gratuit : [supabase.com](https://supabase.com))
- ✅ **Nom de domaine** (optionnel mais recommandé pour OAuth)

### Vérifier Coolify :

```bash
ssh root@ton-vps-hostinger.com
docker ps | grep coolify
```

Si Coolify n'est pas installé :

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

---

## 🗄️ Configuration Supabase

### 1. Créer un nouveau projet

1. Va sur [supabase.com](https://supabase.com)
2. Clique sur **"New Project"**
3. Remplis :
   - **Name** : `planning-vacances`
   - **Database Password** : Choisis un mot de passe fort (sauvegarde-le !)
   - **Region** : Europe (Frankfurt) pour de bonnes performances
4. Clique **"Create new project"** (prend 2-3 minutes)

### 2. Créer le schéma de base de données

1. Dans Supabase, va dans **SQL Editor** (icône </> à gauche)
2. Clique sur **"New query"**
3. Copie-colle le contenu de `database/schema.sql`
4. Clique sur **"Run"** (en bas à droite)
5. Vérifie que les tables sont créées dans **Table Editor**

### 3. Configurer le Storage

1. Va dans **Storage** (icône 📦 à gauche)
2. Clique sur **"New bucket"**
3. Remplis :
   - **Name** : `activity-attachments`
   - **Public** : ❌ Non (décoché)
4. Clique **"Create bucket"**

5. Configurer les **Policies** du bucket :
   - Clique sur le bucket `activity-attachments`
   - Onglet **"Policies"**
   - Clique **"New policy"**

   **Policy 1 : Lecture (SELECT)**
   ```sql
   CREATE POLICY "Users can read attachments of accessible projects"
   ON storage.objects FOR SELECT
   USING (
       bucket_id = 'activity-attachments'
       AND (storage.foldername(name))[1] IN (
           SELECT id::text FROM projects WHERE owner_id = auth.uid()
           UNION
           SELECT project_id::text FROM project_shares WHERE user_id = auth.uid()
       )
   );
   ```

   **Policy 2 : Écriture (INSERT)**
   ```sql
   CREATE POLICY "Users can upload attachments to accessible projects"
   ON storage.objects FOR INSERT
   WITH CHECK (
       bucket_id = 'activity-attachments'
       AND (storage.foldername(name))[1] IN (
           SELECT id::text FROM projects WHERE owner_id = auth.uid()
           UNION
           SELECT project_id::text FROM project_shares
           WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
       )
   );
   ```

   **Policy 3 : Suppression (DELETE)**
   ```sql
   CREATE POLICY "Users can delete attachments of accessible projects"
   ON storage.objects FOR DELETE
   USING (
       bucket_id = 'activity-attachments'
       AND (storage.foldername(name))[1] IN (
           SELECT id::text FROM projects WHERE owner_id = auth.uid()
           UNION
           SELECT project_id::text FROM project_shares
           WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
       )
   );
   ```

### 4. Récupérer les clés API

1. Va dans **Settings** → **API** (icône ⚙️ à gauche puis "API")
2. Note ces 3 valeurs (tu en auras besoin) :

   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (GARDE-LA SECRÈTE !)
   ```

---

## 🔐 Configuration OAuth

### Google OAuth

1. Va sur [Google Cloud Console](https://console.cloud.google.com)
2. Crée un nouveau projet : **"Planning Vacances"**
3. Active **Google+ API** :
   - APIs & Services → Library → Recherche "Google+ API" → Enable

4. Crée les credentials OAuth :
   - APIs & Services → Credentials → **"Create Credentials"** → **"OAuth client ID"**
   - Type : **Web application**
   - Name : `Planning Vacances`
   - **Authorized redirect URIs** :
     ```
     https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
     ```
     (Remplace `xxxxxxxxxxxxx` par ton Project URL)

5. Note le **Client ID** et **Client Secret**

6. Dans Supabase :
   - **Authentication** → **Providers** → **Google**
   - Active **"Google Enabled"**
   - Colle le **Client ID** et **Client Secret**
   - Sauvegarde

### Microsoft OAuth (Azure)

1. Va sur [Azure Portal](https://portal.azure.com)
2. **Azure Active Directory** → **App registrations** → **"New registration"**
3. Remplis :
   - Name : `Planning Vacances`
   - Supported account types : **Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts**
   - Redirect URI : `https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback`

4. Note l'**Application (client) ID**

5. Crée un secret :
   - **Certificates & secrets** → **"New client secret"**
   - Description : `Supabase`
   - Expires : 24 months
   - Copie le **Value** (secret)

6. Dans Supabase :
   - **Authentication** → **Providers** → **Azure**
   - Active **"Azure Enabled"**
   - Colle **Client ID** et **Secret**
   - Azure Tenant : `common` (pour multi-tenant)
   - Sauvegarde

---

## 📦 Configuration GitHub

### 1. Créer le repository

1. Va sur [github.com](https://github.com)
2. **New repository**
3. Remplis :
   - **Name** : `planning-vacances`
   - **Visibility** : **Private** (recommandé)
   - Ne pas initialiser avec README (on a déjà les fichiers)
4. **Create repository**

### 2. Configurer le code local

```bash
cd "/Users/loic/Documents/Claude-Code/Holiday planning"

# Créer frontend/config.js (depuis le template)
cd frontend
cp config.js.example config.js
```

Édite `frontend/config.js` :
```javascript
export const SUPABASE_CONFIG = {
    url: 'https://xxxxxxxxxxxxx.supabase.co', // TON URL Supabase
    anonKey: 'eyJhbGci...' // TA clé anon
};
```

### 3. Pousser sur GitHub

```bash
cd "/Users/loic/Documents/Claude-Code/Holiday planning"

# Initialiser Git
git init
git add .
git commit -m "Initial commit - Planning Vacances production"

# Ajouter le remote GitHub
git remote add origin https://github.com/ton-username/planning-vacances.git

# Pousser
git branch -M main
git push -u origin main
```

### 4. Vérifier

Va sur GitHub et vérifie que tous les fichiers sont présents :
- ✅ frontend/
- ✅ backend/
- ✅ database/
- ✅ Documentation (.md files)
- ❌ `frontend/config.js` (doit être dans .gitignore !)

---

## 🌐 Configuration Coolify

### 1. Accéder à Coolify

1. Ouvre ton navigateur : `http://ton-vps-hostinger.com:8000`
   (ou `https://coolify.ton-domaine.com` si configuré)
2. Connecte-toi avec tes identifiants

### 2. Configurer GitHub Connection

1. Dans Coolify, va dans **Settings** → **Sources**
2. **Add New Source** → **GitHub**
3. Options :
   - **GitHub App** (recommandé) : Installe l'app GitHub de Coolify
   - **Personal Access Token** : Crée un token sur GitHub

**Pour GitHub App (méthode recommandée)** :
1. Clique sur **Install GitHub App**
2. Autorise Coolify sur GitHub
3. Sélectionne ton repository `planning-vacances`

**Pour Personal Access Token** :
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Generate new token** (classic)
3. Scopes : `repo`, `read:org`, `write:packages`
4. Copie le token dans Coolify

### 3. Créer l'application Frontend

1. Dans Coolify Dashboard, clique **+ New Resource**
2. **Application**
3. Choisis :
   - **Source** : GitHub
   - **Repository** : `ton-username/planning-vacances`
   - **Branch** : `main`

4. **Build Configuration** :
   - **Build Pack** : Dockerfile
   - **Dockerfile Location** : `./frontend/Dockerfile`
   - **Docker Build Context** : `./frontend`

5. **General Settings** :
   - **Name** : `planning-vacances-frontend`
   - **Port** : `80` (port exposé dans Dockerfile)
   - **Base Directory** : `/` (root du repo)

6. **Domains** :
   - **Domain** : `planning-vacances.ton-domaine.com`
   - Ou utilise le domaine par défaut de Coolify : `planning-vacances-xxxxx.coolify.app`

7. **Environment Variables** (vide pour le frontend - config dans config.js)

8. **Deploy** :
   - Clique sur **Deploy**
   - Attends 2-5 minutes
   - Vérifie les logs

### 4. Configurer HTTPS (SSL)

Coolify gère automatiquement Let's Encrypt !

1. Va dans **Domains** de ton application
2. Active **Generate SSL Certificate**
3. Attends 1-2 minutes
4. Vérifie : `https://planning-vacances.ton-domaine.com` doit avoir le cadenas vert 🔒

### 5. Configurer les Deployments Automatiques

1. Dans ton application Coolify, va dans **Settings**
2. **Auto Deploy** :
   - Active **Automatic Deployment on Push**
   - Maintenant, chaque `git push` sur `main` → redéploiement automatique !

---

## 🔧 Backend Optionnel (si nécessaire)

Le backend Node.js est **optionnel**. Tu n'en as besoin QUE si :
- Tu veux des opérations complexes (ex: duplication de projet)
- Tu veux un endpoint custom pour la migration

### Déployer le backend sur Coolify

1. **+ New Resource** → **Application**
2. **Source** : Même repository GitHub
3. **Branch** : `main`

4. **Build Configuration** :
   - **Build Pack** : Dockerfile
   - **Dockerfile Location** : `./backend/Dockerfile`
   - **Docker Build Context** : `./backend`

5. **General Settings** :
   - **Name** : `planning-vacances-backend`
   - **Port** : `3000`

6. **Environment Variables** :
   ```
   NODE_ENV=production
   PORT=3000
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (SECRET!)
   ALLOWED_ORIGINS=https://planning-vacances.ton-domaine.com
   ```

7. **Domains** :
   - **Domain** : `api-planning.ton-domaine.com`

8. **Deploy** et vérifie : `https://api-planning.ton-domaine.com/health`

---

## ✅ Tests Post-Déploiement

### 1. Accéder à l'application

Ouvre `https://planning-vacances.ton-domaine.com`

### 2. Tester OAuth

1. Clique **"Continuer avec Google"**
2. Connecte-toi avec ton compte Google
3. Tu dois être redirigé vers l'app ✅
4. Vérifie ton profil (nom, email, avatar) en haut à gauche

### 3. Tester les fonctionnalités

**Créer un projet** :
1. Clique **"Mes Projets"** → **"Nouveau voyage"**
2. Nom : `Test Voyage` → Voyageurs : `Alice, Bob` → **Enregistrer**
3. Le projet apparaît ✅

**Créer une activité** :
1. Sélectionne une date dans le calendrier
2. Clique le bouton **"+"**
3. Remplis :
   - Titre : `Vol Paris-Rome`
   - Date : aujourd'hui
   - Heure : `14:30`
   - Catégorie : **✈️ Vol**
   - Lieu : `CDG Airport`
4. **Enregistrer**
5. L'activité apparaît dans la timeline ✅

**Tester upload fichier** :
1. Édite l'activité créée
2. **Pièces jointes** → Ajoute un fichier (PDF ou image)
3. **Enregistrer**
4. Vérifie que le fichier est listé ✅

**Tester la vue Planning** :
1. Clique **"📊 Planning Hebdomadaire"**
2. Les 52 semaines s'affichent ✅
3. Vérifie le scroll automatique
4. Ajoute une région dans un jour (ex: "Paris")
5. Recharge la page → la région est sauvegardée ✅

**Tester mobile** :
1. Ouvre sur smartphone (ou DevTools → responsive mode)
2. La vue s'adapte (1 colonne au lieu de 7) ✅
3. Teste la navigation
4. Teste la création d'activité

---

## 📤 Migration des Données

Si tu as déjà des données dans localStorage (version démo), voici comment les migrer :

### Méthode 1 : Via l'interface (recommandée)

1. Connecte-toi à l'application avec ton compte Google/Microsoft
2. Sur l'écran de login, tu verras un bouton **"Importer mes données"**
3. Clique dessus → Les données localStorage seront automatiquement migrées vers Supabase
4. Un backup sera créé dans localStorage avec le suffix `_backup`

### Méthode 2 : Script manuel

Voir [MIGRATION.md](./MIGRATION.md) pour la méthode manuelle complète.

---

## 🔄 Maintenance

### Mises à jour de l'application

Avec Coolify + GitHub, c'est automatique ! 🎉

```bash
# 1. Fais tes modifications localement
# 2. Commit et push
git add .
git commit -m "Update: description des changements"
git push origin main

# 3. Coolify redéploie automatiquement !
# (si Auto Deploy est activé)
```

### Backups Supabase

Supabase fait des backups automatiques **tous les jours** (plan gratuit = 7 jours de rétention).

Pour un backup manuel :
1. **Database** → **Backups** → **"Create Backup"**

### Monitoring Coolify

Dans Coolify, tu peux voir :
- **Logs** : Logs en temps réel de l'application
- **Metrics** : CPU, RAM, Network (si activé)
- **Deployments** : Historique des déploiements

### Vérifier la santé de l'application

```bash
# Health check frontend
curl https://planning-vacances.ton-domaine.com/health

# Health check backend (si déployé)
curl https://api-planning.ton-domaine.com/health
```

---

## 🐛 Troubleshooting

### Problème : OAuth ne fonctionne pas

**Symptômes** : Après clic sur "Google" ou "Microsoft", erreur de redirection

**Solutions** :
1. Vérifie que l'URL de redirection dans Google/Azure correspond EXACTEMENT à :
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```

2. Vérifie que les **Client ID** et **Secret** sont corrects dans Supabase

3. Vérifie que le provider est bien **activé** dans Supabase (Authentication → Providers)

4. Vérifie dans Supabase **Authentication → URL Configuration** :
   - **Site URL** : `https://planning-vacances.ton-domaine.com`
   - **Redirect URLs** : Ajoute ton domaine

### Problème : Build échoue dans Coolify

**Symptômes** : Erreur dans les logs de déploiement

**Solutions** :
1. Vérifie que `frontend/config.js` existe (copié depuis `config.js.example`)
2. Vérifie que le **Build Context** est bien `./frontend`
3. Vérifie que le **Dockerfile Location** est bien `./frontend/Dockerfile`
4. Regarde les logs détaillés dans Coolify

### Problème : Application ne se charge pas

**Symptômes** : Page blanche ou erreur 502

**Solutions** :
1. Vérifie que le **Port** dans Coolify = `80` (port du Dockerfile)
2. Vérifie les logs Coolify pour des erreurs
3. Vérifie que Nginx démarre correctement :
   ```bash
   # Dans les logs Coolify, tu devrais voir :
   # "nginx: [notice] ... start worker processes"
   ```

### Problème : Erreur CORS

**Symptômes** : Erreur `Access-Control-Allow-Origin` dans la console

**Solutions** :
1. Vérifie que `SUPABASE_URL` dans `frontend/config.js` est correct
2. Vérifie que le domaine de ton frontend est autorisé dans Supabase :
   - **Authentication** → **URL Configuration** → **Site URL**
   - Ajoute `https://planning-vacances.ton-domaine.com`

### Problème : Fichiers attachés ne s'uploadent pas

**Symptômes** : Erreur lors de l'upload de fichiers

**Solutions** :
1. Vérifie que le bucket `activity-attachments` existe dans Supabase Storage
2. Vérifie que les **Policies** sont bien configurées (voir section Storage)
3. Vérifie que l'user est bien authentifié
4. Vérifie la taille du fichier (limite : 50MB par défaut dans Supabase gratuit)

### Problème : Données ne se chargent pas

**Symptômes** : L'app se charge mais les projets/activités ne s'affichent pas

**Solutions** :
1. Ouvre la console (F12) et cherche des erreurs
2. Vérifie que les tables existent dans Supabase (Table Editor)
3. Vérifie que les **RLS Policies** sont activées
4. Teste en désactivant temporairement RLS pour debug :
   ```sql
   ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
   ```
   (Réactive après debug !)

### Problème : DNS ne résout pas

**Symptômes** : Le domaine ne pointe pas vers l'application

**Solutions** :
1. Vérifie que le DNS A record pointe vers l'IP du VPS :
   ```bash
   nslookup planning-vacances.ton-domaine.com
   # Doit retourner l'IP de ton VPS
   ```

2. Attends la propagation DNS (peut prendre 15-60 min)

3. Vérifie dans ton registrar de domaine (Hostinger, Cloudflare, etc.)

### Problème : SSL ne fonctionne pas

**Symptômes** : Pas de HTTPS ou certificat invalide

**Solutions** :
1. Vérifie que le domaine pointe bien vers le VPS (DNS)
2. Dans Coolify, va dans **Domains** → **Generate SSL Certificate**
3. Vérifie les logs Coolify pour des erreurs Let's Encrypt
4. Vérifie que le port 80 et 443 sont ouverts sur le VPS :
   ```bash
   sudo ufw status
   # Doit montrer 80/tcp et 443/tcp ALLOW
   ```

---

## 🔐 Sécurité Coolify

### Variables d'environnement

⚠️ **IMPORTANT** : Les secrets doivent être dans Coolify Environment Variables, PAS dans le code !

**Secrets à NE JAMAIS commit** :
- ❌ `frontend/config.js` avec vraies valeurs
- ❌ `backend/.env`
- ❌ `.env`

**Comment gérer** :
1. Commit uniquement les `.example` files
2. Configure les vraies valeurs dans Coolify UI
3. Pour le frontend : `config.js` contient les clés (déjà dans .gitignore)

### Firewall VPS

Vérifie que seuls les ports nécessaires sont ouverts :

```bash
sudo ufw status

# Doit montrer :
# 22/tcp    ALLOW    (SSH)
# 80/tcp    ALLOW    (HTTP)
# 443/tcp   ALLOW    (HTTPS)
# 8000/tcp  ALLOW    (Coolify Dashboard)
```

---

## 📊 Limites Plan Gratuit Supabase

| Ressource | Limite Gratuite |
|-----------|----------------|
| Database | 500 MB |
| Storage | 1 GB |
| Bandwidth | 5 GB/mois |
| Backups | 7 jours de rétention |
| Auth users | Illimité |

**Pour augmenter les limites** : Passe au plan Pro (25$/mois) qui offre :
- 8 GB de database
- 100 GB de storage
- 250 GB de bandwidth
- Backups 30 jours

---

## ✅ Checklist finale

Avant de mettre en production :

**Supabase** :
- [ ] Projet créé
- [ ] Tables créées (schema.sql exécuté)
- [ ] Storage bucket créé
- [ ] Storage policies configurées
- [ ] OAuth Google configuré
- [ ] OAuth Microsoft configuré (optionnel)
- [ ] Site URL configuré

**GitHub** :
- [ ] Repository créé
- [ ] Code poussé
- [ ] `frontend/config.js` dans .gitignore
- [ ] Secrets non commités

**Coolify** :
- [ ] GitHub connection configurée
- [ ] Application frontend créée
- [ ] Build réussi
- [ ] Application running
- [ ] Domaine configuré
- [ ] SSL activé (HTTPS)
- [ ] Auto-deploy activé

**Tests** :
- [ ] OAuth Google fonctionne
- [ ] OAuth Microsoft fonctionne (optionnel)
- [ ] Création de projet OK
- [ ] Création d'activité OK
- [ ] Upload de fichier OK
- [ ] Vue Planning OK
- [ ] Responsive mobile OK
- [ ] Migration localStorage testée (si applicable)

---

## 🎉 Félicitations !

Ton application Planning Vacances est maintenant en production ! 🚀

**Accès** : `https://planning-vacances.ton-domaine.com`

**Workflow de mise à jour** :
```bash
# 1. Modifier le code
# 2. Commit
git add .
git commit -m "Update: ..."

# 3. Push
git push origin main

# 4. Coolify redéploie automatiquement !
```

**Support** :
- Documentation Supabase : [docs.supabase.com](https://docs.supabase.com)
- Documentation Coolify : [coolify.io/docs](https://coolify.io/docs)
- Discord Coolify : [discord.com/invite/coolify](https://discord.com/invite/coolify)

**Prochaines étapes** (optionnel) :
- Ajouter des analytics (Google Analytics, Plausible)
- Ajouter un système de notifications (email pour les activités)
- Implémenter le partage de projets entre users
- Ajouter un export PDF du planning

Bon voyage ! ✈️🏖️
