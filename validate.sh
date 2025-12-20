#!/bin/bash

# Script de validation pré-déploiement
# Vérifie que tous les fichiers nécessaires sont présents et configurés

echo "🔍 Planning Vacances - Validation Pré-Déploiement"
echo "=================================================="
echo ""

ERRORS=0
WARNINGS=0

# Couleurs
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Fonction de vérification
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 existe"
        return 0
    else
        echo -e "${RED}❌${NC} $1 manquant"
        ERRORS=$((ERRORS+1))
        return 1
    fi
}

# Fonction de warning
warn() {
    echo -e "${YELLOW}⚠️${NC}  $1"
    WARNINGS=$((WARNINGS+1))
}

# Fonction de succès
success() {
    echo -e "${GREEN}✅${NC} $1"
}

echo "📂 Vérification de la structure des fichiers..."
echo ""

# Frontend
echo "🎨 Frontend:"
check_file "frontend/index.html"
check_file "frontend/styles.css"
check_file "frontend/app.js"
check_file "frontend/supabase.js"
check_file "frontend/Dockerfile"
check_file "frontend/nginx.conf"

if [ -f "frontend/config.js" ]; then
    success "frontend/config.js existe"

    # Vérifier que config.js contient de vraies valeurs
    if grep -q "xxxxxxxxxxxxx" frontend/config.js; then
        warn "frontend/config.js contient des valeurs d'exemple (xxxxxxxxxxxxx)"
    else
        success "frontend/config.js semble configuré"
    fi
else
    echo -e "${RED}❌${NC} frontend/config.js manquant (copier depuis config.js.example)"
    ERRORS=$((ERRORS+1))
fi

echo ""

# Database
echo "🗄️  Database:"
check_file "database/schema.sql"
echo ""

# Backend (optionnel)
echo "🔧 Backend (optionnel):"
check_file "backend/server.js"
check_file "backend/package.json"
check_file "backend/Dockerfile"

if [ -f "backend/.env" ]; then
    warn "backend/.env existe (vérifier qu'il n'est pas commité sur Git)"
else
    echo -e "   backend/.env n'existe pas (normal si backend non utilisé)"
fi

echo ""

# Infrastructure
echo "🐳 Infrastructure:"
check_file "docker-compose.yml"
check_file ".gitignore"

if [ -f ".env" ]; then
    warn ".env existe (vérifier qu'il n'est pas commité sur Git)"
fi

echo ""

# Documentation
echo "📚 Documentation:"
check_file "README.md"
check_file "DEPLOYMENT.md"
check_file "QUICKSTART.md"
check_file "CHECKLIST.md"
echo ""

# Vérifier .gitignore
echo "🔒 Vérification de la sécurité..."
if [ -f ".gitignore" ]; then
    if grep -q "frontend/config.js" .gitignore; then
        success "frontend/config.js est dans .gitignore"
    else
        warn "frontend/config.js devrait être dans .gitignore"
    fi

    if grep -q ".env" .gitignore; then
        success ".env est dans .gitignore"
    else
        warn ".env devrait être dans .gitignore"
    fi
fi

echo ""

# Vérifier Git
echo "📦 Vérification Git..."
if [ -d ".git" ]; then
    success "Repository Git initialisé"

    # Vérifier remote
    if git remote -v | grep -q "origin"; then
        REMOTE=$(git remote get-url origin)
        success "Remote origin configuré: $REMOTE"
    else
        warn "Aucun remote Git configuré"
    fi

    # Vérifier branch
    BRANCH=$(git branch --show-current)
    if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
        success "Branch actuelle: $BRANCH"
    else
        warn "Branch actuelle: $BRANCH (devrait être main ou master)"
    fi
else
    warn "Repository Git non initialisé (exécuter 'git init')"
fi

echo ""

# Vérifier frontend/config.js en détail
echo "🔧 Vérification frontend/config.js..."
if [ -f "frontend/config.js" ]; then
    # Vérifier SUPABASE_URL
    if grep -q "url: 'https://" frontend/config.js; then
        success "SUPABASE_URL configuré"
    else
        warn "SUPABASE_URL semble incorrect"
    fi

    # Vérifier anon key
    if grep -q "anonKey: 'eyJ" frontend/config.js; then
        success "anon key configuré"
    else
        warn "anon key semble incorrect"
    fi
fi

echo ""

# Résumé
echo "=================================================="
echo "📊 Résumé de la validation"
echo "=================================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Aucune erreur critique${NC}"
else
    echo -e "${RED}❌ $ERRORS erreur(s) critique(s)${NC}"
fi

if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Aucun avertissement${NC}"
else
    echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s)${NC}"
fi

echo ""

# Prochaines étapes
if [ $ERRORS -eq 0 ]; then
    echo "🎉 Tout semble prêt pour le déploiement !"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Vérifier que Supabase est configuré (voir DEPLOYMENT.md)"
    echo "2. Vérifier que OAuth est configuré (voir DEPLOYMENT.md)"
    echo "3. Pousser sur Git: git push origin main"
    echo "4. Déployer sur Dokploy (voir QUICKSTART.md)"
else
    echo "⚠️  Veuillez corriger les erreurs avant de déployer"
    echo ""
    echo "Voir la documentation:"
    echo "- QUICKSTART.md pour un guide rapide"
    echo "- DEPLOYMENT.md pour un guide complet"
fi

echo ""

# Exit code
if [ $ERRORS -eq 0 ]; then
    exit 0
else
    exit 1
fi
