# 🚀 START HERE - Planning Vacances (Coolify)

**Bienvenue dans le projet Planning Vacances !**

Ce fichier est ton **point d'entrée** pour déployer l'application en production avec **GitHub + Coolify**.

---

## 🎯 Infrastructure

**Ton stack de déploiement** :
- 📦 **GitHub** : Hébergement du code
- 🚀 **Coolify** : Orchestration et déploiement (auto-deploy sur push)
- 🖥️ **VPS Hostinger** : Serveur
- 🗄️ **Supabase** : Base de données + Auth + Storage (cloud)

---

## ❓ Par Où Commencer ?

### 🎯 Tu veux déployer RAPIDEMENT (< 1 heure) ?

**➡️ Ouvre [QUICKSTART_COOLIFY.md](./QUICKSTART_COOLIFY.md)**

Guide ultra-rapide qui te permet de déployer en 45-60 minutes :
- ⏱️ 15 min : Configurer Supabase
- ⏱️ 10 min : Configurer OAuth Google
- ⏱️ 10 min : Pousser sur GitHub
- ⏱️ 15 min : Déployer sur Coolify
- ⏱️ 10 min : Tester l'application

### 📖 Tu veux suivre un guide COMPLET ?

**➡️ Ouvre [DEPLOYMENT_COOLIFY.md](./DEPLOYMENT_COOLIFY.md)**

Guide exhaustif avec toutes les explications :
- Configuration Supabase détaillée
- OAuth (Google, Microsoft)
- Configuration GitHub
- Déploiement Coolify pas à pas
- Configuration SSL/HTTPS automatique
- Auto-deploy sur push
- Migration des données
- Troubleshooting complet

### ✅ Tu veux une CHECKLIST ?

**➡️ Ouvre [CHECKLIST.md](./CHECKLIST.md)**

Checklist complète (adaptée pour Coolify) :
- Prérequis (15 min)
- Supabase (30 min)
- OAuth (45 min)
- GitHub (10 min)
- Coolify (15 min)
- Tests (20 min)
- Sécurité (15 min)

**Total : ~2h30-3h** (avec toutes les vérifications)

### 🤔 Tu veux d'abord COMPRENDRE le projet ?

**➡️ Ouvre [README.md](./README.md)**

Vue d'ensemble complète :
- Fonctionnalités de l'application
- Stack technique
- Architecture

### 🏗️ Tu veux comprendre l'ARCHITECTURE ?

**➡️ Ouvre [ARCHITECTURE.md](./ARCHITECTURE.md)**

Documentation technique détaillée :
- Diagrammes d'architecture
- Flux de données
- Schéma de base de données
- Sécurité (RLS, policies)
- Performance et scalabilité

---

## 📚 Navigation Rapide

### Par Type de Tâche

| Je veux... | Fichier à ouvrir |
|------------|------------------|
| **Déployer rapidement (Coolify)** | [QUICKSTART_COOLIFY.md](./QUICKSTART_COOLIFY.md) ⚡ |
| **Guide complet (Coolify)** | [DEPLOYMENT_COOLIFY.md](./DEPLOYMENT_COOLIFY.md) |
| **Checklist détaillée** | [CHECKLIST.md](./CHECKLIST.md) |
| **Comprendre le projet** | [README.md](./README.md) |
| **Architecture technique** | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| **Migrer mes données** | [MIGRATION.md](./MIGRATION.md) |
| **Trouver un fichier** | [INDEX.md](./INDEX.md) |
| **Résumé du projet** | [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) |

### Raccourcis Utiles (Coolify)

