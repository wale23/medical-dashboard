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

    const dossier = await prisma.dossierMedical.update({
      where: { id },
      data: updateData,
    });

    res.json({
      status: 'success',
      data: dossier,
    });
  } catch (error) {
    next(error);
  }
};


