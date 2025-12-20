# 🔐 Credentials & URLs - Planning Vacances

Template pour sauvegarder toutes tes credentials et URLs importantes.

⚠️ **IMPORTANT** : Ce fichier contient des secrets. **NE JAMAIS** le commit sur Git !

---

## 📋 Checklist de Sécurité

- [ ] Ce fichier est dans `.gitignore`
- [ ] Sauvegardé dans un gestionnaire de mots de passe (1Password, Bitwarden, etc.)
- [ ] Backup local chiffré
- [ ] Accès restreint (toi uniquement)

---

## 🗄️ Supabase

### Project Information

```
Project Name: planning-vacances
Project ID: xxxxxxxxxxxxx
Region: Europe (Frankfurt)
Created: YYYY-MM-DD
```

### Database

```
Database URL: postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
Database Password: [SAUVEGARDE TON MOT DE PASSE ICI]
```

### API Keys

```
Project URL: https://xxxxxxxxxxxxx.supabase.co

anon public key (frontend):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4eXh4eHh4eHh4eHh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk2ODI4NjgsImV4cCI6MjAwNTI1ODg2OH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

service_role key (backend - SECRET !):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4eXh4eHh4eHh4eHh4eHh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4OTY4Mjg2OCwiZXhwIjoyMDA1MjU4ODY4fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Dashboard

```
URL: https://app.supabase.com/project/xxxxxxxxxxxxx
Email: [TON EMAIL]
Password: [TON MOT DE PASSE]
2FA: [OUI/NON]
```

---

## 🔐 OAuth Providers

### Google OAuth

```
Project Name: Planning Vacances
Project ID: planning-vacances-123456

Client ID:
123456789012-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

Client Secret:
GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

Authorized Redirect URIs:
https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback

Google Cloud Console:
https://console.cloud.google.com/apis/credentials?project=planning-vacances-123456
```

### Microsoft OAuth (Azure)

```
Application Name: Planning Vacances
Application (client) ID:
12345678-1234-1234-1234-123456789012

Directory (tenant) ID:
common

Client Secret:
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Redirect URI:
https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback

Azure Portal:
https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Credentials/appId/12345678-1234-1234-1234-123456789012
```

### Apple OAuth (Optionnel)

```
Service ID:
com.planningvacances.signin

Team ID:
XXXXXXXXXX

Key ID:
XXXXXXXXXX

Private Key:
[Téléchargé depuis Apple Developer]

Apple Developer:
https://developer.apple.com/account/resources/identifiers/list/serviceId
```

---

## 🐳 Dokploy

### VPS Hostinger

```
IP Address: XXX.XXX.XXX.XXX
Hostname: vps-xxxxx.hostinger.com
SSH User: root
SSH Password/Key: [TON MOT DE PASSE/CLÉ]
```

### Dokploy Dashboard

```
URL: http://XXX.XXX.XXX.XXX:3000
    ou https://dokploy.ton-domaine.com
Email: [TON EMAIL]
Password: [TON MOT DE PASSE DOKPLOY]
```

### Application Frontend

```
Name: planning-vacances-frontend
Repository: https://github.com/ton-username/planning-vacances.git
Branch: main
Build Context: ./frontend
Dockerfile: ./frontend/Dockerfile

Domain: https://planning-vacances.ton-domaine.com
SSL: Let's Encrypt (auto)
```

### Application Backend (Optionnel)

```
Name: planning-vacances-backend
Repository: https://github.com/ton-username/planning-vacances.git
Branch: main
Build Context: ./backend
Dockerfile: ./backend/Dockerfile

Domain: https://api-planning.ton-domaine.com
Port: 3000
```

---

## 🌐 Domaine & DNS

### Domaine

```
Domain: ton-domaine.com
Registrar: [Hostinger/Cloudflare/OVH/etc.]
Expiration: YYYY-MM-DD
```

### DNS Records

```
A Record:
Host: planning-vacances
Value: XXX.XXX.XXX.XXX (IP du VPS)
TTL: 3600

