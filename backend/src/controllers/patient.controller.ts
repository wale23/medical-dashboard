import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

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

    if (!nom || !prenom || !dateNaissance || !sexe || !telephone || !numeroSS) {
      throw new AppError('Champs obligatoires manquants', 400);
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

    // Créer le dossier médical associé
    await prisma.dossierMedical.create({
      data: {
        patientId: patient.id,
        groupeSanguin,
        allergies,
        antecedents,
      },
    });

    res.status(201).json({
      status: 'success',
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


