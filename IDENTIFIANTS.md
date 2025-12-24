# Identifiants de Connexion

## Comptes par défaut

Après avoir exécuté le script de seed (`npm run prisma:seed` dans le dossier backend), vous aurez accès à deux comptes :

### Compte Administrateur
- **Email:** `admin@cabinet.com`
- **Mot de passe:** `admin123`
- **Rôle:** Admin
- **Spécialité:** Administration

### Compte Médecin
- **Email:** `medecin@cabinet.com`
- **Mot de passe:** `medecin123`
- **Rôle:** Médecin
- **Spécialité:** Médecine générale

## Comment créer les comptes

1. Assurez-vous que votre base de données est configurée et que les migrations Prisma sont appliquées
2. Exécutez le script de seed :
   ```bash
   cd backend
   npm run prisma:seed
   ```

## Créer un nouveau compte

Vous pouvez créer un nouveau compte médecin via l'API :

```bash
POST /api/auth/register
Content-Type: application/json

{
  "nom": "Nom",
  "prenom": "Prénom",
  "specialite": "Spécialité",
  "numeroOrdre": "NUM001",
  "telephone": "+33123456789",
  "email": "nouveau@cabinet.com",
  "motDePasse": "motdepasse123",
  "userRole": "medecin"
}
```

## Sécurité

⚠️ **Important:** Changez les mots de passe par défaut en production !

Les mots de passe sont hashés avec bcrypt avant d'être stockés dans la base de données.


