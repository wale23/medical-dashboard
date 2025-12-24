import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  // Créer un utilisateur admin par défaut
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cabinet.com' },
    update: {},
    create: {
      nom: 'Admin',
      prenom: 'Docteur',
      specialite: 'Administration',
      numeroOrdre: 'ADM001',
      telephone: '+33123456789',
      email: 'admin@cabinet.com',
      motDePasse: hashedPassword,
      userRole: 'admin',
    },
  });

  console.log('✅ Utilisateur admin créé:', {
    email: admin.email,
    nom: `${admin.prenom} ${admin.nom}`,
  });

  // Créer un utilisateur médecin exemple
  const medecinPassword = await bcrypt.hash('medecin123', 10);

  const medecin = await prisma.user.upsert({
    where: { email: 'medecin@cabinet.com' },
    update: {},
    create: {
      nom: 'Dupont',
      prenom: 'Jean',
      specialite: 'Médecine générale',
      numeroOrdre: 'MG001',
      telephone: '+33987654321',
      email: 'medecin@cabinet.com',
      motDePasse: medecinPassword,
      userRole: 'medecin',
    },
  });

  console.log('✅ Utilisateur médecin créé:', {
    email: medecin.email,
    nom: `${medecin.prenom} ${medecin.nom}`,
  });

  console.log('\n📋 Identifiants de connexion:');
  console.log('Admin:');
  console.log('  Email: admin@cabinet.com');
  console.log('  Mot de passe: admin123');
  console.log('\nMédecin:');
  console.log('  Email: medecin@cabinet.com');
  console.log('  Mot de passe: medecin123');
  console.log('\n✨ Seed terminé avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


