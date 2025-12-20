# ⚡ Quick Start - Planning Vacances (Coolify)

Guide ultra-rapide pour déployer l'application en production avec **GitHub + Coolify** en **moins de 1 heure**.

---

## 🎯 Objectif

Déployer Planning Vacances sur ton VPS Hostinger avec **Coolify + Supabase**.

**Temps estimé : 45-60 minutes**

---

## ✅ Prérequis (5 min)

Vérifie que tu as :

- [ ] VPS Hostinger accessible
- [ ] Coolify installé sur le VPS
- [ ] Compte GitHub
- [ ] Nom de domaine (optionnel)

**Vérification rapide** :
```bash
ssh root@ton-vps.com "docker ps | grep coolify"
# Si ça affiche une ligne → OK ✅
```

**Installer Coolify si nécessaire** :
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
# Puis accède à http://ton-vps:8000
```

---

## 📝 Étape 1 : Supabase (15 min)

### 1.1 Créer le projet

1. Va sur [supabase.com](https://supabase.com) → Sign up
2. **New Project** → Nom : `planning-vacances` → Région : **Europe (Frankfurt)**
3. Choisis un **mot de passe** fort → **Create**
4. Attends 2 minutes ☕

### 1.2 Créer la base de données

1. **SQL Editor** (icône </> à gauche)
2. **New query**
3. Copie-colle **tout** le fichier `database/schema.sql`
4. **Run** → Vérifie : "Success. No rows returned"

### 1.3 Créer le Storage

1. **Storage** (icône 📦 à gauche)
2. **New bucket** → Nom : `activity-attachments` → Public : **NON** → **Create**
3. Clique sur le bucket → **Policies** → **New policy** → **For full customization**
4. Colle les 3 policies du fichier `database/schema.sql` (section STORAGE BUCKETS)

### 1.4 Récupérer les clés

1. **Settings** → **API**
2. ⚠️ **IMPORTANT** : Note ces valeurs :

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔐 Étape 2 : OAuth Google (10 min)

### 2.1 Google Cloud Console

1. Va sur [console.cloud.google.com](https://console.cloud.google.com)
2. **Create Project** → Nom : `Planning Vacances` → **Create**
3. Sélectionne le projet (en haut)
4. **APIs & Services** → **Library** → Recherche "Google+ API" → **Enable**

### 2.2 Créer les credentials

1. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
2. Configure consent screen si demandé :
   - User Type : **External** → **Create**
   - App name : `Planning Vacances`
   - User support email : ton email
   - Developer email : ton email
   - **Save and Continue** (3x) → **Back to Dashboard**

3. **Create Credentials** → **OAuth client ID**
   - Type : **Web application**
   - Name : `Planning Vacances`
   - **Authorized redirect URIs** → **Add URI** :
     ```
     https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
     ```
     (⚠️ Remplace par ton Project URL Supabase)
   - **Create**

4. ⚠️ **Note le Client ID et Client Secret**

### 2.3 Configurer dans Supabase

1. Retourne sur Supabase → **Authentication** → **Providers**
2. **Google** → **Enable**
3. Colle **Client ID** et **Client Secret**
4. **Save**

---

## 📦 Étape 3 : GitHub (10 min)

### 3.1 Créer le repository

1. Va sur [github.com](https://github.com)
2. **New repository**
   - Name : `planning-vacances`
   - Visibility : **Private** (recommandé)
   - Ne pas initialiser avec README
3. **Create repository**

### 3.2 Configurer le code

```bash
cd "/Users/loic/Documents/Claude-Code/Holiday planning"

# Créer frontend/config.js
cd frontend
cp config.js.example config.js
```

Édite `frontend/config.js` :
```javascript
export const SUPABASE_CONFIG = {
    url: 'https://xxxxxxxxxxxxx.supabase.co', // ← TON URL
    anonKey: 'eyJhbGci...' // ← TA CLÉ ANON
};
```

### 3.3 Pousser sur GitHub

```bash
cd "/Users/loic/Documents/Claude-Code/Holiday planning"

git init
git add .
git commit -m "Initial commit - Planning Vacances production"
git remote add origin https://github.com/ton-username/planning-vacances.git
git branch -M main
git push -u origin main
```

---

## 🚀 Étape 4 : Déployer sur Coolify (15 min)

### 4.1 Accéder à Coolify

1. Ouvre `http://ton-vps:8000` (ou `https://coolify.ton-domaine.com`)
2. Connecte-toi

### 4.2 Configurer GitHub

