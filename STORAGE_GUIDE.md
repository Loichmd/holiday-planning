# Guide Supabase Storage - Pièces Jointes

Ce guide explique comment configurer et utiliser Supabase Storage pour stocker les pièces jointes (billets d'avion, réservations d'hôtel, etc.) de manière sécurisée.

## 📦 Création du Bucket

### Étape 1 : Créer le bucket dans Supabase

1. Allez dans **Storage** (menu de gauche)
2. Cliquez sur **New bucket**
3. Configurez :
   - **Name** : `attachments`
   - **Public bucket** : ❌ **DÉCOCHEZ** (bucket privé)
   - **File size limit** : `10 MB` (ou plus selon vos besoins)
   - **Allowed MIME types** : Laissez vide ou ajoutez :
     ```
     image/*
     application/pdf
     application/msword
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     ```
4. Cliquez sur **Create bucket**

### Étape 2 : Configurer les Policies de Sécurité

Exécutez le script [supabase-storage-setup.sql](supabase-storage-setup.sql) dans le SQL Editor.

Ce script créera 4 policies :
- ✅ Upload de fichiers (dans son propre dossier uniquement)
- ✅ Lecture de fichiers (ses propres fichiers uniquement)
- ✅ Modification de fichiers
- ✅ Suppression de fichiers

## 🔒 Structure des Dossiers

Chaque utilisateur aura son propre dossier identifié par son `user_id` :

```
attachments/
├── {user_id_1}/
│   ├── billet-avion-paris-tokyo.pdf
│   ├── reservation-hotel-shibuya.pdf
│   └── photo-passeport.jpg
├── {user_id_2}/
│   ├── assurance-voyage.pdf
│   └── carte-embarquement.png
└── {user_id_3}/
    └── ...
```

**Important** : Un utilisateur ne peut **JAMAIS** accéder aux fichiers d'un autre utilisateur grâce aux policies RLS.

## 💻 Utilisation dans le Code JavaScript

### Initialiser le Client Supabase avec Storage

```javascript
// Inclure la bibliothèque Supabase
import { createClient } from '@supabase/supabase-js'

// Configuration (utilise SUPABASE_CONFIG de config.js)
const supabase = createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey,
    SUPABASE_CONFIG.options
)
```

### Upload d'un fichier

```javascript
async function uploadAttachment(file, activityId) {
    try {
        // Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw new Error('Utilisateur non connecté')
        }

        // Créer un nom de fichier unique
        const timestamp = Date.now()
        const fileName = `${user.id}/${activityId}_${timestamp}_${file.name}`

        // Upload vers Supabase Storage
        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('Erreur upload:', error)
            throw error
        }

        console.log('Fichier uploadé:', data.path)
        return data.path

    } catch (error) {
        console.error('Erreur:', error)
        alert('Erreur lors de l\'upload du fichier')
        return null
    }
}
```

### Récupérer l'URL publique d'un fichier

```javascript
function getFileUrl(filePath) {
    const { data } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath)

    return data.publicUrl
}
```

**Note** : Même si on appelle ça "publicUrl", le fichier reste privé car le bucket est privé. L'URL sera signée automatiquement.

### Télécharger un fichier

```javascript
async function downloadFile(filePath) {
    try {
        const { data, error } = await supabase.storage
            .from('attachments')
            .download(filePath)

        if (error) throw error

        // Créer un lien de téléchargement
        const url = URL.createObjectURL(data)
        const a = document.createElement('a')
        a.href = url
        a.download = filePath.split('/').pop() // Nom du fichier
        a.click()

        URL.revokeObjectURL(url)

    } catch (error) {
        console.error('Erreur téléchargement:', error)
        alert('Erreur lors du téléchargement')
    }
}
```

### Supprimer un fichier

```javascript
async function deleteFile(filePath) {
    try {
        const { error } = await supabase.storage
            .from('attachments')
            .remove([filePath])

        if (error) throw error

        console.log('Fichier supprimé:', filePath)

    } catch (error) {
        console.error('Erreur suppression:', error)
        alert('Erreur lors de la suppression')
    }
}
```

### Lister les fichiers d'un utilisateur

```javascript
async function listUserFiles() {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error('Non connecté')

        const { data, error } = await supabase.storage
            .from('attachments')
            .list(user.id, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            })

        if (error) throw error

        return data

    } catch (error) {
        console.error('Erreur liste:', error)
        return []
    }
}
```

## 🎨 Intégration avec le formulaire d'activité

