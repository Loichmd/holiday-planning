# Guide de Sécurité - Supabase sur GitHub Pages

## Introduction

Ce document explique comment sécuriser votre application Holiday Planning avec Supabase sur un repository GitHub public.

## Les 2 Types de Clés Supabase

### 1. Anon Key (Publique) ✅ SAFE

- **Peut être exposée** dans le code frontend
- Protégée par Row Level Security (RLS)
- Utilisée pour les requêtes côté client
- C'est cette clé que vous mettrez dans `config.js`

### 2. Service Role Key (Secrète) ❌ DANGER

- **NE DOIT JAMAIS** être dans le code public
- Contourne toutes les sécurités RLS
- Uniquement pour backend sécurisé
- Ne la mettez jamais dans votre repository Git

## Configuration Sécurisée

### Étape 1 : Récupérer vos clés Supabase

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **Settings** > **API**
4. Vous verrez :
   - **URL** : `https://xxxxx.supabase.co`
   - **anon public** : Cette clé est sûre ✅
   - **service_role** : Ne JAMAIS l'exposer ❌

### Étape 2 : Configurer config.js

Éditez le fichier `config.js` et remplacez :

```javascript
const SUPABASE_CONFIG = {
    url: 'https://votre-projet-id.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // Votre vraie anon key
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
};
```

### Étape 3 : Activer Row Level Security (RLS)

**C'EST LA CLÉ DE LA SÉCURITÉ !** Sans RLS, même avec la clé publique, vos données sont accessibles à tous.

#### 3.1 Activer RLS sur toutes les tables

Dans Supabase SQL Editor :

```sql
-- Activer RLS sur la table projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur la table activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
```

#### 3.2 Créer des Policies (Règles d'accès)

**Exemple : Chaque utilisateur ne voit que ses propres projets**

```sql
-- Policy : L'utilisateur peut lire ses propres projets
CREATE POLICY "Users can view their own projects"
ON projects
FOR SELECT
USING (auth.uid() = user_id);

-- Policy : L'utilisateur peut créer ses propres projets
CREATE POLICY "Users can create their own projects"
ON projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy : L'utilisateur peut modifier ses propres projets
CREATE POLICY "Users can update their own projects"
ON projects
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy : L'utilisateur peut supprimer ses propres projets
CREATE POLICY "Users can delete their own projects"
ON projects
FOR DELETE
USING (auth.uid() = user_id);
```

**Répétez pour la table activities :**

```sql
-- RLS pour activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
ON activities
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = activities.project_id
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create activities in their projects"
ON activities
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = activities.project_id
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own activities"
ON activities
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = activities.project_id
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own activities"
ON activities
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = activities.project_id
        AND projects.user_id = auth.uid()
    )
);
```

## Schéma de Base de Données Recommandé

```sql
-- Table des utilisateurs (gérée automatiquement par Supabase Auth)
-- auth.users existe déjà

-- Table des projets/voyages
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    travelers TEXT[], -- Array de noms de voyageurs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des activités
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME,
    duration NUMERIC,
    category TEXT CHECK (category IN ('activite', 'avion', 'hotel', 'restaurant')),
    travelers TEXT[],
    location TEXT,
    url TEXT,
    notes TEXT,
    attachments JSONB, -- Store file metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_activities_project_id ON activities(project_id);
CREATE INDEX idx_activities_date ON activities(date);
```

## Authentification

### OAuth avec Supabase

Supabase supporte nativement :
- Google OAuth
- Microsoft OAuth
- Apple OAuth
- GitHub OAuth
- Et bien d'autres...

#### Configuration dans Supabase :

1. Allez dans **Authentication** > **Providers**
2. Activez les providers souhaités (Google, Microsoft, Apple)
3. Configurez les clés OAuth de chaque provider
4. Ajoutez votre URL de redirection : `https://loichmd.github.io/holiday-planning/`

## Checklist de Sécurité

✅ **À FAIRE :**
- Utiliser uniquement la clé `anon` dans le code frontend
- Activer RLS sur TOUTES les tables
- Créer des policies strictes pour chaque table
- Utiliser `auth.uid()` dans les policies pour isoler les données par utilisateur
- Tester les policies en mode incognito

❌ **NE JAMAIS FAIRE :**
- Exposer la `service_role` key
- Désactiver RLS sur les tables contenant des données utilisateur
- Créer des policies trop permissives (ex: `USING (true)`)
- Stocker des secrets dans le code Git

## Test de Sécurité

Pour tester que vos RLS fonctionnent :

1. Créez 2 comptes différents
2. Connectez-vous avec le compte A et créez des projets
3. Déconnectez-vous et connectez-vous avec le compte B
4. Essayez d'accéder aux projets du compte A
5. ✅ Si vous ne voyez rien → RLS fonctionne correctement
6. ❌ Si vous voyez les projets de A → RLS mal configuré

## Stockage de Fichiers (Attachments)

Pour les pièces jointes (billets, réservations) :

1. Utilisez **Supabase Storage**
2. Créez un bucket privé
3. Configurez les policies Storage :

```sql
-- Policy Storage : chaque utilisateur accède à son propre dossier
CREATE POLICY "Users can upload files in their folder"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
```

## Ressources Supplémentaires

- [Documentation RLS Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Guide de Sécurité Supabase](https://supabase.com/docs/guides/auth/managing-user-data)
- [Exemples de Policies](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Support

Si vous avez des questions de sécurité, consultez :
- Forum Supabase : https://github.com/supabase/supabase/discussions
- Discord Supabase : https://discord.supabase.com
