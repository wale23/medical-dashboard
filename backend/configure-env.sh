#!/bin/bash

echo "🔧 Configuration du fichier .env"
echo ""

read -sp "Entrez le mot de passe PostgreSQL pour l'utilisateur 'postgres': " DB_PASS
echo ""

# Mettre à jour le fichier .env
cat > .env << EOF
# Database
DATABASE_URL="postgresql://postgres:${DB_PASS}@localhost:5432/cabinet_medical?schema=public"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000"
EOF

echo ""
echo "✅ Fichier .env configuré avec succès!"
echo ""


