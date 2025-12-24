#!/bin/bash

echo "🔧 Configuration de la base de données..."
echo ""

# Demander les informations de connexion PostgreSQL
read -p "Nom d'utilisateur PostgreSQL (défaut: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Mot de passe PostgreSQL: " DB_PASS
echo ""

read -p "Port PostgreSQL (défaut: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

DB_NAME="cabinet_medical"

# Construire la DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}?schema=public"

echo ""
echo "📝 Création de la base de données..."

# Tenter de créer la base de données
PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -p $DB_PORT -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Base de données créée avec succès"
elif [ $? -eq 2 ]; then
    echo "⚠️  La base de données existe déjà, continuons..."
else
    echo "❌ Erreur lors de la création de la base de données"
    echo "💡 Essayez manuellement: CREATE DATABASE ${DB_NAME};"
    exit 1
fi

echo ""
echo "📝 Mise à jour du fichier .env..."

# Mettre à jour le fichier .env
sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" .env

echo "✅ Fichier .env mis à jour"
echo ""
echo "🔄 Génération du client Prisma..."
npm run prisma:generate

echo ""
echo "🔄 Exécution des migrations..."
npm run prisma:migrate

echo ""
echo "🌱 Création des utilisateurs par défaut..."
npm run prisma:seed

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "🚀 Vous pouvez maintenant lancer le serveur avec: npm run dev"


