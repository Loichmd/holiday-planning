##

 🚀 Guide de Mise à Jour Majeure - Holiday Planning

Ce guide couvre 3 améliorations majeures de l'application :
1. **Validation des fichiers** (JPEG, PNG, PDF uniquement)
2. **Authentification Email/Password** (retrait OAuth)
3. **Partage de projets** entre utilisateurs

---

## 📋 Checklist Rapide

- [ ] Exécuter `supabase-sharing-migration.sql` dans Supabase
- [ ] Configurer l'authentification Email/Password dans Supabase
- [ ] Remplacer `index.html` et `planning-with-views.html`
- [ ] Tester l'inscription/connexion
- [ ] Tester le partage de projet
- [ ] Tester l'upload de fichiers

---

## 1️⃣ Configuration Supabase

### Étape 1.1 : Exécuter la migration SQL

Dans **SQL Editor** de Supabase, exécutez dans l'ordre :

1. **supabase-setup.sql** (si pas déjà fait)
2. **supabase-sharing-migration.sql** ← NOUVEAU

Cela créera :
- Table `project_shares` pour les partages
- Policies pour gérer read/write
- Fonction de liaison automatique par email

### Étape 1.2 : Activer Email/Password Authentication

1. Dans Supabase, allez dans **Authentication** > **Providers**
2. **Email** devrait être activé par défaut ✅
3. Dans **Email Auth** :
   - ✅ **Enable Email provider**
   - ✅ **Confirm email** : DÉCOCHÉ (pour simplifier les tests)
   - ✅ **Secure email change** : COCHÉ
   - ✅ **Secure password change** : COCHÉ

### Étape 1.3 : Configurer les emails (optionnel)

Par défaut, Supabase envoie des emails de confirmation.

**Pour les tests** : Désactivez la confirmation d'email
- **Authentication** > **Settings**
- **Email Confirmations** : DÉCOCHÉ

