# ✅ Checklist de Déploiement - Planning Vacances

Utilise cette checklist pour déployer l'application étape par étape.

---

## 🔧 Prérequis (15 min)

- [ ] VPS Hostinger accessible via SSH
- [ ] Dokploy installé sur le VPS
- [ ] Compte Supabase créé
- [ ] Nom de domaine configuré (optionnel)
- [ ] Git installé localement

**Commande de vérification :**
```bash
ssh root@ton-vps-hostinger.com "docker ps | grep dokploy"
```

---

## 🗄️ Configuration Supabase (30 min)

### 1. Créer le projet

- [ ] Créer un nouveau projet Supabase
- [ ] Nom : `planning-vacances`
- [ ] Région : Europe (Frankfurt)
- [ ] Sauvegarder le mot de passe de la base de données

### 2. Créer le schéma de base de données

- [ ] Aller dans **SQL Editor**
- [ ] Copier-coller le contenu de `database/schema.sql`
- [ ] Exécuter le script SQL
- [ ] Vérifier que 6 tables sont créées (Table Editor)

### 3. Configurer le Storage

- [ ] Créer un bucket : `activity-attachments` (privé)
- [ ] Ajouter les 3 policies (SELECT, INSERT, DELETE)
- [ ] Tester l'upload (optionnel)

### 4. Récupérer les clés API

- [ ] Aller dans **Settings → API**
- [ ] Noter le **Project URL**
- [ ] Noter la **anon public key**
- [ ] Noter la **service_role key** (⚠️ SECRÈTE)

**Sauvegarder dans un fichier sécurisé :**
```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔐 Configuration OAuth (45 min)

### Google OAuth

- [ ] Aller sur [Google Cloud Console](https://console.cloud.google.com)
- [ ] Créer un nouveau projet : `Planning Vacances`
- [ ] Activer **Google+ API**
- [ ] Créer des credentials OAuth 2.0 (Web application)
- [ ] Redirect URI : `https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback`
- [ ] Noter le **Client ID** et **Client Secret**
- [ ] Dans Supabase : **Authentication → Providers → Google**
- [ ] Activer et coller les credentials
- [ ] **Sauvegarder**

**Vérification :**
```
✅ Google Enabled = ON
✅ Client ID rempli
✅ Client Secret rempli
✅ Redirect URI correct
```

### Microsoft OAuth

- [ ] Aller sur [Azure Portal](https://portal.azure.com)
- [ ] **Azure AD → App registrations → New registration**
- [ ] Name : `Planning Vacances`
- [ ] Supported accounts : Multitenant + personal
- [ ] Redirect URI : `https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback`
- [ ] Noter l'**Application (client) ID**
- [ ] **Certificates & secrets → New client secret**
- [ ] Noter le **Value** (secret)
- [ ] Dans Supabase : **Authentication → Providers → Azure**
- [ ] Activer et coller les credentials
- [ ] Azure Tenant : `common`
- [ ] **Sauvegarder**

**Vérification :**
```
✅ Azure Enabled = ON
✅ Client ID rempli
✅ Client Secret rempli
✅ Tenant = common
```

### Apple OAuth (Optionnel)

- [ ] Compte Apple Developer requis (99$/an)
- [ ] Ou désactiver le bouton dans `frontend/index.html`

---

## 💻 Préparation du Code (15 min)

### 1. Configurer le frontend

- [ ] Copier `frontend/config.js.example` → `frontend/config.js`
- [ ] Éditer `frontend/config.js` :
  ```javascript
  export const SUPABASE_CONFIG = {
      url: 'https://xxxxxxxxxxxxx.supabase.co', // TON URL
      anonKey: 'eyJhbGci...' // TA CLÉ ANON
  };
  ```

### 2. Tester localement (optionnel)

- [ ] Lancer un serveur local :
  ```bash
  cd frontend
  python3 -m http.server 8080
  ```
- [ ] Ouvrir `http://localhost:8080`
- [ ] Tester la connexion OAuth
- [ ] Tester la création d'un projet

### 3. Pusher sur Git

- [ ] Initialiser Git :
  ```bash
  git init
  git add .
  git commit -m "Initial commit - Planning Vacances"
  ```
