# 🚀 Démarrage Rapide - Mise à Jour de l'Application

## Étape 1 : Configuration Supabase (5 min)

### 1.1 Exécuter les scripts SQL

Dans Supabase **SQL Editor**, exécutez dans l'ordre :

```sql
-- 1. Script de base (si pas déjà fait)
-- Copiez le contenu de supabase-setup.sql

-- 2. Script de partage (nouveau)
-- Copiez le contenu de supabase-sharing-migration.sql
```

### 1.2 Activer l'authentification Email

1. **Authentication** > **Providers**
2. **Email** : Activé ✅
3. **Confirm email** : DÉCOCHÉ (pour les tests)

### 1.3 Créer le bucket Storage

1. **Storage** > **New bucket**
2. Name : `attachments`
3. **Public** : DÉCOCHÉ ❌
4. Save

5. **SQL Editor**, copiez `supabase-storage-setup.sql`

---

## Étape 2 : Modifier index.html (10 min)

### 2.1 Inclure les bibliothèques

Ajoutez **AVANT** la balise `</body>` :

```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Configuration -->
<script src="config.js"></script>

<!-- Validation des fichiers -->
<script src="file-validation.js"></script>

<!-- Intégration Supabase -->
<script src="app-supabase.js"></script>

<!-- Votre code existant -->
<script>
    // ... votre code JavaScript actuel ...
</script>
</body>
```

### 2.2 Remplacer la section de login

Recherchez dans votre HTML la section avec `class="login-container"`.

Remplacez-la par :

```html
<div class="login-container" id="loginScreen">
    <div class="login-box">
        <div class="login-logo">✈️</div>
        <h1 class="login-title">Planning Vacances</h1>
        <p class="login-subtitle">Organisez vos voyages en toute simplicité</p>

        <!-- Formulaire de connexion -->
        <div id="loginForm">
            <div class="form-group">
                <label class="form-label">📧 Email</label>
                <input
                    type="email"
                    class="form-input"
                    id="loginEmail"
                    placeholder="votre@email.com"
                    autocomplete="email"
                >
            </div>

            <div class="form-group">
                <label class="form-label">🔒 Mot de passe</label>
                <input
                    type="password"
                    class="form-input"
                    id="loginPassword"
                    placeholder="••••••••"
                    autocomplete="current-password"
                >
            </div>

            <button class="btn btn-primary" style="width: 100%; margin-bottom: 12px;" onclick="handleLogin()">
                Se connecter
            </button>

            <div style="text-align: center; margin-top: 16px;">
                <p style="font-size: 13px; color: #868e96; margin-bottom: 8px;">
                    Pas encore de compte ?
                </p>
                <button class="btn btn-secondary" onclick="showSignupForm()">
                    S'inscrire
                </button>
            </div>
        </div>

        <!-- Formulaire d'inscription (caché par défaut) -->
        <div id="signupForm" style="display: none;">
            <div class="form-group">
                <label class="form-label">📧 Email</label>
                <input
                    type="email"
                    class="form-input"
                    id="signupEmail"
                    placeholder="votre@email.com"
                    autocomplete="email"
                >
            </div>

            <div class="form-group">
                <label class="form-label">🔒 Mot de passe</label>
                <input
                    type="password"
                    class="form-input"
                    id="signupPassword"
                    placeholder="Minimum 6 caractères"
                    autocomplete="new-password"
                >
                <small style="font-size: 11px; color: #868e96;">
                    Au moins 6 caractères
                </small>
            </div>

            <button class="btn btn-primary" style="width: 100%; margin-bottom: 12px;" onclick="handleSignup()">
                Créer mon compte
            </button>

            <div style="text-align: center; margin-top: 16px;">
                <p style="font-size: 13px; color: #868e96; margin-bottom: 8px;">
                    Déjà un compte ?
                </p>
                <button class="btn btn-secondary" onclick="showLoginForm()">
                    Se connecter
                </button>
            </div>
        </div>

        <div class="divider">ou</div>

        <div class="demo-section">
            <p class="demo-title">Découvrir en mode démo</p>
            <button class="demo-btn" onclick="loginDemo()">Essayer sans compte</button>
        </div>
    </div>
</div>
```

