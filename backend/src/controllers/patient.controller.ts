import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllPatients = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        dossierMedical: true,
        rendezVous: {
          take: 5,
          orderBy: { dateHeure: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      status: 'success',
      data: patients,
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        dossierMedical: true,
        rendezVous: {
          orderBy: { dateHeure: 'desc' },
        },
        consultations: {
          orderBy: { dateConsultation: 'desc' },
          include: {
            prescriptions: true,
            facture: true,
          },
        },
      },
    });

    if (!patient) {
      throw new AppError('Patient non trouvé', 404);
    }

    res.json({
      status: 'success',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      throw new AppError('Authentification requise', 401);
    }

    // Vérifier que c'est un patient
    if (currentUser.role !== 'patient') {
      throw new AppError('Accès non autorisé', 403);
    }

    const patient = await prisma.patient.findUnique({
      where: { id: currentUser.id },
      include: {
        dossierMedical: true,
        rendezVous: {
          orderBy: { dateHeure: 'desc' },
        },
        consultations: {
          orderBy: { dateConsultation: 'desc' },
          include: {
            prescriptions: true,
            facture: true,
          },
        },
      },
    });

    if (!patient) {
      throw new AppError('Patient non trouvé', 404);
    }

    res.json({
      status: 'success',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

export const createPatient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      nom,
      prenom,
      dateNaissance,
      sexe,
      telephone,
      email,
      adresse,
      numeroSS,
      motDePasse,
      groupeSanguin,
      allergies,
      antecedents,
    } = req.body;

    if (!nom || !prenom || !dateNaissance || !sexe || !telephone || !numeroSS || !email) {
      throw new AppError('Champs obligatoires manquants (nom, prénom, date de naissance, sexe, téléphone, numéro SS et email sont requis)', 400);
    }

    // Si un mot de passe est fourni, le hasher
    let hashedPassword: string | undefined;
    if (motDePasse) {
      hashedPassword = await bcrypt.hash(motDePasse, 10);
    }

    // Vérifier si le téléphone existe déjà
    const existingPatient = await prisma.patient.findUnique({
      where: { telephone },
    });

    if (existingPatient) {
      throw new AppError('Un patient avec ce numéro de téléphone existe déjà', 409);
    }

    // Vérifier si l'email existe déjà
    const existingEmail = await prisma.patient.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new AppError('Un patient avec cet email existe déjà', 409);
    }

    // Vérifier si le numéro SS existe déjà
    const existingNumeroSS = await prisma.patient.findUnique({
      where: { numeroSS },
    });

    if (existingNumeroSS) {
      throw new AppError('Un patient avec ce numéro de sécurité sociale existe déjà', 409);
    }

    const patient = await prisma.patient.create({
      data: {
        nom,
        prenom,
        dateNaissance: new Date(dateNaissance),
        sexe,
        telephone,
        email,
        adresse,
        numeroSS,
        motDePasse: hashedPassword,
        groupeSanguin,
        allergies,
        antecedents,
      },
    });

    // Créer automatiquement le dossier médical avec un statut vide/initial
    // Le dossier médical est créé vide, les données seront ajoutées plus tard lors des consultations
    await prisma.dossierMedical.create({
      data: {
        patientId: patient.id,
        // Tous les champs sont null/vides au départ (statut initial)
        groupeSanguin: null,
        allergies: null,
        antecedents: null,
        antecedentsFamiliaux: null,
        traitementsEnCours: null,
        vaccinations: null,
        examenBiologiques: null,
        historiqueChirurgical: null,
        notesGenerales: null,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Patient créé avec succès. Un dossier médical vide a été créé automatiquement.',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.dateNaissance) {
      updateData.dateNaissance = new Date(updateData.dateNaissance);
    }

    // Si un mot de passe est fourni, le hasher
    if (updateData.motDePasse) {
      updateData.motDePasse = await bcrypt.hash(updateData.motDePasse, 10);
    } else {
      // Ne pas mettre à jour le mot de passe s'il est vide
      delete updateData.motDePasse;
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    res.json({
      status: 'success',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePatient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.patient.delete({
      where: { id },
    });

    res.json({
      status: 'success',
      message: 'Patient supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
};