- [ ] Créer un repo GitHub/GitLab
- [ ] Pusher le code :
  ```bash
  git remote add origin https://github.com/ton-username/planning-vacances.git
  git push -u origin main
  ```

**Vérification :**
```
✅ Repo créé sur GitHub
✅ Code pushé
✅ config.js dans .gitignore (ne pas commit les secrets!)
```

---

## 🌐 Déploiement sur Dokploy (30 min)

### 1. Accéder à Dokploy

- [ ] Ouvrir `http://ton-vps-hostinger.com:3000`
- [ ] Se connecter avec tes identifiants

### 2. Créer l'application

- [ ] Cliquer **"New Application"**
- [ ] Type : **Docker**
- [ ] Name : `planning-vacances-frontend`

### 3. Configurer le build

- [ ] **Source** : Git
- [ ] **Repository URL** : `https://github.com/ton-username/planning-vacances.git`
- [ ] **Branch** : `main`
- [ ] **Build Context** : `./frontend`
- [ ] **Dockerfile Path** : `./frontend/Dockerfile`

### 4. Configurer le domaine

**Option A : Domaine personnalisé**
- [ ] Domaine : `planning-vacances.ton-domaine.com`
- [ ] Configurer le DNS (A record → IP du VPS)
- [ ] Attendre la propagation DNS (15-60 min)

**Option B : Domaine Dokploy par défaut**
- [ ] Utiliser `planning-vacances-xxxxx.dokploy.app`

### 5. Déployer

