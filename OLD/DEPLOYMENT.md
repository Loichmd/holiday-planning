# 🚀 Guide de Déploiement - Planning Vacances

Guide complet pour déployer l'application Planning Vacances sur **Hostinger VPS avec Dokploy + Supabase**.

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration Supabase](#configuration-supabase)
3. [Configuration Dokploy](#configuration-dokploy)
4. [Déploiement Frontend](#déploiement-frontend)
5. [Configuration OAuth](#configuration-oauth)
6. [Migration des données](#migration-des-données)
7. [Maintenance](#maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Prérequis

### Ce dont tu as besoin :

- ✅ **VPS Hostinger** avec accès SSH
- ✅ **Dokploy installé** sur le VPS ([guide installation](https://docs.dokploy.com/get-started/installation))
- ✅ **Compte Supabase** (gratuit : [supabase.com](https://supabase.com))
- ✅ **Nom de domaine** (optionnel mais recommandé pour OAuth)
- ✅ **Git** installé localement

### Vérifier Dokploy :

```bash
ssh root@ton-vps-hostinger.com
docker ps | grep dokploy
```

Si Dokploy n'est pas installé :

```bash
curl -sSL https://dokploy.com/install.sh | sh
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

### Apple OAuth (Optionnel)

Apple OAuth est plus complexe et nécessite un compte Apple Developer (99$/an).
Pour l'instant, tu peux le désactiver en masquant le bouton dans `frontend/index.html` :

```html
<button class="oauth-btn" onclick="loginWithProvider('apple')" style="display: none;">
```

---

## 🌐 Déploiement Frontend sur Dokploy

### Préparation du code

1. **Configure Supabase dans le frontend** :

   Édite `frontend/config.js` :
   ```javascript
   export const SUPABASE_CONFIG = {
       url: 'https://xxxxxxxxxxxxx.supabase.co', // TON URL Supabase
       anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // TA clé anon
   };
   ```

2. **Pousse le code sur Git** :

   ```bash
   cd "/Users/loic/Documents/Claude-Code/Holiday planning"
   git init
   git add .
   git commit -m "Initial commit - Planning Vacances production"
   ```

   Crée un repo sur GitHub/GitLab/Bitbucket et pousse :
   ```bash
   git remote add origin https://github.com/ton-username/planning-vacances.git
   git push -u origin main
   ```

### Déploiement avec Dokploy

1. **Accède à Dokploy** :
   - Ouvre ton navigateur : `http://ton-vps-hostinger.com:3000`
   - Connecte-toi avec tes identifiants

2. **Créer une nouvelle application** :
   - Clique sur **"New Application"**
   - Type : **Docker**
   - Name : `planning-vacances-frontend`

3. **Configurer le déploiement** :
   - **Source** : Git
   - **Repository URL** : `https://github.com/ton-username/planning-vacances.git`
   - **Branch** : `main`
   - **Build Context** : `./frontend`
   - **Dockerfile Path** : `./frontend/Dockerfile`

4. **Variables d'environnement** (optionnel, tout est dans config.js) :
   - Pas de variables nécessaires car la config est dans le code frontend

5. **Domaine** :
   - **Domain** : `planning-vacances.ton-domaine.com`
   - Ou utilise le domaine par défaut de Dokploy

6. **Deploy** :
   - Clique sur **"Deploy"**
   - Attends 2-3 minutes que le build se termine
   - Vérifie les logs pour des erreurs

7. **Vérifier le déploiement** :
   - Ouvre `https://planning-vacances.ton-domaine.com`
   - Tu devrais voir l'écran de login avec les boutons OAuth

### Configurer HTTPS (SSL)

Dans Dokploy :
1. Va dans **Settings** de ton application
2. Active **"Auto SSL (Let's Encrypt)"**
3. Vérifie que ton domaine pointe bien vers l'IP de ton VPS

---

## 📤 Migration des données

Si tu as déjà des données dans localStorage (version démo), voici comment les migrer :

### Méthode 1 : Via l'interface (recommandée)

1. Connecte-toi à l'application avec ton compte Google/Microsoft
2. Sur l'écran de login, tu verras un bouton **"Importer mes données"**
3. Clique dessus → Les données localStorage seront automatiquement migrées vers Supabase
4. Un backup sera créé dans localStorage avec le suffix `_backup`

### Méthode 2 : Script manuel

Si la migration auto ne fonctionne pas, tu peux extraire les données manuellement :

1. Ouvre la console du navigateur (F12) sur l'ancienne version
2. Exécute :
   ```javascript
   // Extraire les données
   const data = localStorage.getItem('planningVoyages_demo'); // ou ton userId
   const regions = localStorage.getItem('planningVoyages_demo_regions');

   console.log('Projects & Activities:', data);
   console.log('Regions:', regions);
   ```

3. Copie les JSON et sauvegarde-les dans un fichier
4. Contacte-moi pour créer un script d'import SQL

---

## 🛠️ Backend Optionnel (si nécessaire)

Le backend Node.js est **optionnel**. Tu n'en as besoin QUE si :
- Tu veux des opérations complexes (ex: duplication de projet)
- Tu veux un endpoint custom pour la migration

### Déployer le backend sur Dokploy

1. Dans Dokploy, crée une nouvelle application :
   - Type : **Docker**
   - Name : `planning-vacances-backend`

2. Configuration :
   - **Build Context** : `./backend`
   - **Dockerfile Path** : `./backend/Dockerfile`

3. Variables d'environnement :
   ```
   NODE_ENV=production
   PORT=3000
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (GARDE SECRET!)
   ALLOWED_ORIGINS=https://planning-vacances.ton-domaine.com
   ```

4. Port : `3000`

5. Deploy et vérifie : `https://api-planning.ton-domaine.com/health`

---

## 🔄 Maintenance

### Backups Supabase

Supabase fait des backups automatiques **tous les jours** (plan gratuit = 7 jours de rétention).

Pour un backup manuel :
1. **Database** → **Backups** → **"Create Backup"**

### Mise à jour de l'application

1. Fais tes modifications localement
2. Commit et push sur Git :
   ```bash
   git add .
   git commit -m "Update: description"
   git push
   ```

3. Dans Dokploy, clique sur **"Redeploy"** sur ton application

### Monitoring

Dans Dokploy, tu peux voir :
- **Logs** : Logs en temps réel de l'application
- **Metrics** : CPU, RAM, Network
- **Status** : Health checks

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

### Problème : Erreur CORS

**Symptômes** : Erreur `Access-Control-Allow-Origin` dans la console

**Solutions** :
1. Vérifie que `SUPABASE_URL` dans `config.js` est correct
2. Vérifie que le domaine de ton frontend est autorisé dans Supabase :
   - **Authentication** → **URL Configuration** → **Site URL**
   - Ajoute `https://planning-vacances.ton-domaine.com`

### Problème : Fichiers attachés ne s'uploadent pas

**Symptômes** : Erreur lors de l'upload de fichiers

**Solutions** :
1. Vérifie que le bucket `activity-attachments` existe dans Supabase Storage
2. Vérifie que les **Policies** sont bien configurées (voir section Storage)
3. Vérifie que l'user est bien authentifié

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

### Problème : Migration localStorage ne fonctionne pas

**Solutions** :
1. Vérifie que tu es bien connecté avant de cliquer sur "Migrer"
2. Ouvre la console et regarde les erreurs
3. Vérifie que le localStorage contient bien des données :
   ```javascript
   console.log(localStorage.getItem('planningVoyages_demo'));
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

- [ ] Supabase configuré (tables, storage, policies)
- [ ] OAuth Google configuré et testé
- [ ] OAuth Microsoft configuré et testé (optionnel)
- [ ] Frontend déployé sur Dokploy
- [ ] HTTPS activé (Let's Encrypt)
- [ ] Domaine configuré et DNS mis à jour
- [ ] Test de connexion OAuth
- [ ] Test de création de projet
- [ ] Test de création d'activité
- [ ] Test d'upload de fichier
- [ ] Migration localStorage testée (si applicable)
- [ ] Backups Supabase activés

---

## 🎉 Félicitations !

Ton application Planning Vacances est maintenant en production ! 🚀

**Accès** : `https://planning-vacances.ton-domaine.com`

**Support** :
- Documentation Supabase : [docs.supabase.com](https://docs.supabase.com)
- Documentation Dokploy : [docs.dokploy.com](https://docs.dokploy.com)

**Prochaines étapes** (optionnel) :
- Ajouter des analytics (Google Analytics, Plausible)
- Ajouter un système de notifications (email pour les activités)
- Implémenter le partage de projets entre users
- Ajouter un export PDF du planning

Bon voyage ! ✈️🏖️