### 2.3 Ajouter les fonctions JavaScript

Ajoutez ce code dans votre section `<script>` (après app-supabase.js) :

```javascript
// ============================================
// GESTION DE L'AUTHENTIFICATION
// ============================================

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

function showSignupForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    const result = await login(email, password);

    if (result.success) {
        currentUser = result.user;
        showApp();
    } else {
        alert('Erreur de connexion: ' + result.error);
    }
}

async function handleSignup() {
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!email || !password) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    if (password.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
        return;
    }

    const result = await signup(email, password);

    if (result.success) {
        alert('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        showLoginForm();
        // Pré-remplir l'email
        document.getElementById('loginEmail').value = email;
    } else {
        alert('Erreur lors de la création du compte: ' + result.error);
    }
}

async function handleLogout() {
    if (!confirm('Voulez-vous vraiment vous déconnecter ?')) {
        return;
    }

    const result = await logout();

    if (result.success) {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('appContainer').classList.remove('show');
        document.getElementById('addBtn').style.display = 'none';
    }
}

function loginDemo() {
    currentUser = {
        id: 'demo',
        email: 'demo@planningvacances.com',
        user_metadata: { name: 'Utilisateur Démo' }
    };
    showApp();
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').classList.add('show');
    document.getElementById('addBtn').style.display = 'flex';

    // Update user info
    const initials = currentUser.email.substring(0, 2).toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userName').textContent = currentUser.email;
    document.getElementById('userEmail').textContent = currentUser.email;

    // Charger les données
    loadAppData();
}

async function loadAppData() {
    // Charger les projets
    const result = await loadProjects();

    if (result.success) {
        projects = result.projects;

        if (projects.length === 0) {
            // Créer un projet par défaut
            await createProject('Mon premier voyage', '', []);
            await loadProjects();
        }

        currentProject = projects[0].id;
        renderProjects();
        renderCalendar();
    }
}

// Vérifier la session au chargement de la page
async function checkAuth() {
    const result = await checkSession();

    if (result.success) {
        currentUser = result.user;
        showApp();
    } else {
        // Afficher l'écran de login
        document.getElementById('loginScreen').style.display = 'flex';
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
```

### 2.4 Modifier la fonction handleFiles

Recherchez `function handleFiles(files)` et remplacez-la par :

```javascript
function handleFiles(files) {
    // Valider les fichiers
    const validation = validateFiles(files);

    // Si des fichiers sont invalides, afficher les erreurs
    if (!validation.valid) {
        alert('❌ Erreurs de validation :\n\n' + validation.errors.join('\n\n'));
        document.getElementById('fileInput').value = '';
        return;
    }

    // Traiter uniquement les fichiers valides
    validation.validFiles.forEach(file => {
        const reader = new FileReader();

        reader.onload = (e) => {
            currentAttachments.push({
                name: file.name,
                data: e.target.result,
                type: file.type,
                size: file.size,
                file: file // Garder la référence pour l'upload Supabase
            });
            renderAttachments();
        };

        reader.readAsDataURL(file);
    });

    // Réinitialiser l'input
    document.getElementById('fileInput').value = '';

    // Message de succès
    if (validation.validFiles.length > 0) {
        console.log(`✅ ${validation.validFiles.length} fichier(s) ajouté(s)`);
    }
}
```

### 2.5 Modifier le bouton Déconnexion

Recherchez le bouton de déconnexion et modifiez son onclick :

```html
<button class="logout-btn" onclick="handleLogout()">Déconnexion</button>
```

---

## Étape 3 : Ajouter le Partage de Projets

### 3.1 Ajouter un bouton de partage

Dans la section projet (`.project-actions`), ajoutez :

```html
<button class="project-action-btn" onclick="openShareModal('${p.id}')">🔗</button>
```

### 3.2 Créer la modal de partage

Ajoutez cette HTML après la modal `projectModal` :

