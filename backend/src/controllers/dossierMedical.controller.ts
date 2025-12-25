import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getDossierMedicalByPatient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;

    const dossier = await prisma.dossierMedical.findUnique({
      where: { patientId },
      include: {
        patient: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            dateNaissance: true,
            sexe: true,
          },
        },
      },
    });

    if (!dossier) {
      throw new AppError('Dossier médical non trouvé', 404);
    }

    res.json({
      status: 'success',
      data: dossier,
    });
  } catch (error) {
    next(error);
  }
};

export const createDossierMedical = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId, ...dossierData } = req.body;

    if (!patientId) {
      throw new AppError('ID patient requis', 400);
    }

    const dossier = await prisma.dossierMedical.create({
      data: {
        patientId,
        ...dossierData,
      },
    });

    res.status(201).json({
      status: 'success',
      data: dossier,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDossierMedical = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier que le dossier médical existe
    const existingDossier = await prisma.dossierMedical.findUnique({
      where: { id },
    });

    if (!existingDossier) {
      throw new AppError('Dossier médical non trouvé', 404);
    }

    const dossier = await prisma.dossierMedical.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    res.json({
      status: 'success',
      message: 'Dossier médical mis à jour avec succès',
      data: dossier,
    });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour le dossier médical par patientId (plus pratique)
export const updateDossierMedicalByPatient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const updateData = req.body;

    // Vérifier que le patient existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new AppError('Patient non trouvé', 404);
    }

    // Vérifier que le dossier médical existe
    const existingDossier = await prisma.dossierMedical.findUnique({
      where: { patientId },
    });

    if (!existingDossier) {
      throw new AppError('Dossier médical non trouvé pour ce patient', 404);
    }

    const dossier = await prisma.dossierMedical.update({
      where: { patientId },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    res.json({
      status: 'success',
      message: 'Dossier médical mis à jour avec succès',
      data: dossier,
    });
  } catch (error) {
    next(error);
  }
};