- [ ] Cliquer **"Deploy"**
- [ ] Attendre le build (2-5 min)
- [ ] Vérifier les logs (pas d'erreur)
- [ ] Status : **Running** (vert)

### 6. Configurer HTTPS

- [ ] Aller dans **Settings** de l'application
- [ ] Activer **"Auto SSL (Let's Encrypt)"**
- [ ] Attendre la génération du certificat (1-2 min)

**Vérification :**
```
✅ Application = Running
✅ URL accessible
✅ HTTPS = Active (cadenas vert)
✅ Pas d'erreur de certificat
```

---

## 🧪 Tests Post-Déploiement (20 min)

### Tests OAuth

- [ ] Ouvrir `https://planning-vacances.ton-domaine.com`
- [ ] Cliquer sur **"Continuer avec Google"**
- [ ] Se connecter avec un compte Google
- [ ] Vérifier la redirection vers l'app
- [ ] Vérifier le profil utilisateur (nom, email, avatar)

**Si erreur OAuth :**
- Vérifier que l'URL de redirection est correcte dans Google Cloud Console
- Vérifier que le provider est activé dans Supabase

### Tests Fonctionnels

#### Créer un projet
- [ ] Cliquer sur **"Mes Projets"** → **"Nouveau voyage"**
- [ ] Nom : `Test Voyage`
- [ ] Voyageurs : `Alice, Bob`
- [ ] Sauvegarder
- [ ] Vérifier que le projet apparaît

#### Créer une activité
- [ ] Sélectionner une date dans le calendrier
- [ ] Cliquer sur le bouton **"+"**
- [ ] Titre : `Vol Paris-Rome`
- [ ] Catégorie : **Vol** ✈️
- [ ] Date : aujourd'hui
- [ ] Heure : `14:30`
- [ ] Lieu : `CDG Airport`
- [ ] Sauvegarder
- [ ] Vérifier que l'activité apparaît dans la timeline

#### Tester l'upload
- [ ] Éditer l'activité créée
- [ ] Ajouter un fichier (PDF, image)
- [ ] Sauvegarder
- [ ] Vérifier que le fichier est listé

#### Tester la vue Planning
- [ ] Cliquer sur **"📊 Planning Hebdomadaire"**
- [ ] Vérifier que les 52 semaines s'affichent
- [ ] Vérifier le scroll automatique
- [ ] Ajouter une région dans un jour (ex: "Paris")
- [ ] Recharger la page → vérifier que la région est sauvegardée

### Tests Responsive

- [ ] Ouvrir sur mobile (ou DevTools → responsive mode)
- [ ] Vérifier que la vue s'adapte (1 colonne au lieu de 7)
- [ ] Tester la navigation
- [ ] Tester la création d'activité

**Vérification finale :**
```
✅ OAuth fonctionne (Google + Microsoft)
✅ Création de projet OK
✅ Création d'activité OK
✅ Upload fichier OK
✅ Vue Planning OK
✅ Régions sauvegardées OK
✅ Responsive OK
```

---

## 📤 Migration des Données (si applicable)

### Si tu as des données en localStorage

- [ ] Se connecter à l'app
- [ ] Cliquer sur **"Importer mes données"** (écran login)
- [ ] Vérifier que les projets sont importés
- [ ] Vérifier que les activités sont importées
- [ ] Vérifier que les régions sont importées

**Backup automatique :**
- Les anciennes données sont sauvegardées dans `localStorage` avec suffix `_backup`

---

## 🔐 Sécurité Post-Déploiement (15 min)

### Vérifications Supabase

- [ ] **Authentication → URL Configuration**
  - [ ] Site URL : `https://planning-vacances.ton-domaine.com`
  - [ ] Redirect URLs : Ajouter ton domaine
- [ ] **Database → RLS**
  - [ ] Vérifier que RLS est activé sur toutes les tables
- [ ] **Storage → Policies**
  - [ ] Vérifier que les policies sont actives

### Vérifications Dokploy

- [ ] Application utilise HTTPS uniquement
- [ ] Logs ne montrent pas de secrets (API keys)
- [ ] Health check fonctionne : `https://planning-vacances.ton-domaine.com/health`

### Secrets

- [ ] Service role key **JAMAIS** dans le frontend
- [ ] Config Supabase uniquement avec `anon key`
- [ ] `.env` et `config.js` dans `.gitignore`

---

## 📊 Monitoring & Backups (10 min)

### Configurer les backups Supabase

- [ ] **Database → Backups**
- [ ] Vérifier que les backups automatiques sont activés
- [ ] Créer un backup manuel pour tester
- [ ] Noter la fréquence (quotidien par défaut)

### Configurer le monitoring Dokploy

- [ ] Vérifier les métriques (CPU, RAM, Network)
- [ ] Configurer des alertes (optionnel)

### Documentation

- [ ] Sauvegarder toutes les credentials dans un gestionnaire de mots de passe
- [ ] Documenter les URLs importantes :
  - [ ] Frontend : `https://planning-vacances.ton-domaine.com`
  - [ ] Supabase Dashboard : `https://app.supabase.com/project/xxxxx`
  - [ ] Dokploy Dashboard : `http://ton-vps:3000`

---

## 🎉 Mise en Production

### Checklist finale

- [ ] ✅ Tous les tests passent
- [ ] ✅ OAuth fonctionne parfaitement
- [ ] ✅ HTTPS activé et fonctionnel
- [ ] ✅ Pas d'erreurs dans les logs
- [ ] ✅ Responsive testé
- [ ] ✅ Backups configurés
- [ ] ✅ Monitoring actif
- [ ] ✅ Documentation à jour

### Communication

- [ ] Partager l'URL avec les users : `https://planning-vacances.ton-domaine.com`
- [ ] Créer un guide utilisateur (optionnel)
- [ ] Annoncer le lancement (réseaux sociaux, email)

---

## 📝 Post-Déploiement

### Jours suivants

- [ ] Jour 1 : Vérifier les logs (erreurs ?)
- [ ] Jour 3 : Vérifier l'usage (nombre de users, projets créés)
- [ ] Jour 7 : Analyser les performances (temps de chargement)
- [ ] Jour 30 : Vérifier les limites Supabase (stockage, bandwidth)

### Maintenance régulière

- [ ] Hebdomadaire : Vérifier les logs d'erreurs
- [ ] Mensuel : Vérifier les backups Supabase
- [ ] Trimestriel : Mettre à jour les dépendances

---

## 🐛 En cas de problème

Consulter [DEPLOYMENT.md - Troubleshooting](./DEPLOYMENT.md#troubleshooting)

**Problèmes courants :**
- OAuth ne fonctionne pas → Vérifier les redirect URIs
- CORS error → Vérifier Site URL dans Supabase
- Upload fails → Vérifier les Storage policies
- Données ne chargent pas → Vérifier RLS policies

**Support :**
- Supabase Discord : [discord.supabase.com](https://discord.supabase.com)
- Dokploy Discord : [discord.dokploy.com](https://discord.dokploy.com)

---

**Temps total estimé : 2h30 - 3h30**

Bon déploiement ! 🚀