| Besoin | Fichier | Section |
|--------|---------|---------|
| Setup Supabase | QUICKSTART_COOLIFY.md | Étape 1 |
| Setup OAuth | QUICKSTART_COOLIFY.md | Étape 2 |
| Setup GitHub | QUICKSTART_COOLIFY.md | Étape 3 |
| Déployer Coolify | QUICKSTART_COOLIFY.md | Étape 4 |
| Problèmes OAuth | DEPLOYMENT_COOLIFY.md | Troubleshooting |
| Problèmes Build | DEPLOYMENT_COOLIFY.md | Troubleshooting |
| Auto-deploy | DEPLOYMENT_COOLIFY.md | Configuration Coolify |
| Sauvegarder credentials | CREDENTIALS_TEMPLATE.md | Tout le fichier |

---

## ⚡ Quick Start en 3 Étapes

### 1️⃣ Valider ton environnement (5 min)

```bash
# Exécuter le script de validation
./validate.sh
```

Ce script vérifie que :
- ✅ Tous les fichiers sont présents
- ✅ `frontend/config.js` est configuré
- ✅ Git est initialisé
- ✅ Aucun secret n'est exposé

### 2️⃣ Configurer Supabase + OAuth + GitHub (30 min)

**Suivre :** [QUICKSTART_COOLIFY.md](./QUICKSTART_COOLIFY.md) → Étapes 1, 2 & 3

**Ce que tu vas faire :**
1. Créer un projet Supabase
2. Exécuter le schéma SQL
3. Configurer OAuth Google
4. Créer un repository GitHub
5. Pousser le code

### 3️⃣ Déployer sur Coolify (20 min)

**Suivre :** [QUICKSTART_COOLIFY.md](./QUICKSTART_COOLIFY.md) → Étapes 4 & 5

**Ce que tu vas faire :**
1. Connecter GitHub à Coolify
2. Créer l'application Coolify
3. Activer HTTPS (automatique)
4. Activer auto-deploy
5. Tester l'application

**Total : ~55 minutes** ⏱️

---

## 📂 Structure du Projet

```
planning-vacances/
│
├── 📄 START_HERE_COOLIFY.md   ← TU ES ICI
├── 📄 INDEX.md                # Navigation complète
│
├── 🚀 Guides de Déploiement (Coolify)
│   ├── QUICKSTART_COOLIFY.md  # Guide rapide (45-60 min)
│   ├── DEPLOYMENT_COOLIFY.md  # Guide complet (détaillé)
│   └── CHECKLIST.md           # Checklist exhaustive
│
├── 🚀 Guides de Déploiement (Dokploy - alternative)
│   ├── QUICKSTART.md          # Guide rapide Dokploy
│   └── DEPLOYMENT.md          # Guide complet Dokploy
│
├── 📖 Documentation
│   ├── README.md              # Vue d'ensemble
│   ├── ARCHITECTURE.md        # Documentation technique
│   ├── MIGRATION.md           # Migration localStorage
│   └── PROJECT_SUMMARY.md     # Résumé complet
│
├── 🔐 Configuration
│   ├── CREDENTIALS_TEMPLATE.md # Template credentials
│   ├── .env.example           # Template variables
│   └── validate.sh            # Script de validation
│
├── 💻 Code Source
│   ├── frontend/              # Application web (HTML/CSS/JS)
│   ├── backend/               # API Node.js (optionnel)
│   ├── database/              # Schéma SQL
│   └── docker-compose.yml     # Orchestration Docker
│
└── 📜 Planning Original
    └── planning-with-views.html # Version locale (localStorage)
```

---

## ✅ Prérequis

Avant de commencer, assure-toi d'avoir :

### Comptes Nécessaires

