import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllConsultations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      throw new AppError('Authentification requise', 401);
    }

    // Construire la clause where selon le rôle
    const whereClause: any = {};

    // Si c'est un médecin, filtrer par son userId
    if (currentUser.role === 'medecin') {
      whereClause.userId = currentUser.id;
    }
    // Si c'est un patient, filtrer par son patientId
    else if (currentUser.role === 'patient') {
      whereClause.patientId = currentUser.id;
    }
    // Si c'est un admin, pas de filtre (voir toutes les consultations)

    const consultations = await (prisma as any).consultation.findMany({
      where: whereClause,
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
            id: true,
            nom: true,
            prenom: true,
            specialite: true,
          },
        },
        prescriptions: true,
        facture: {
          select: {
            id: true,
            numeroFacture: true,
            statutPaiement: true,
            montantTotal: true,
          },
        },
      },
      orderBy: { dateConsultation: 'desc' },
    });

    res.json({
      status: 'success',
      data: consultations,
    });
  } catch (error) {
    next(error);
  }
};

export const getConsultationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const consultation = await (prisma as any).consultation.findUnique({
      where: { id },
      include: {
        patient: true,
        user: true,
        rendezVous: true,
        prescriptions: true,
        facture: true,
      },
    });

    if (!consultation) {
      throw new AppError('Consultation non trouvée', 404);
    }

    res.json({
      status: 'success',
      data: consultation,
    });
  } catch (error) {
    next(error);
  }
};

export const getConsultationsByPatient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;

    const consultations = await (prisma as any).consultation.findMany({
      where: { patientId },
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
            specialite: true,
          },
        },
        prescriptions: true,
      },
      orderBy: { dateConsultation: 'desc' },
    });

    res.json({
      status: 'success',
      data: consultations,
    });
  } catch (error) {
    next(error);
  }
};

export const getConsultationsByMedecin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const consultations = await (prisma as any).consultation.findMany({
      where: { userId },
      include: {
        patient: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        prescriptions: {
          select: {
            id: true,
            datePrescription: true,
            statut: true,
          },
        },
        facture: {
          select: {
            id: true,
            numeroFacture: true,
            statutPaiement: true,
            montantTotal: true,
          },
        },
      },
      orderBy: { dateConsultation: 'desc' },
    });

    res.json({
      status: 'success',
      data: consultations,
    });
  } catch (error) {
    next(error);
  }
};

export const createConsultation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      rendezVousId,
      patientId,
      userId,
      dateConsultation,
      motifConsultation,
      examenClinique,
      diagnostic,
      observations,
      recommandations,
      prochainRendezVous,
    } = req.body;

    if (!rendezVousId || !patientId || !userId || !dateConsultation) {
      throw new AppError('Champs obligatoires manquants', 400);
    }

    // Vérifier que le rendez-vous existe et n'a pas déjà de consultation
    const rendezVous = await prisma.rendezVous.findUnique({
      where: { id: rendezVousId },
      include: {
        consultation: true,
      },
    });

    if (!rendezVous) {
      throw new AppError('Rendez-vous non trouvé', 404);
    }

    // Vérifier qu'une consultation n'existe pas déjà
    if (rendezVous.consultation) {
      throw new AppError('Une consultation existe déjà pour ce rendez-vous', 409);
    }

    // Vérifier le statut du rendez-vous
    // Pour créer une consultation, le statut doit être "planifie" (admin/médecin) ou "confirme" (patient)
    if (rendezVous.statut !== 'planifie' && rendezVous.statut !== 'confirme') {
      throw new AppError(
        `Impossible de créer une consultation pour un rendez-vous avec le statut "${rendezVous.statut}"`,
        400
      );
    }

    const consultation = await (prisma as any).consultation.create({
      data: {
        rendezVousId,
        patientId,
        userId,
        dateConsultation: new Date(dateConsultation),
        motifConsultation,
        examenClinique,
        diagnostic,
        observations,
        recommandations,
        prochainRendezVous: prochainRendezVous ? new Date(prochainRendezVous) : null,
      },
      include: {
        patient: true,
        user: true,
        rendezVous: true,
      },
    });

    // Mettre à jour le statut du rendez-vous
    await prisma.rendezVous.update({
      where: { id: rendezVousId },
      data: { statut: 'termine' },
    });

    res.status(201).json({
      status: 'success',
      data: consultation,
    });
  } catch (error) {
    next(error);
  }
};

export const updateConsultation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.dateConsultation) {
      updateData.dateConsultation = new Date(updateData.dateConsultation);
    }
    if (updateData.prochainRendezVous) {
      updateData.prochainRendezVous = new Date(updateData.prochainRendezVous);
    }

    const consultation = await (prisma as any).consultation.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        user: true,
      },
    });

    res.json({
      status: 'success',
      data: consultation,
    });
  } catch (error) {
    next(error);
  }
};


