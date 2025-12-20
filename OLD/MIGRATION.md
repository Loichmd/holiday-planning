# 📤 Guide de Migration - localStorage → Supabase

Ce guide explique comment migrer tes données existantes de l'ancienne version (localStorage) vers la version production (Supabase).

---

## 🎯 Objectif

Transférer toutes tes données stockées en **localStorage** dans ton navigateur vers la **base de données Supabase** sans perte de données.

---

## ⚠️ Avant de Commencer

### Prérequis

- ✅ Application production déployée et fonctionnelle
- ✅ Compte créé via OAuth (Google ou Microsoft)
- ✅ Données existantes dans localStorage de l'ancienne version

### Vérifier si tu as des données à migrer

1. Ouvre l'ancienne version de l'app dans ton navigateur
2. Ouvre la console (F12 → Console)
3. Exécute cette commande :

```javascript
// Pour mode démo
console.log(localStorage.getItem('planningVoyages_demo'));

// Pour Google
console.log(localStorage.getItem('planningVoyages_google_123'));

// Pour Microsoft
console.log(localStorage.getItem('planningVoyages_ms_456'));

// Pour Apple
console.log(localStorage.getItem('planningVoyages_apple_789'));
```

Si tu vois du JSON (pas `null`), tu as des données à migrer ! 📦

---

## 🚀 Méthode 1 : Migration Automatique (Recommandée)

### Étapes

1. **Ouvre la nouvelle version de l'app**
   ```
   https://planning-vacances.ton-domaine.com
   ```

2. **Connecte-toi avec OAuth**
   - Clique sur "Continuer avec Google" (ou Microsoft)
   - Authentifie-toi avec le **même compte** que tu utilisais en mode démo

3. **Clique sur "Importer mes données"**
   - Tu verras ce bouton sur l'écran de login (uniquement si des données localStorage existent)
   - Clique dessus

4. **Attends la migration**
   - Un message de confirmation s'affiche : "Migration réussie ! X projet(s) créé(s)"
   - Toutes tes données sont maintenant dans Supabase

5. **Vérifie les données**
   - Rafraîchis la page
   - Tous tes projets et activités doivent être présents

### Que se passe-t-il ?

```javascript
// Le système fait automatiquement:
1. Lit localStorage (`planningVoyages_{userId}`)
2. Crée les projets dans Supabase
3. Crée les activités dans Supabase
4. Crée les régions dans Supabase
5. Sauvegarde l'ancien localStorage en backup (_backup suffix)
6. Supprime l'ancien localStorage
```

### Backup Automatique

Avant de supprimer, le système crée un backup :
```javascript
localStorage.setItem('planningVoyages_demo_backup', oldData);
localStorage.setItem('planningVoyages_demo_regions_backup', oldRegions);
```

Pour restaurer le backup (si problème) :
```javascript
const backup = localStorage.getItem('planningVoyages_demo_backup');
localStorage.setItem('planningVoyages_demo', backup);
```

---

## 🛠️ Méthode 2 : Migration Manuelle (Si la méthode 1 échoue)

### Étape 1 : Exporter les données

1. Ouvre l'ancienne version de l'app
2. Ouvre la console (F12)
3. Exécute ce script pour extraire toutes les données :

```javascript
// Extraire les données
const userId = 'demo'; // ou 'google_123', 'ms_456', etc.
const storageKey = `planningVoyages_${userId}`;
const regionsKey = `planningVoyages_${userId}_regions`;

const data = localStorage.getItem(storageKey);
const regions = localStorage.getItem(regionsKey);

if (data) {
    // Créer un fichier téléchargeable
    const exportData = {
        projects: JSON.parse(data).projects,
        activities: JSON.parse(data).activities,
        regions: regions ? JSON.parse(regions) : {}
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'planning-vacances-export.json';
    a.click();

    console.log('✅ Données exportées dans planning-vacances-export.json');
} else {
    console.log('❌ Aucune donnée trouvée');
}
```

4. Un fichier `planning-vacances-export.json` est téléchargé

### Étape 2 : Vérifier les données exportées

Ouvre le fichier JSON et vérifie le format :

```json
{
  "projects": [
    {
      "id": "1734567890123",
      "name": "Voyage Italie",
      "description": "Vacances d'été",
      "travelers": ["Marie", "Thomas"]
    }
  ],
  "activities": [
    {
      "id": "1734567890124",
      "projectId": "1734567890123",
      "title": "Vol Paris-Rome",
      "date": "2025-06-15",
      "time": "14:30",
      "duration": 2.5,
      "category": "avion",
      "location": "CDG Airport",
      "url": "https://...",
      "notes": "Gate A12",
      "travelers": ["Marie", "Thomas"],
      "attachments": []
    }
  ],
  "regions": {
    "2025-06-15": "Paris",
    "2025-06-16": "Rome"
  }
}
```

### Étape 3 : Importer dans Supabase

#### Option A : Via l'API de migration (si backend déployé)

```javascript
// Dans la console de la nouvelle app
const exportedData = /* coller le contenu du JSON ici */;

fetch('https://api-planning.ton-domaine.com/api/migrate', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabase.auth.session().access_token}`
    },
    body: JSON.stringify(exportedData)
})
.then(r => r.json())
.then(data => console.log('Migration result:', data));
```

#### Option B : Via SQL direct (Supabase Dashboard)

1. Va dans Supabase → SQL Editor
2. Exécute ce script (adapte les valeurs) :

```sql
-- 1. Créer le projet
INSERT INTO projects (owner_id, name, description, travelers)
VALUES (
    '{{ user_id }}', -- Récupère via: SELECT auth.uid()
    'Voyage Italie',
    'Vacances d''été',
    ARRAY['Marie', 'Thomas']
)
RETURNING id; -- Note l'ID retourné (ex: 'a1b2c3d4-...')