```html
<!-- Share Modal -->
<div class="modal" id="shareModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title">Partager le projet</h3>
            <button class="modal-close" onclick="closeShareModal()">✕</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label class="form-label">Email du collaborateur</label>
                <input type="email" class="form-input" id="shareEmail" placeholder="email@exemple.com">
            </div>

            <div class="form-group">
                <label class="form-label">Permission</label>
                <select class="form-select" id="sharePermission">
                    <option value="read">Lecture seule</option>
                    <option value="write">Peut modifier</option>
                </select>
            </div>

            <button class="btn btn-primary" onclick="handleShareProject()">Partager</button>

            <div class="collaborators-list" id="collaboratorsList" style="margin-top: 24px;"></div>
        </div>
    </div>
</div>
```

### 3.3 Ajouter les fonctions de partage

```javascript
let currentSharingProjectId = null;

async function openShareModal(projectId) {
    currentSharingProjectId = projectId;
    document.getElementById('shareEmail').value = '';
    document.getElementById('sharePermission').value = 'read';
    document.getElementById('shareModal').classList.add('show');

    // Charger les collaborateurs existants
    await loadCollaborators(projectId);
}

function closeShareModal() {
    document.getElementById('shareModal').classList.remove('show');
    currentSharingProjectId = null;
}

async function handleShareProject() {
    const email = document.getElementById('shareEmail').value.trim();
    const permission = document.getElementById('sharePermission').value;

    if (!email) {
        alert('Veuillez entrer un email');
        return;
    }

    const result = await shareProject(currentSharingProjectId, email, permission);

    if (result.success) {
        alert(`Projet partagé avec ${email} !`);
        document.getElementById('shareEmail').value = '';
        await loadCollaborators(currentSharingProjectId);
    } else {
        alert('Erreur: ' + result.error);
    }
}

async function loadCollaborators(projectId) {
    const result = await loadProjectShares(projectId);

    if (result.success) {
        const list = document.getElementById('collaboratorsList');

        if (result.shares.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #868e96; font-size: 13px;">Aucun collaborateur</p>';
            return;
        }

        list.innerHTML = '<h4 style="font-size: 13px; font-weight: 600; color: #495057; margin-bottom: 12px;">Collaborateurs</h4>' +
            result.shares.map(share => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 8px;">
                    <div>
                        <div style="font-weight: 600; font-size: 14px;">${share.shared_with_email}</div>
                        <div style="font-size: 12px; color: #868e96;">
                            ${share.permission === 'write' ? '✏️ Peut modifier' : '👁️ Lecture seule'}
                        </div>
                    </div>
                    <button class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;" onclick="handleRemoveShare('${share.id}')">✕</button>
                </div>
            `).join('');
    }
}

async function handleRemoveShare(shareId) {
    if (!confirm('Retirer ce collaborateur ?')) {
        return;
    }

    const result = await removeProjectShare(shareId);

    if (result.success) {
        await loadCollaborators(currentSharingProjectId);
    } else {
        alert('Erreur: ' + result.error);
    }
}
```

---

## Étape 4 : Tester (5 min)

### Test 1 : Inscription
1. Ouvrez l'application
2. Cliquez "S'inscrire"
3. Email : `test@test.com`, Mot de passe : `password123`
4. ✅ Compte créé

### Test 2 : Connexion
1. Email : `test@test.com`, Mot de passe : `password123`
2. ✅ Connecté

### Test 3 : Partage
1. Créez un projet
2. Cliquez sur 🔗 (partager)
3. Entrez un email, choisissez "Peut modifier"
4. ✅ Partage créé

### Test 4 : Upload fichier
1. Créez une activité
2. Uploadez un PDF
3. ✅ Fichier accepté
4. Uploadez un .docx
5. ✅ Fichier rejeté

---

## Étape 5 : Déployer

```bash
git add .
git commit -m "Intégration Supabase complète + partage + validation fichiers"
git push
```

Votre application sera mise à jour sur GitHub Pages automatiquement !

---

## 🆘 Aide Rapide

### Problème : "supabaseClient is not defined"

✅ Vérifiez que vous avez bien inclus :
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="config.js"></script>
<script src="app-supabase.js"></script>
```

### Problème : "Row Level Security violated"

✅ Exécutez `supabase-setup.sql` et `supabase-sharing-migration.sql` dans SQL Editor

### Problème : Impossible de se connecter

✅ Vérifiez que Email Auth est activé dans Supabase **Authentication** > **Providers**

---

**Bon code ! 🚀**