**Pour la production** : Activez et configurez votre service SMTP
- Voir [guide Supabase](https://supabase.com/docs/guides/auth/auth-smtp)

### Étape 1.4 : Désactiver les providers OAuth (optionnel)

Si vous voulez complètement retirer OAuth :

1. **Authentication** > **Providers**
2. Désactivez :
   - ❌ Google
   - ❌ Microsoft
   - ❌ Apple

---

## 2️⃣ Modifications de l'Application

### Changements principaux

#### Authentification Email/Password

**Avant** (OAuth) :
```javascript
function loginWithProvider(provider) {
    // Simulation OAuth
}
```

**Après** (Email/Password avec Supabase) :
```javascript
async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })
    // ...
}

async function signup(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    })
    // ...
}
```

#### Validation des fichiers

**Integration** :
```html
<script src="config.js"></script>
<script src="file-validation.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

**Dans handleFiles()** :
```javascript
function handleFiles(files) {
    const validation = validateFiles(files);
    if (!validation.valid) {
        alert(validation.errors.join('\n\n'));
        return;
    }
    // ... continuer avec validation.validFiles
}
```

#### Partage de projets

**Nouvelle fonctionnalité** :
```javascript
async function shareProject(projectId, email, permission = 'read') {
    const { data, error } = await supabase
        .from('project_shares')
        .insert({
            project_id: projectId,
            shared_with_email: email,
            shared_by_user_id: currentUser.id,
            permission: permission // 'read' ou 'write'
        })
    // ...
}
```

---

## 3️⃣ Nouvelle Interface de Login

### Écran de connexion/inscription

```
┌─────────────────────────────────┐
│         ✈️                      │
│   Planning Vacances             │
│   Organisez vos voyages         │
│                                 │
│   📧 Email                      │
│   [__________________]          │
│                                 │
│   🔒 Mot de passe               │
│   [__________________]          │
│                                 │
│   [  Se connecter  ]            │
│                                 │
│   Pas encore de compte ?        │
│   [   S'inscrire   ]            │
│                                 │
│   ─── ou ───                    │
│                                 │
│   [ Mode Démo ]                 │
└─────────────────────────────────┘
```

### Sécurité du mot de passe

Supabase gère automatiquement :
- ✅ Hachage bcrypt des mots de passe
- ✅ Salage unique par utilisateur
- ✅ Protection contre les attaques brute-force
- ✅ Validation côté serveur

**Règles de mot de passe** (configurables dans Supabase) :
- Minimum 6 caractères (par défaut)
- Vous pouvez imposer : majuscules, chiffres, caractères spéciaux

---

## 4️⃣ Partage de Projets - Guide Utilisateur

### Comment partager un projet

1. **Propriétaire du projet** :
   - Clic sur le projet
   - Bouton "Partager" (🔗)
   - Entre l'email du collaborateur
   - Choisit la permission :
     - **Lecture seule** : Peut voir, ne peut pas modifier
     - **Écriture** : Peut voir ET modifier

2. **Utilisateur invité** :
   - Reçoit un email (si configuré)
   - Se connecte à l'application
   - Voit automatiquement le projet partagé dans sa liste

### Permissions

| Action | Propriétaire | Permission Write | Permission Read |
|--------|--------------|------------------|-----------------|
| Voir le projet | ✅ | ✅ | ✅ |
| Voir les activités | ✅ | ✅ | ✅ |
| Créer des activités | ✅ | ✅ | ❌ |
| Modifier des activités | ✅ | ✅ | ❌ |
| Supprimer des activités | ✅ | ✅ | ❌ |
| Partager avec d'autres | ✅ | ❌ | ❌ |
| Supprimer le projet | ✅ | ❌ | ❌ |

### Interface de partage

```javascript
// Modal de partage
<div class="share-modal">
    <h3>Partager "Voyage à Tokyo"</h3>

    <input type="email" placeholder="email@exemple.com" />

    <select>
        <option value="read">Lecture seule</option>
        <option value="write">Peut modifier</option>
    </select>

    <button>Inviter</button>

    <!-- Liste des collaborateurs actuels -->
    <div class="collaborators-list">
        <div class="collaborator">
            <span>📧 marie@example.com</span>
            <span class="permission-badge">Peut modifier</span>
            <button class="remove-btn">✕</button>
        </div>
    </div>
</div>
```

---

## 5️⃣ Code JavaScript Complet

### Initialisation Supabase

```javascript
// Importer depuis CDN
const { createClient } = supabase

// Créer le client
const supabaseClient = createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey,
    SUPABASE_CONFIG.options
)
```

### Fonction de Signup

```javascript
async function signup() {
    const email = document.getElementById('signupEmail').value.trim()
    const password = document.getElementById('signupPassword').value

    // Validation basique
    if (!email || !password) {
        alert('Email et mot de passe requis')
        return
    }

    if (password.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères')
        return
    }

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        })

        if (error) throw error

        alert('Compte créé ! Vous pouvez maintenant vous connecter.')
        showLoginForm()

    } catch (error) {
        console.error('Erreur signup:', error)
        alert('Erreur lors de la création du compte: ' + error.message)
    }
}
```

### Fonction de Login

```javascript
async function login() {
    const email = document.getElementById('loginEmail').value.trim()
    const password = document.getElementById('loginPassword').value

    if (!email || !password) {
        alert('Email et mot de passe requis')
        return
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        })

        if (error) throw error

        currentUser = data.user
        showApp()

    } catch (error) {
        console.error('Erreur login:', error)
        alert('Erreur de connexion: ' + error.message)
    }
}
```

### Fonction de Partage

```javascript
async function shareProject(projectId) {
    const email = prompt('Email du collaborateur:')
    if (!email) return

    const permission = confirm('Autoriser les modifications ?') ? 'write' : 'read'

    try {
        const { data, error } = await supabaseClient
            .from('project_shares')
            .insert({
                project_id: projectId,
                shared_with_email: email,
                shared_by_user_id: currentUser.id,
                permission: permission
            })
            .select()

        if (error) throw error

        alert(`Projet partagé avec ${email} !`)
        loadProjectShares(projectId)

    } catch (error) {
        console.error('Erreur partage:', error)

        if (error.code === '23505') {
            alert('Ce projet est déjà partagé avec cet utilisateur')
        } else {
            alert('Erreur lors du partage: ' + error.message)
        }
    }
}
```

### Charger les partages d'un projet

```javascript
async function loadProjectShares(projectId) {
    try {
        const { data, error } = await supabaseClient
            .from('project_shares')
            .select('*')
            .eq('project_id', projectId)

        if (error) throw error

        // Afficher la liste des collaborateurs
        renderCollaborators(data)

    } catch (error) {
        console.error('Erreur chargement partages:', error)
    }
}
```

---

## 6️⃣ Tests

### Test 1 : Inscription et connexion

1. Cliquez sur "S'inscrire"
2. Entrez email : `test@example.com` et mot de passe : `password123`
3. ✅ Compte créé
4. Connectez-vous avec ces identifiants
5. ✅ Accès à l'application

### Test 2 : Partage de projet

1. Utilisateur A se connecte
2. Crée un projet "Voyage à Paris"
3. Clique sur "Partager"
4. Entre l'email de l'utilisateur B
5. Choisit permission "Peut modifier"
6. ✅ Partage créé

7. Utilisateur B se connecte (ou s'inscrit avec cet email)
8. ✅ Voit "Voyage à Paris" dans sa liste de projets
9. ✅ Peut créer/modifier des activités

### Test 3 : Permissions read-only

1. Partagez un projet avec permission "Lecture seule"
2. L'utilisateur invité se connecte
3. ✅ Voit le projet et les activités
4. ❌ Ne peut PAS créer/modifier des activités (bouton + désactivé)

### Test 4 : Upload de fichiers

1. Créez une activité
2. Essayez d'uploader un fichier `.docx`
3. ✅ Message d'erreur "Type non autorisé"
4. Uploadez un fichier `.pdf`
5. ✅ Fichier accepté et uploadé vers Supabase Storage

---

## 7️⃣ Déploiement

### Fichiers à commit sur GitHub

```bash
git add index.html
git add planning-with-views.html
git add config.js
git add file-validation.js
git add supabase-sharing-migration.sql
git add MAJOR_UPDATE_GUIDE.md

