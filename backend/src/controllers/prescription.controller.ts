import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getAllPrescriptions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      include: {
        patient: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        user: {
          select: {
            nom: true,
            prenom: true,
          },
        },
        consultation: {
          select: {
            id: true,
            dateConsultation: true,
          },
        },
      },
      orderBy: { datePrescription: 'desc' },
    });

    res.json({
      status: 'success',
      data: prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        user: true,
        consultation: true,
      },
    });

    if (!prescription) {
      throw new AppError('Prescription non trouvée', 404);
    }

    res.json({
      status: 'success',
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionsByPatient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId },
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
            specialite: true,
          },
        },
        consultation: {
          select: {
            dateConsultation: true,
            diagnostic: true,
          },
        },
      },
      orderBy: { datePrescription: 'desc' },
    });

    res.json({
      status: 'success',
      data: prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

export const createPrescription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      consultationId,
      userId,
      patientId,
      medicaments,
      instructions,
      dateDebut,
      dateFin,
    } = req.body;

    if (!consultationId || !userId || !patientId || !medicaments) {
      throw new AppError('Champs obligatoires manquants', 400);
    }

    const prescription = await prisma.prescription.create({
      data: {
        consultationId,
        userId,
        patientId,
        medicaments,
        instructions,
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: dateFin ? new Date(dateFin) : null,
        statut: 'active',
      },
      include: {
        patient: true,
        user: true,
        consultation: true,
      },
    });

    res.status(201).json({
      status: 'success',
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePrescription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.dateDebut) {
      updateData.dateDebut = new Date(updateData.dateDebut);
    }
    if (updateData.dateFin) {
      updateData.dateFin = new Date(updateData.dateFin);
    }

    const prescription = await prisma.prescription.update({
      where: { id },
      data: updateData,
    });

    res.json({
      status: 'success',
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};