1. **Settings** → **Sources** → **Add New Source** → **GitHub**
2. **Install GitHub App** → Autorise Coolify sur GitHub
3. Sélectionne ton repository `planning-vacances`

### 4.3 Créer l'application

1. **+ New Resource** → **Application**
2. **Source** : GitHub
3. **Repository** : `ton-username/planning-vacances`
4. **Branch** : `main`

5. **Build Configuration** :
   - **Build Pack** : Dockerfile
   - **Dockerfile Location** : `./frontend/Dockerfile`
   - **Docker Build Context** : `./frontend`

6. **General Settings** :
   - **Name** : `planning-vacances-frontend`
   - **Port** : `80`

7. **Domains** :
   - **Domain** : `planning-vacances.ton-domaine.com`
   - (ou utilise le domaine par défaut Coolify)

8. **Deploy** → Attends 2-5 minutes

### 4.4 Configurer SSL

1. Va dans **Domains** de ton application
2. Active **Generate SSL Certificate**
3. Attends 1-2 minutes
4. Vérifie : `https://planning-vacances.ton-domaine.com` 🔒

### 4.5 Activer Auto-Deploy

1. **Settings** → **Auto Deploy**
2. Active **Automatic Deployment on Push**
3. Maintenant : `git push` → redéploiement automatique ! 🎉

---

## ✅ Étape 5 : Tester (10 min)

### 5.1 Accéder à l'app

Ouvre `https://planning-vacances.ton-domaine.com`

### 5.2 Tester OAuth

1. Clique **"Continuer avec Google"**
2. Connecte-toi avec ton compte Google
3. Tu dois être redirigé vers l'app ✅

### 5.3 Tester les fonctionnalités

**Créer un projet** :
1. **"Mes Projets"** → **"Nouveau voyage"**
2. Nom : `Test` → **Enregistrer**
3. Le projet apparaît ✅

**Créer une activité** :
1. Sélectionne une date
2. Clique **"+"**
3. Titre : `Vol Paris-Rome` → Date : aujourd'hui → **Enregistrer**
4. L'activité apparaît ✅

**Tester la vue Planning** :
1. **"📊 Planning Hebdomadaire"**
2. Les 52 semaines s'affichent ✅
3. Ajoute une région → Recharge → Sauvegardée ✅

**Tester mobile** :
1. Ouvre sur smartphone (ou DevTools responsive)
2. Vue adaptée (1 colonne) ✅

---

## 🎉 C'est Fini !

**Ton app est en production !** 🚀

**URL** : `https://planning-vacances.ton-domaine.com`

---

## 📋 Checklist Finale

- [ ] Supabase configuré (tables, storage, OAuth)
- [ ] GitHub repository créé et code poussé
- [ ] Coolify application créée
- [ ] Build réussi
- [ ] HTTPS activé
- [ ] Auto-deploy activé
- [ ] OAuth Google fonctionne
- [ ] Création de projet OK
- [ ] Création d'activité OK
- [ ] Vue Planning OK
- [ ] Responsive mobile OK

---

## 🔧 Workflow de Mise à Jour

Maintenant, pour mettre à jour l'app :

```bash
# 1. Modifie le code localement
# 2. Commit
git add .
git commit -m "Update: description"

# 3. Push
git push origin main

# 4. Coolify redéploie automatiquement ! 🎉
```

---

## 🐛 Si Quelque Chose Ne Marche Pas

### OAuth ne fonctionne pas

**Vérifier** :
- Redirect URI dans Google = `https://xxxxx.supabase.co/auth/v1/callback`
- Provider Google activé dans Supabase
- Site URL dans Supabase = ton domaine

### Build échoue

**Vérifier** :
- `frontend/config.js` existe
- Build Context = `./frontend`
- Dockerfile Location = `./frontend/Dockerfile`
- Logs Coolify pour détails

### Données ne se sauvegardent pas

**Vérifier** :
- RLS activé sur toutes les tables
- Policies créées correctement
- User bien authentifié

**Documentation complète** : [DEPLOYMENT_COOLIFY.md](./DEPLOYMENT_COOLIFY.md)

---

## 📚 Prochaines Étapes

**Migration des données** :
- Si tu as des données localStorage → Voir [MIGRATION.md](./MIGRATION.md)

**OAuth Microsoft** (optionnel) :
- Voir [DEPLOYMENT_COOLIFY.md](./DEPLOYMENT_COOLIFY.md) → Section OAuth

**Monitoring** :
- Coolify Dashboard → Logs & Metrics

---

**Temps total : 45-60 minutes** ⏱️

Bon voyage ! ✈️🌍