- [ ] **Compte Supabase** (gratuit) → [supabase.com](https://supabase.com)
- [ ] **Compte Google Cloud** (gratuit) → [console.cloud.google.com](https://console.cloud.google.com)
- [ ] **Compte GitHub** → [github.com](https://github.com)
- [ ] **VPS Hostinger** avec Coolify installé

### Accès Techniques

- [ ] Accès SSH à ton VPS Hostinger
- [ ] Coolify accessible via navigateur (`http://ton-vps:8000`)
- [ ] Git installé localement

### Installer Coolify (si pas encore fait)

```bash
ssh root@ton-vps-hostinger.com
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Accède ensuite à http://ton-vps:8000
```

### Optionnel

- [ ] Nom de domaine (recommandé pour OAuth)
- [ ] Compte Microsoft Azure (pour OAuth Microsoft)

---

## 🎯 Recommandation

**Pour un premier déploiement, suis ce parcours :**

```
1. Lis START_HERE_COOLIFY.md (ce fichier)    ← TU ES ICI
   ↓
2. Exécute ./validate.sh                      (5 min)
   ↓
3. Lis README.md                              (10 min)
   ↓
4. Suis QUICKSTART_COOLIFY.md                 (45-60 min)
   ↓
5. Vérifie CHECKLIST.md                       (10 min)
   ↓
6. 🎉 Application déployée !
```

**Temps total : ~1h30**

---

## 🆘 Besoin d'Aide ?

### Documentation

1. **INDEX.md** - Table des matières complète
2. **DEPLOYMENT_COOLIFY.md → Troubleshooting** - Résolution des problèmes courants
3. **ARCHITECTURE.md** - Comprendre comment tout fonctionne

### Support Externe

- **Supabase Discord** : [discord.supabase.com](https://discord.supabase.com)
- **Supabase Docs** : [docs.supabase.com](https://docs.supabase.com)
- **Coolify Discord** : [discord.com/invite/coolify](https://discord.com/invite/coolify)
- **Coolify Docs** : [coolify.io/docs](https://coolify.io/docs)

---

## 🔒 Sécurité

**⚠️ IMPORTANT** : Avant de commencer

1. **NE JAMAIS** commit les fichiers secrets sur Git :
   - `frontend/config.js` ❌
   - `backend/.env` ❌
   - `.env` ❌

2. Ces fichiers sont déjà dans `.gitignore` ✅

3. Utilise **CREDENTIALS_TEMPLATE.md** pour sauvegarder tes credentials dans un gestionnaire de mots de passe

---

## 🎉 Prêt à Commencer ?

**Prochaine étape recommandée :**

### Option 1 : Déploiement Rapide

```bash
# 1. Valider l'environnement
./validate.sh

# 2. Suivre le guide rapide
# Ouvre QUICKSTART_COOLIFY.md et suis les étapes
```

### Option 2 : Comprendre d'Abord

```bash
# 1. Lire la vue d'ensemble
# Ouvre README.md

# 2. Suivre le guide complet
# Ouvre DEPLOYMENT_COOLIFY.md
```

---

## 📊 Ce Qui T'Attend

Une fois déployé, tu auras :

✅ **Application web sécurisée** (HTTPS automatique)
✅ **Authentification OAuth** (Google, Microsoft)
✅ **Base de données cloud** (Supabase PostgreSQL)
✅ **Storage de fichiers** (Supabase Storage)
✅ **Backups automatiques** (quotidiens)
✅ **Auto-deploy sur push** (git push → redéploiement)
✅ **Multi-appareils** (sync cloud)
✅ **Responsive** (mobile + desktop)

---

## 🔄 Workflow de Mise à Jour (après déploiement)

Avec Coolify + GitHub, c'est automatique ! 🎉

```bash
# 1. Modifie le code localement
# 2. Commit
git add .
git commit -m "Update: description"

# 3. Push
git push origin main

# 4. Coolify redéploie automatiquement !
# (si Auto Deploy est activé)
```

---

## 🚀 Let's Go !

**Choisis ton guide et commence :**

- ⚡ **Rapide** → [QUICKSTART_COOLIFY.md](./QUICKSTART_COOLIFY.md)
- 📘 **Complet** → [DEPLOYMENT_COOLIFY.md](./DEPLOYMENT_COOLIFY.md)
- ✅ **Checklist** → [CHECKLIST.md](./CHECKLIST.md)

**Bon déploiement ! 🎉**

---

**Développé avec ❤️ et Claude Code**

✈️🌍 Planning Vacances - Version Production (Coolify)