git commit -m "Ajout auth email/password + partage projets + validation fichiers"
git push
```

### Activer GitHub Pages (si pas déjà fait)

1. **Settings** > **Pages**
2. Source : **main** branch, **/ (root)**
3. Save

Votre application sera disponible à :
`https://loichmd.github.io/holiday-planning/`

---

## 8️⃣ Sécurité - Checklist Finale

### Base de données
- [x] RLS activé sur `projects`
- [x] RLS activé sur `activities`
- [x] RLS activé sur `project_shares`
- [x] Policies testées avec 2 comptes différents

### Authentification
- [x] Mots de passe hachés par Supabase (bcrypt)
- [x] Pas de service_role key dans le code
- [x] Uniquement anon key (publique) exposée

### Storage
- [x] Bucket `attachments` privé
- [x] Policies RLS sur storage.objects
- [x] Types MIME limités (jpeg, png, pdf)
- [x] Taille limitée (10 MB)

### Partage
- [x] Utilisateur ne peut partager QUE ses propres projets
- [x] Permissions read/write respectées
- [x] Impossible d'accéder aux projets non-partagés

---

## 9️⃣ FAQ

### Q: Que se passe-t-il si je partage avec un email qui n'existe pas encore ?

**R:** Le partage est créé avec `shared_with_user_id = NULL`. Quand l'utilisateur s'inscrit avec cet email, le trigger `link_pending_project_shares` lie automatiquement le partage à son compte.

### Q: Puis-je partager un projet avec plusieurs personnes ?

**R:** Oui ! Vous pouvez créer plusieurs partages pour le même projet, chacun avec son propre email et permission.

### Q: Comment révoquer un partage ?

**R:** Supprimez l'entrée dans `project_shares` :
```javascript
await supabaseClient
    .from('project_shares')
    .delete()
    .eq('id', shareId)
```

### Q: Les fichiers uploadés sont-ils partagés aussi ?

**R:** Oui ! Les fichiers sont liés aux activités, qui sont liées au projet. Si le projet est partagé, les fichiers le sont aussi (selon les permissions).

### Q: Combien de temps les sessions restent-elles actives ?

**R:** Par défaut, 1 semaine. Configurable dans Supabase **Authentication** > **Settings** > **Session expiry**.

---

## 🆘 Support

Pour les bugs ou questions :
- Vérifiez les logs dans la console navigateur (F12)
- Vérifiez les logs Supabase dans **Logs** > **Database**
- Créez une issue sur GitHub

---

**Bon déploiement ! 🚀**