### HTML du formulaire (déjà présent dans index.html)

```html
<div class="form-group">
    <label class="form-label">Pièces jointes</label>
    <div class="file-upload" onclick="document.getElementById('fileInput').click()">
        <input type="file" id="fileInput" multiple onchange="handleFiles(this.files)">
        <div>📎 Cliquez pour ajouter des fichiers</div>
    </div>
    <div class="attachment-list" id="attachmentList"></div>
</div>
```

### JavaScript - Upload lors de l'enregistrement

```javascript
async function saveActivity() {
    // ... code existant pour sauvegarder l'activité ...

    // Upload des nouveaux fichiers vers Supabase Storage
    const uploadedFiles = []

    for (const attachment of currentAttachments) {
        if (attachment.file) { // Nouveau fichier à uploader
            const filePath = await uploadAttachment(attachment.file, activityData.id)
            if (filePath) {
                uploadedFiles.push({
                    name: attachment.name,
                    path: filePath,
                    type: attachment.type
                })
            }
        } else {
            // Fichier déjà uploadé (édition)
            uploadedFiles.push(attachment)
        }
    }

    // Sauvegarder les métadonnées dans la table activities
    activityData.attachments = uploadedFiles

    // ... suite du code ...
}
```

## 📊 Stocker les Métadonnées dans la Base de Données

Dans la table `activities`, le champ `attachments` est de type `JSONB` et stocke :

```json
[
    {
        "name": "billet-avion.pdf",
        "path": "user-uuid/activity-123_1234567890_billet-avion.pdf",
        "type": "application/pdf",
        "uploadedAt": "2025-01-15T10:30:00Z"
    },
    {
        "name": "reservation-hotel.jpg",
        "path": "user-uuid/activity-123_1234567891_reservation-hotel.jpg",
        "type": "image/jpeg",
        "uploadedAt": "2025-01-15T10:31:00Z"
    }
]
```

## 🧪 Test de la Sécurité Storage

Pour vérifier que les policies fonctionnent :

1. Connectez-vous avec le **User A**
2. Uploadez un fichier `test-user-a.pdf`
3. Notez le chemin : `{user_a_id}/test-user-a.pdf`
4. Déconnectez-vous
5. Connectez-vous avec le **User B**
6. Essayez d'accéder au fichier du User A :
   ```javascript
   await supabase.storage
       .from('attachments')
       .download('{user_a_id}/test-user-a.pdf')
   ```
7. ✅ **Résultat attendu** : Erreur "Access denied" → Storage est sécurisé
8. ❌ **Si ça fonctionne** : Les policies ne sont pas correctement configurées

## ⚠️ Limites et Quotas

### Plan Gratuit Supabase

- **Storage** : 1 GB
- **Bande passante** : 2 GB/mois
- **Taille max par fichier** : 50 MB

Si vous dépassez ces limites, passez au plan Pro (25$/mois).

## 🔧 Nettoyage des Fichiers Orphelins

Lorsqu'une activité est supprimée, pensez à supprimer aussi ses fichiers :

```javascript
async function deleteActivity(activityId) {
    const activity = activities.find(a => a.id === activityId)

    // Supprimer les fichiers du Storage
    if (activity.attachments && activity.attachments.length > 0) {
        const filePaths = activity.attachments.map(a => a.path)
        await supabase.storage
            .from('attachments')
            .remove(filePaths)
    }

    // Supprimer l'activité de la base de données
    await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)
}
```

## 📚 Ressources

- [Documentation Supabase Storage](https://supabase.com/docs/guides/storage)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Upload Files](https://supabase.com/docs/guides/storage/uploads)

## 🆘 Dépannage

### Erreur "Access Denied" lors de l'upload

**Cause** : Les policies ne sont pas configurées ou le bucket est public

**Solution** :
1. Vérifiez que le bucket est **privé** (pas public)
2. Exécutez le script `supabase-storage-setup.sql`
3. Vérifiez que l'utilisateur est bien connecté avec `auth.getUser()`

### Upload très lent

**Cause** : Fichiers trop volumineux

**Solution** :
1. Compressez les images avant upload
2. Limitez la taille des fichiers à 5-10 MB
3. Utilisez un loader pendant l'upload pour informer l'utilisateur

### Fichiers ne s'affichent pas

**Cause** : URL mal formée ou bucket public

**Solution** :
1. Utilisez `getPublicUrl()` pour les buckets publics
2. Utilisez `download()` puis `URL.createObjectURL()` pour les buckets privés