-- 2. Créer les activités (utilise l'ID du projet ci-dessus)
INSERT INTO activities (project_id, title, date, time, duration, category, location, url, notes, travelers)
VALUES (
    'a1b2c3d4-...', -- ID du projet
    'Vol Paris-Rome',
    '2025-06-15',
    '14:30',
    2.5,
    'avion',
    'CDG Airport',
    'https://...',
    'Gate A12',
    ARRAY['Marie', 'Thomas']
);

-- 3. Créer les régions
INSERT INTO day_regions (project_id, date, region)
VALUES
    ('a1b2c3d4-...', '2025-06-15', 'Paris'),
    ('a1b2c3d4-...', '2025-06-16', 'Rome');
```

### Étape 4 : Vérifier la migration

1. Rafraîchis l'app
2. Vérifie que tous les projets sont présents
3. Vérifie que toutes les activités sont présentes
4. Vérifie que les régions sont présentes

---

## 📎 Migration des Fichiers Attachés

⚠️ **Problème** : Les fichiers en base64 dans localStorage ne sont **pas** migrés automatiquement car :
- Trop volumineux pour localStorage → Supabase
- Format incompatible (base64 vs fichiers binaires)

### Solution

1. **Re-télécharge les fichiers originaux** (PDF, images)
2. **Re-upload via l'interface** :
   - Édite chaque activité
   - Upload les fichiers à nouveau
   - Supabase les stocke dans Storage

### Script de Récupération des Fichiers (Avancé)

Si tu veux extraire les fichiers base64 de localStorage :

```javascript
const activities = JSON.parse(localStorage.getItem('planningVoyages_demo')).activities;

activities.forEach((activity, index) => {
    if (activity.attachments && activity.attachments.length > 0) {
        activity.attachments.forEach((attachment, attIndex) => {
            // Convertir base64 en blob et télécharger
            const byteString = atob(attachment.data.split(',')[1]);
            const mimeString = attachment.data.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activity.title}_${attachment.name}`;
            a.click();
        });
    }
});
```

---

## 🔍 Troubleshooting

### Problème : "Aucune donnée à migrer" (bouton caché)

**Solution** :
1. Vérifie que tu es sur l'ancienne URL (ou localhost)
2. Vérifie que localStorage contient des données (voir commande au début)
3. Force la migration manuelle (Méthode 2)

### Problème : Migration échoue avec erreur 401

**Cause** : Token JWT expiré ou invalide

**Solution** :
1. Déconnecte-toi
2. Reconnecte-toi
3. Réessaye la migration

### Problème : Projets créés mais vides (pas d'activités)

**Cause** : Erreur lors de l'insertion des activités (RLS, foreign key)

**Solution** :
1. Vérifie les logs dans la console
2. Vérifie que les `project_id` correspondent
3. Réessaye la migration manuelle (Méthode 2) avec SQL

### Problème : Dates incorrectes après migration

**Cause** : Problème de timezone (ISO string vs local string)

**Solution** :
Les dates sont stockées en format `YYYY-MM-DD` (pas de timezone). Vérifie que le format est correct :
```javascript
// ✅ Bon format
"2025-06-15"

// ❌ Mauvais format
"2025-06-15T14:30:00.000Z"
```

---

## 🎯 Checklist de Migration

- [ ] Backup localStorage (export JSON)
- [ ] Déploiement production fonctionnel
- [ ] Connexion OAuth réussie
- [ ] Migration automatique lancée OU migration manuelle effectuée
- [ ] Projets vérifiés (nombre, noms)
- [ ] Activités vérifiées (nombre, dates, catégories)
- [ ] Régions vérifiées (lieux par jour)
- [ ] Fichiers re-uploadés (si applicable)
- [ ] Ancienne app localStorage backupé puis supprimé

---

## 📊 Comparaison Avant/Après

| Aspect | Avant (localStorage) | Après (Supabase) |
|--------|---------------------|------------------|
| Stockage | Navigateur (5-10 MB max) | Cloud (500 MB - 8 GB) |
| Synchronisation | ❌ Un seul appareil | ✅ Multi-appareils |
| Fichiers | Base64 (limité) | Storage cloud (1 GB+) |
| Partage | ❌ Impossible | ✅ Partage entre users |
| Backup | ❌ Manuel | ✅ Automatique quotidien |
| Perte de données | ⚠️ Si cache vidé | ✅ Sécurisé cloud |

---

## 🆘 Support

**En cas de problème de migration** :

1. Garde précieusement ton export JSON (`planning-vacances-export.json`)
2. Contacte le support avec :
   - Fichier JSON
   - Logs d'erreur (console F12)
   - ID utilisateur Supabase

**Récupération d'urgence** :

Si tout échoue, tu peux toujours restaurer localStorage :
```javascript
const backup = /* coller le JSON exporté */;
localStorage.setItem('planningVoyages_demo', JSON.stringify({
    projects: backup.projects,
    activities: backup.activities
}));
localStorage.setItem('planningVoyages_demo_regions', JSON.stringify(backup.regions));
```

---

**Dernière mise à jour** : 2025-01-XX
