# Intégration de la Validation des Fichiers

Ce guide explique comment intégrer la validation des fichiers (JPEG, PNG, PDF uniquement) dans votre application.

## 📋 Types de fichiers autorisés

- ✅ **Images JPEG** (.jpg, .jpeg)
- ✅ **Images PNG** (.png)
- ✅ **Documents PDF** (.pdf)
- ❌ **Tous les autres types** (doc, xls, zip, etc.)

**Taille maximale** : 10 MB par fichier

## 🔧 Intégration dans index.html

### Étape 1 : Inclure le fichier de validation

Dans votre `index.html`, ajoutez cette ligne **AVANT** la balise `</body>` :

```html
<!-- Juste avant </body> -->
<script src="config.js"></script>
<script src="file-validation.js"></script>
<script>
    // Votre code JavaScript existant...
</script>
</body>
```

### Étape 2 : Modifier la fonction handleFiles

Remplacez votre fonction `handleFiles` actuelle par celle-ci :

```javascript
function handleFiles(files) {
    // Valider les fichiers
    const validation = validateFiles(files);

    // Si des fichiers sont invalides, afficher les erreurs
    if (!validation.valid) {
        alert('❌ Erreurs de validation :\n\n' + validation.errors.join('\n\n'));

        // Réinitialiser l'input file
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
                file: file // Garder la référence pour l'upload
            });
            renderAttachments();
        };

        reader.readAsDataURL(file);
    });

    // Réinitialiser l'input pour permettre de re-sélectionner les mêmes fichiers
    document.getElementById('fileInput').value = '';

    // Afficher un message de succès
    if (validation.validFiles.length > 0) {
        console.log(`✅ ${validation.validFiles.length} fichier(s) ajouté(s)`);
    }
}
```

### Étape 3 : Améliorer l'affichage des pièces jointes

Modifiez votre fonction `renderAttachments` pour afficher les icônes et tailles :

```javascript
function renderAttachments() {
    const list = document.getElementById('attachmentList');
    list.innerHTML = currentAttachments.map((att, idx) => {
        const icon = getFileIcon(att.type);
        const size = att.size ? formatFileSize(att.size) : '';

        return `
            <div class="attachment-item">
                <span class="attachment-icon">${icon}</span>
                <span class="attachment-name">${att.name}</span>
                ${size ? `<span class="attachment-size">${size}</span>` : ''}
                <button class="attachment-remove" onclick="removeAttachment(${idx})">✕</button>
            </div>
        `;
    }).join('');
}
```

### Étape 4 : Ajouter le style pour la taille des fichiers

Dans la section `<style>` de votre `index.html`, ajoutez :

```css
.attachment-size {
    font-size: 11px;
    color: #868e96;
    margin-left: auto;
    margin-right: 8px;
}
```

## 🎨 Amélioration de l'UX - Zone de drag & drop

Optionnel : Ajoutez le drag & drop pour une meilleure expérience :

```javascript
// Initialiser le drag & drop
document.addEventListener('DOMContentLoaded', function() {
    const fileUpload = document.querySelector('.file-upload');

    if (fileUpload) {
        // Empêcher le comportement par défaut
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileUpload.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Highlight sur dragover
        ['dragenter', 'dragover'].forEach(eventName => {
            fileUpload.addEventListener(eventName, () => {
                fileUpload.style.borderColor = '#228be6';
                fileUpload.style.background = '#e7f5ff';
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            fileUpload.addEventListener(eventName, () => {
                fileUpload.style.borderColor = '#e9ecef';
                fileUpload.style.background = 'white';
            }, false);
        });

        // Gérer le drop
        fileUpload.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }, false);
    }
});
```

## 🧪 Tester la validation

### Test 1 : Type de fichier invalide
1. Essayez d'uploader un fichier `.doc` ou `.txt`
2. ✅ **Résultat attendu** : Message d'erreur "Type de fichier non autorisé"

### Test 2 : Fichier trop volumineux
1. Essayez d'uploader une image > 10 MB
2. ✅ **Résultat attendu** : Message d'erreur "Fichier trop volumineux"

### Test 3 : Fichiers valides
1. Uploadez une image `.jpg`, `.png` et un `.pdf`
2. ✅ **Résultat attendu** : Les 3 fichiers sont ajoutés avec leurs icônes

### Test 4 : Mix valide/invalide
1. Sélectionnez 1 fichier `.jpg` + 1 fichier `.doc`
2. ✅ **Résultat attendu** : Erreur pour le `.doc`, le `.jpg` n'est pas ajouté non plus

## 📦 Configuration Supabase Storage

Pour renforcer la sécurité côté serveur, configurez aussi le bucket :

1. **Storage** → **attachments** → **Edit bucket**
2. Dans **Allowed MIME types** :
   ```
   image/jpeg
   image/png
   application/pdf
   ```
3. Dans **File size limit** : `10485760` (10 MB en octets)

Cela créée une **double validation** :
- ✅ Côté client (UX rapide)
- ✅ Côté serveur Supabase (sécurité)

## 🔒 Sécurité

La validation côté client **N'EST PAS** une sécurité absolue (peut être contournée).

La vraie sécurité vient de :
1. **Configuration du bucket Supabase** (limite MIME types)
2. **Row Level Security** (isolation par utilisateur)
3. **Validation côté client** (améliore l'UX)

## ⚠️ Messages d'erreur personnalisés

Vous pouvez personnaliser les messages d'erreur dans `file-validation.js` :

```javascript
// Exemple de message plus amical
if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
        valid: false,
        error: `🚫 Désolé, seuls les fichiers JPEG, PNG et PDF sont acceptés.\n\nVotre fichier : ${file.name}\nType détecté : ${file.type || 'inconnu'}`
    };
}
```

## 📱 Responsive - Mobile

Sur mobile, l'input file ouvrira automatiquement :
- 📷 **L'appareil photo** pour les images
- 📁 **Le gestionnaire de fichiers** pour les PDF

Assurez-vous que l'attribut `accept` est défini :

```html
<input
    type="file"
    id="fileInput"
    multiple
    accept="image/jpeg,image/png,application/pdf"
    onchange="handleFiles(this.files)"
>
```

Cela filtre directement les types de fichiers dans le sélecteur natif !

## 🎯 Checklist d'intégration

- [ ] Inclure `file-validation.js` dans `index.html`
- [ ] Modifier la fonction `handleFiles()`
- [ ] Ajouter l'attribut `accept` à l'input file
- [ ] Tester avec différents types de fichiers
- [ ] Configurer les MIME types autorisés dans Supabase
- [ ] Tester l'upload réel vers Supabase Storage
- [ ] Vérifier que les policies Storage fonctionnent

## 🆘 Dépannage

### Problème : Tous les fichiers sont rejetés

**Solution** : Vérifiez que `file-validation.js` est bien chargé avant votre code principal.

### Problème : L'upload fonctionne en local mais pas en production

**Solution** : Vérifiez que `file-validation.js` est bien déployé sur GitHub Pages.

### Problème : Les PDF sont rejetés

**Solution** : Certains PDF ont le MIME type `application/x-pdf`. Ajoutez-le dans `ALLOWED_MIME_TYPES`.
