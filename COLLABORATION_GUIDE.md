# Guide de Collaboration - Holiday Planning

## Fonctionnalités de Collaboration

Votre application de planning de vacances permet maintenant de partager des projets avec d'autres utilisateurs et de collaborer en temps réel.

### Ce que peuvent faire les collaborateurs

#### Propriétaire du projet
- ✅ Créer, modifier, supprimer le projet
- ✅ Ajouter/retirer des collaborateurs
- ✅ Modifier les permissions des collaborateurs
- ✅ Créer, modifier, supprimer des activités
- ✅ Gérer tous les aspects du projet

#### Collaborateur avec permission "Peut modifier" (write)
- ✅ Voir le projet et toutes les activités
- ✅ Créer, modifier, supprimer des activités
- ✅ Ajouter d'autres collaborateurs
- ✅ Retirer d'autres collaborateurs
- ✅ Se retirer du projet
- ❌ Supprimer le projet (seul le propriétaire peut)

#### Collaborateur avec permission "Lecture seule" (read)
- ✅ Voir le projet et toutes les activités
- ✅ Se retirer du projet
- ❌ Modifier les activités
- ❌ Ajouter/retirer des collaborateurs

---

## Configuration de la Base de Données

### Étape 1 : Configuration de base (si pas déjà fait)

1. **Aller dans votre projet Supabase** : https://supabase.com/dashboard
2. **SQL Editor** → Exécuter `supabase-setup.sql`
3. **SQL Editor** → Exécuter `supabase-sharing-migration.sql`

### Étape 2 : Mise à jour pour la collaboration complète

**IMPORTANT** : Exécutez le nouveau script pour permettre aux collaborateurs de gérer d'autres collaborateurs.

1. **SQL Editor** → Exécuter `supabase-sharing-update.sql`

Ce script met à jour les permissions pour que :
- Les collaborateurs avec permission "write" puissent ajouter/retirer d'autres collaborateurs
- Tout collaborateur puisse se retirer d'un projet
- Les permissions soient correctement vérifiées

---

## Utilisation

### Partager un projet

1. **Ouvrir le menu des projets** (cliquer sur le nom du projet en haut)
2. **Cliquer sur l'icône 👥** à côté du projet à partager
3. **Entrer l'email du collaborateur**
4. **Choisir la permission** :
   - **Lecture seule** : peut seulement voir
   - **Peut modifier** : peut tout faire sauf supprimer le projet
5. **Cliquer sur "Partager"**

### Gérer les collaborateurs

Dans le modal de partage, vous verrez :
- **Propriétaire** (fond bleu) : créateur du projet
- **Collaborateurs** : liste avec leur permission

**Actions possibles** :
- **Retirer un collaborateur** : cliquer sur ✕ (si vous avez permission "write")
- **Se retirer** : cliquer sur "Me retirer" sur votre propre ligne

### Voir les projets partagés

Les projets partagés avec vous apparaissent automatiquement dans votre liste de projets.

---

## Cas d'Usage

### Exemple 1 : Voyage en famille
1. **Papa** crée le projet "Vacances Été 2025"
2. **Papa** partage avec **Maman** (permission "Peut modifier")
3. **Maman** peut ajouter des activités
4. **Maman** partage avec **Grand-mère** (permission "Lecture seule")
5. **Grand-mère** peut voir le planning mais ne peut pas le modifier
6. **Maman** peut ajouter **Tante Julie** sans demander à Papa

### Exemple 2 : Voyage entre amis
1. **Alice** crée le projet "Road Trip Espagne"
2. **Alice** partage avec **Bob** et **Charlie** (permission "Peut modifier")
3. **Bob** ajoute des restaurants
4. **Charlie** ajoute des hôtels
5. **Bob** partage avec sa copine **Diana** (permission "Lecture seule")
6. Si **Charlie** ne peut plus venir, il peut se retirer du projet

---

## Architecture Technique

### Sécurité (Row Level Security)

Toutes les permissions sont gérées au niveau de la base de données via RLS :

- **Lecture** : Vous voyez vos projets + projets partagés avec vous
- **Écriture** : Vous modifiez vos projets + projets où vous avez permission "write"
- **Suppression** : Seul le propriétaire peut supprimer un projet

### Partage par email

Vous pouvez partager avec n'importe quel email :
- Si l'utilisateur existe déjà : il voit le projet immédiatement
- Si l'utilisateur n'existe pas encore : il verra le projet dès qu'il s'inscrira avec cet email

---

## Dépannage

### Je ne vois pas le bouton de partage 👥
- Vérifiez que vous avez déployé la dernière version du code
- Le bouton apparaît à côté de chaque projet dans le menu déroulant

### Je ne peux pas ajouter de collaborateur
- Vérifiez que vous êtes propriétaire OU que vous avez permission "Peut modifier"
- Le formulaire d'ajout est caché si vous n'avez que permission "Lecture seule"

### Un collaborateur ne voit pas le projet partagé
- Vérifiez que l'email est correct (exactement le même que lors de l'inscription)
- Demandez-lui de se déconnecter/reconnecter
- Vérifiez dans Supabase Table Editor → `project_shares`

### Erreur lors du retrait d'un collaborateur
- Vérifiez que vous avez exécuté `supabase-sharing-update.sql`
- Vérifiez dans la console du navigateur (F12) pour voir l'erreur

---

## Base de Données - Référence

### Table `project_shares`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique du partage |
| `project_id` | UUID | ID du projet partagé |
| `shared_with_email` | TEXT | Email du collaborateur |
| `shared_with_user_id` | UUID | ID utilisateur (null si pas encore inscrit) |
| `shared_by_user_id` | UUID | ID de l'utilisateur qui a partagé |
| `permission` | TEXT | 'read' ou 'write' |
| `created_at` | TIMESTAMP | Date de création du partage |

### Vérifier les partages (SQL)

```sql
-- Voir tous les partages d'un projet
SELECT * FROM project_shares WHERE project_id = 'votre-project-id';

-- Voir tous les projets partagés avec un email
SELECT * FROM project_shares WHERE shared_with_email = 'email@exemple.com';

-- Voir tous vos partages
SELECT
  ps.*,
  p.name as project_name
FROM project_shares ps
JOIN projects p ON p.id = ps.project_id
WHERE ps.shared_by_user_id = auth.uid();
```

---

## Prochaines Améliorations Possibles

- 🔔 Notifications quand quelqu'un partage un projet avec vous
- 💬 Commentaires sur les activités
- 📱 Invitations par lien (sans email)
- 🎨 Couleurs personnalisées par collaborateur
- 📊 Historique des modifications
- 🔒 Permission "admin" (entre propriétaire et write)

---

**Bon voyage et bonne collaboration !** ✈️
