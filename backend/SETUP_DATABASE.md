# Configuration de la Base de Données

## Étapes pour configurer PostgreSQL

### 1. Créer la base de données

Connectez-vous à PostgreSQL :

```bash
sudo -u postgres psql
```

Ou si vous avez un utilisateur PostgreSQL configuré :

```bash
psql -U votre_utilisateur
```

Puis créez la base de données :

```sql
CREATE DATABASE cabinet_medical;
\q
```

### 2. Configurer le fichier .env

Éditez le fichier `/home/wala/final-project/backend/.env` et modifiez la ligne `DATABASE_URL` :

```env
DATABASE_URL="postgresql://votre_utilisateur:votre_mot_de_passe@localhost:5432/cabinet_medical?schema=public"
```

**Exemples :**

Si vous utilisez l'utilisateur `postgres` :
```env
DATABASE_URL="postgresql://postgres:mot_de_passe_postgres@localhost:5432/cabinet_medical?schema=public"
```

Si vous utilisez votre utilisateur système :
```env
DATABASE_URL="postgresql://wala:mot_de_passe@localhost:5432/cabinet_medical?schema=public"
```

### 3. Initialiser Prisma

Une fois la base de données créée et le .env configuré :

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 4. Créer les utilisateurs par défaut

```bash
npm run prisma:seed
```

Cela créera :
- Admin: `admin@cabinet.com` / `admin123`
- Médecin: `medecin@cabinet.com` / `medecin123`

### 5. Vérifier que tout fonctionne

```bash
npm run dev
```

Le serveur devrait démarrer sans erreur sur le port 5000.

## Dépannage

### Erreur "password authentication failed"
- Vérifiez que le mot de passe dans DATABASE_URL est correct
- Vous pouvez réinitialiser le mot de passe PostgreSQL si nécessaire

### Erreur "database does not exist"
- Assurez-vous d'avoir créé la base de données avec la commande SQL ci-dessus

### Erreur "relation does not exist"
- Exécutez `npm run prisma:migrate` pour créer les tables


