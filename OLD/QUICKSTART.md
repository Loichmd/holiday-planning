# ⚡ Quick Start - Planning Vacances

Guide ultra-rapide pour déployer l'application en production en **moins de 1 heure**.

---

## 🎯 Objectif

Déployer Planning Vacances sur ton VPS Hostinger avec Dokploy + Supabase.

**Temps estimé : 45-60 minutes**

---

## ✅ Prérequis (5 min)

Vérifie que tu as :

- [ ] VPS Hostinger accessible
- [ ] Dokploy installé sur le VPS
- [ ] Compte GitHub/GitLab
- [ ] Nom de domaine (optionnel)

**Vérification rapide** :
```bash
ssh root@ton-vps.com "docker ps | grep dokploy"
# Si ça affiche une ligne → OK ✅
```

---

## 📝 Étape 1 : Supabase (15 min)

### 1.1 Créer le projet

1. Va sur [supabase.com](https://supabase.com) → Sign up
2. **New Project** → Nom : `planning-vacances` → Région : **Europe (Frankfurt)**
3. Choisis un **mot de passe** fort → **Create**
4. Attends 2 minutes (☕ café)

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
2. ⚠️ **IMPORTANT** : Note ces valeurs dans un fichier texte :

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
     (⚠️ Remplace `xxxxxxxxxxxxx` par ton Project URL Supabase)
   - **Create**

4. ⚠️ **Note le Client ID et Client Secret**

### 2.3 Configurer dans Supabase

1. Retourne sur Supabase → **Authentication** → **Providers**
2. **Google** → **Enable**
3. Colle **Client ID** et **Client Secret**
4. **Save**

---

## 💻 Étape 3 : Préparer le Code (5 min)

### 3.1 Configurer le frontend

```bash
cd "/Users/loic/Documents/Claude-Code/Holiday planning/frontend"
cp config.js.example config.js
```

Édite `config.js` :
```javascript
export const SUPABASE_CONFIG = {
    url: 'https://xxxxxxxxxxxxx.supabase.co', // ← TON URL
    anonKey: 'eyJhbGci...' // ← TA CLÉ ANON
};
```

### 3.2 Tester localement (optionnel)

```bash
python3 -m http.server 8080
# Ouvre http://localhost:8080
# Teste OAuth → Si ça marche, c'est bon ! ✅
```

### 3.3 Pusher sur Git

```bash
cd "/Users/loic/Documents/Claude-Code/Holiday planning"
git init
git add .
git commit -m "Initial commit - Planning Vacances production"

# Crée un repo sur GitHub, puis :
git remote add origin https://github.com/ton-username/planning-vacances.git
git push -u origin main
```

---

## 🚀 Étape 4 : Déployer sur Dokploy (15 min)

### 4.1 Accéder à Dokploy

1. Ouvre `http://ton-vps.com:3000` (ou l'IP de ton VPS)
2. Connecte-toi

### 4.2 Créer l'application

1. **New Application**
2. Remplis :
   - **Type** : Docker
   - **Name** : `planning-vacances-frontend`
   - **Source** : Git
   - **Repository URL** : `https://github.com/ton-username/planning-vacances.git`
   - **Branch** : `main`
   - **Build Context** : `./frontend`
   - **Dockerfile Path** : `./frontend/Dockerfile`

3. **Domain** :
   - Si tu as un domaine : `planning-vacances.ton-domaine.com`
   - Sinon : utilise le domaine par défaut Dokploy

4. **Deploy** → Attends 2-3 minutes

### 4.3 Configurer SSL

1. Va dans **Settings** de l'application
2. **Auto SSL (Let's Encrypt)** → **Enable**
3. Attends 1 minute

---

## ✅ Étape 5 : Tester (10 min)

### 5.1 Accéder à l'app

Ouvre `https://planning-vacances.ton-domaine.com` (ou ton URL)

### 5.2 Tester OAuth

1. Clique **"Continuer avec Google"**
2. Connecte-toi avec ton compte Google
3. Tu dois être redirigé vers l'app ✅

### 5.3 Tester les fonctionnalités

**Créer un projet** :
1. Clique **"Mes Projets"** → **"Nouveau voyage"**
2. Nom : `Test` → **Enregistrer**
3. Le projet apparaît ✅

**Créer une activité** :
1. Sélectionne une date
2. Clique le bouton **"+"**
3. Titre : `Vol Paris-Rome` → Date : aujourd'hui → **Enregistrer**
4. L'activité apparaît ✅

**Tester la vue Planning** :
1. Clique **"📊 Planning Hebdomadaire"**
2. Les 52 semaines s'affichent ✅
3. Ajoute une région dans un jour → Recharge la page → La région est sauvegardée ✅

**Tester mobile** :
1. Ouvre sur ton smartphone (ou DevTools responsive)
2. La vue s'adapte (1 colonne) ✅

---

## 🎉 C'est Fini !

**Ton app est en production !** 🚀

**URL** : `https://planning-vacances.ton-domaine.com`

---

## 📋 Checklist Finale

- [ ] Supabase configuré (tables, storage, OAuth)
- [ ] Frontend déployé sur Dokploy
- [ ] HTTPS activé
- [ ] OAuth Google fonctionne
- [ ] Création de projet OK
- [ ] Création d'activité OK
- [ ] Vue Planning OK
- [ ] Responsive mobile OK

---

## 🔧 Si Quelque Chose Ne Marche Pas

### OAuth ne fonctionne pas

**Vérifier** :
- Redirect URI dans Google = `https://xxxxx.supabase.co/auth/v1/callback` (exact)
- Provider Google activé dans Supabase
- Client ID et Secret corrects

### App ne se charge pas

**Vérifier** :
- Build réussi dans Dokploy (Logs sans erreur)
- `config.js` contient les bonnes clés Supabase
- URL Supabase correcte (avec `https://`)

### Données ne se sauvegardent pas

**Vérifier** :
- RLS activé sur toutes les tables (voir `database/schema.sql`)
- Policies créées correctement
- User bien authentifié (icône avatar visible)

---

## 📚 Documentation Complète

Pour plus de détails :

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide complet pas à pas
- [CHECKLIST.md](./CHECKLIST.md) - Checklist détaillée
- [TROUBLESHOOTING](./DEPLOYMENT.md#troubleshooting) - Résolution de problèmes

---

## 🆘 Support

**En cas de problème** :

1. Vérifie les **logs** :
   - Supabase : Dashboard → Logs
   - Dokploy : Application → Logs
   - Navigateur : Console (F12)

2. Consulte [DEPLOYMENT.md - Troubleshooting](./DEPLOYMENT.md#troubleshooting)

3. Contacte le support avec :
   - Logs d'erreur
   - Captures d'écran
   - Étape où ça bloque

---

**Temps total : 45-60 minutes** ⏱️

**Prochaine étape** : Migrer tes données existantes → Voir [MIGRATION.md](./MIGRATION.md)

Bon voyage ! ✈️🌍
