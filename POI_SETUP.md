# Configuration des Points d'Intérêt (POI)

## Mise en place de la base de données

### 1. Exécuter le script SQL

1. Connectez-vous à votre [Dashboard Supabase](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (dans le menu de gauche)
4. Cliquez sur **New Query**
5. Copiez-collez le contenu du fichier `supabase-create-points-of-interest.sql`
6. Cliquez sur **Run** (ou Ctrl/Cmd + Enter)

### 2. Vérification

Une fois le script exécuté, vérifiez que :

- La table `points_of_interest` existe dans **Database** → **Tables**
- Les colonnes sont correctes :
  - `id` (UUID, PRIMARY KEY)
  - `user_id` (UUID, FOREIGN KEY → auth.users)
  - `project_id` (UUID, FOREIGN KEY → projects)
  - `name` (TEXT, NOT NULL)
  - `address` (TEXT, NOT NULL)
  - `category` (TEXT)
  - `notes` (TEXT)
  - `priority` (TEXT)
  - `latitude` (DECIMAL)
  - `longitude` (DECIMAL)
  - `assigned_date` (TEXT, nullable)
  - `assigned_time` (TEXT, nullable)
  - `order_in_day` (INTEGER, nullable)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
  - `updated_at` (TIMESTAMP WITH TIME ZONE)

- Les politiques RLS sont actives dans **Authentication** → **Policies**

## Fonctionnalités

### Workflow de planification

1. **Phase de préparation** :
   - Ajoutez des points d'intérêt (restaurants, musées, activités)
   - Renseignez : nom, adresse, catégorie, priorité, notes
   - Les POI sont automatiquement géocodés et positionnés sur la carte

2. **Visualisation** :
   - Vue carte affiche TOUS les POI (assignés et non assignés)
   - Les POI non assignés apparaissent dans une sidebar latérale
   - Différenciation visuelle par priorité (incontournable, important, normale, si possible)

3. **Organisation** :
   - Glissez-déposez les POI depuis la sidebar vers les jours du planning
   - Les POI assignés gardent leur statut mais sont liés à un jour
   - Vous pouvez les réorganiser ou les désassigner

### Priorités

- **Incontournable** : POI à ne pas manquer (marqueur rouge)
- **Important** : POI très intéressant (marqueur orange)
- **Normale** : POI intéressant (marqueur bleu)
- **Si possible** : POI optionnel (marqueur gris)

### Catégories

Mêmes catégories que les activités :
- Restaurant
- Activité
- Visite
- Transport
- Hébergement
- Shopping
- Autre

## API Functions disponibles

### Chargement
```javascript
const result = await loadPOIs(projectId);
// result = { success: true, pois: [...] }
```

### Création
```javascript
const result = await createPOI({
    project_id: projectId,
    name: "Tour Eiffel",
    address: "Champ de Mars, 5 Av. Anatole France, 75007 Paris",
    category: "visite",
    notes: "Réserver à l'avance",
    priority: "incontournable"
});
```

### Mise à jour
```javascript
const result = await updatePOI(poiId, {
    name: "Nouveau nom",
    priority: "important"
});
```

### Assignation à un jour
```javascript
const result = await assignPOIToDay(poiId, "2025-08-15", "14:00", 1);
```

### Désassignation
```javascript
const result = await unassignPOI(poiId);
```

### Suppression
```javascript
const result = await deletePOI(poiId);
```

### Géocodage
```javascript
const result = await geocodePOI(poiId, address);
// Automatiquement appelé lors de la création/modification
```
