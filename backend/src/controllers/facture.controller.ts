import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getAllFactures = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const factures = await prisma.facture.findMany({
      include: {
        patient: {
          select: {
            id: true,
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
      orderBy: { dateFacture: 'desc' },
    });

    res.json({
      status: 'success',
      data: factures,
    });
  } catch (error) {
    next(error);
  }
};

export const getFactureById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const facture = await prisma.facture.findUnique({
      where: { id },
      include: {
        patient: true,
        consultation: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!facture) {
      throw new AppError('Facture non trouvée', 404);
    }

    res.json({
      status: 'success',
      data: facture,
    });
  } catch (error) {
    next(error);
  }
};

export const getFacturesByPatient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;

    const factures = await prisma.facture.findMany({
      where: { patientId },
      orderBy: { dateFacture: 'desc' },
    });

    res.json({
      status: 'success',
      data: factures,
    });
  } catch (error) {
    next(error);
  }
};

const generateNumeroFacture = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.facture.count({
    where: {
      numeroFacture: {
        startsWith: `FAC-${year}-`,
      },
    },
  });

  return `FAC-${year}-${String(count + 1).padStart(4, '0')}`;
};

export const createFacture = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      consultationId,
      patientId,
      montantConsultation,
      tva,
      notes,
    } = req.body;

    if (!consultationId || !patientId || !montantConsultation) {
      throw new AppError('Champs obligatoires manquants', 400);
    }

    // Vérifier que la consultation existe et n'a pas déjà de facture
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new AppError('Consultation non trouvée', 404);
    }

    const existingFacture = await prisma.facture.findUnique({
      where: { consultationId },
    });

    if (existingFacture) {
      throw new AppError('Une facture existe déjà pour cette consultation', 409);
    }

    const numeroFacture = await generateNumeroFacture();
    const montantTVA = tva ? (Number(montantConsultation) * Number(tva)) / 100 : 0;
    const montantTotal = Number(montantConsultation) + montantTVA;

    const facture = await prisma.facture.create({
      data: {
        consultationId,
        patientId,
        numeroFacture,
        montantConsultation: Number(montantConsultation),
        montantTotal,
        tva: tva ? Number(tva) : null,
        statutPaiement: 'en_attente',
        notes,
      },
      include: {
        patient: true,
        consultation: true,
      },
    });

    res.status(201).json({
      status: 'success',
      data: facture,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFacture = async (
  req: Request,
  res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.datePaiement) {
      updateData.datePaiement = new Date(updateData.datePaiement);
    }

    const facture = await prisma.facture.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        consultation: true,
      },
    });

    res.json({
      status: 'success',
      data: facture,
    });
  } catch (error) {
    next(error);
  }
};