A Record (API - optionnel):
Host: api-planning
Value: XXX.XXX.XXX.XXX (IP du VPS)
TTL: 3600

CNAME Record (optionnel):
Host: www.planning-vacances
Value: planning-vacances.ton-domaine.com
TTL: 3600
```

---

## 🔑 Git Repository

### GitHub/GitLab

```
Repository URL: https://github.com/ton-username/planning-vacances.git
Visibility: Private
Branch principale: main

GitHub Username: ton-username
GitHub Email: ton-email@example.com
GitHub Token (si nécessaire):
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📧 Emails & Notifications

### Email Principal

```
Email: ton-email@example.com
Usage: Notifications Supabase, Dokploy, OAuth
```

### Email de Support (optionnel)

```
Email: support@ton-domaine.com
Usage: Contact users
```

---

## 🔄 Backup & Recovery

### Supabase Backups

```
Fréquence: Quotidien (automatique)
Rétention: 7 jours (gratuit) / 30 jours (pro)
Dernière backup: [DATE]
Backup manuel: Database → Backups → Create Backup
```

### Git Repository Backup

```
Dernière backup: [DATE]
Commande:
git clone https://github.com/ton-username/planning-vacances.git backup-YYYY-MM-DD
```

### Credentials Backup

```
Gestionnaire de mots de passe: [1Password/Bitwarden/LastPass]
Backup chiffré local: [CHEMIN DU FICHIER]
Dernière mise à jour: [DATE]
```

---

## 📊 Monitoring & Analytics

### Supabase Dashboard

```
Database Usage: https://app.supabase.com/project/xxxxx/settings/database
Storage Usage: https://app.supabase.com/project/xxxxx/storage
Auth Users: https://app.supabase.com/project/xxxxx/auth/users
```

### Dokploy Metrics

```
Logs: http://dokploy.ton-domaine.com/apps/planning-vacances-frontend/logs
Metrics: http://dokploy.ton-domaine.com/apps/planning-vacances-frontend/metrics
```

### Google Analytics (optionnel)

```
Property ID: G-XXXXXXXXXX
Measurement ID: G-XXXXXXXXXX
URL: https://analytics.google.com/
```

---

## 🆘 Support & Documentation

### Documentation Projet

```
README: ./README.md
Deployment: ./DEPLOYMENT.md
Architecture: ./ARCHITECTURE.md
Quick Start: ./QUICKSTART.md
```

### Support Externe

```
Supabase Discord: https://discord.supabase.com
Supabase Docs: https://docs.supabase.com
Dokploy Discord: https://discord.dokploy.com
Dokploy Docs: https://docs.dokploy.com

Hostinger Support: https://www.hostinger.com/support
Ticket System: [URL si applicable]
```

---

## 🔄 Dernière Mise à Jour

```
Date: YYYY-MM-DD
Par: [TON NOM]
Version: 1.0
```

---

## ⚠️ Notes de Sécurité

### À FAIRE Régulièrement

- [ ] Changer les mots de passe tous les 6 mois
- [ ] Vérifier les accès OAuth (Google/Microsoft)
- [ ] Vérifier les backups Supabase
- [ ] Renouveler le domaine avant expiration
- [ ] Mettre à jour les dépendances (npm outdated)
- [ ] Vérifier les logs d'erreurs

### À NE JAMAIS FAIRE

- ❌ Commit ce fichier sur Git
- ❌ Partager les service_role keys
- ❌ Utiliser la même password partout
- ❌ Stocker les credentials en clair
- ❌ Désactiver HTTPS
- ❌ Exposer les API keys publiquement

---

## 📞 Contact d'Urgence

```
Développeur: [TON NOM]
Email: [TON EMAIL]
Téléphone: [TON NUMÉRO]
Timezone: Europe/Paris
```

---

**Ce fichier doit rester PRIVÉ et SÉCURISÉ.**

**Sauvegarde-le dans un gestionnaire de mots de passe !**

🔒 **CONFIDENTIAL** 🔒
