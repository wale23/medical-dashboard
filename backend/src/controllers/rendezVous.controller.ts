import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// Fonction pour vérifier les disponibilités
const checkDisponibilite = async (userId: string, dateHeure: Date, duree: number): Promise<boolean> => {
  const jourSemaine = dateHeure.getDay(); // 0=Dimanche, 1=Lundi, ..., 6=Samedi
  const heure = dateHeure.getHours();
  const minutes = dateHeure.getMinutes();
  const heureStr = `${heure.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Calculer l'heure de fin du rendez-vous
  const dateFin = new Date(dateHeure);
  dateFin.setMinutes(dateFin.getMinutes() + duree);
  const heureFinStr = `${dateFin.getHours().toString().padStart(2, '0')}:${dateFin.getMinutes().toString().padStart(2, '0')}`;

  // Vérifier les disponibilités régulières (par jour de semaine)
  const disponibilites = await prisma.disponibilite.findMany({
    where: {
      userId,
      jourSemaine,
      estDisponible: true,
      estException: false,
    },
  });

  // Vérifier si l'heure du rendez-vous est dans une plage de disponibilité
  const isAvailable = disponibilites.some((disp) => {
    const [debutH, debutM] = disp.heureDebut.split(':').map(Number);
    const [finH, finM] = disp.heureFin.split(':').map(Number);
    const debutMinutes = debutH * 60 + debutM;
    const finMinutes = finH * 60 + finM;
    const rdvDebutMinutes = heure * 60 + minutes;
    const rdvFinMinutes = dateFin.getHours() * 60 + dateFin.getMinutes();

    // Le rendez-vous doit être complètement dans la plage de disponibilité
    return rdvDebutMinutes >= debutMinutes && rdvFinMinutes <= finMinutes;
  });

  // Vérifier aussi les exceptions (dates spécifiques)
  if (!isAvailable) {
    const exceptions = await prisma.disponibilite.findMany({
      where: {
        userId,
        dateSpecifique: {
          gte: new Date(dateHeure.getFullYear(), dateHeure.getMonth(), dateHeure.getDate()),
          lt: new Date(dateHeure.getFullYear(), dateHeure.getMonth(), dateHeure.getDate() + 1),
        },
        estException: true,
        estDisponible: true,
      },
    });

    if (exceptions.length > 0) {
      return exceptions.some((disp) => {
        const [debutH, debutM] = disp.heureDebut.split(':').map(Number);
        const [finH, finM] = disp.heureFin.split(':').map(Number);
        const debutMinutes = debutH * 60 + debutM;
        const finMinutes = finH * 60 + finM;
        const rdvDebutMinutes = heure * 60 + minutes;
        const rdvFinMinutes = dateFin.getHours() * 60 + dateFin.getMinutes();

        return rdvDebutMinutes >= debutMinutes && rdvFinMinutes <= finMinutes;
      });
    }
  }

  return isAvailable;
};

// Fonction pour vérifier les conflits de rendez-vous
const checkConflitRendezVous = async (
  userId: string,
  dateHeure: Date,
  duree: number,
  rendezVousId?: string
): Promise<boolean> => {
  const dateFin = new Date(dateHeure);
  dateFin.setMinutes(dateFin.getMinutes() + duree);

  const whereClause: any = {
    userId,
    statut: {
      notIn: ['annule', 'termine'],
    },
    OR: [
      {
        // Le nouveau rendez-vous commence pendant un rendez-vous existant
        dateHeure: {
          lte: dateHeure,
        },
        AND: {
          dateHeure: {
            gte: new Date(dateHeure.getTime() - 1),
          },
        },
      },
      {
        // Le nouveau rendez-vous se termine pendant un rendez-vous existant
        dateHeure: {
          lte: dateFin,
        },
        AND: {
          dateHeure: {
            gte: dateHeure,
          },
        },
      },
    ],
  };

  if (rendezVousId) {
    whereClause.id = { not: rendezVousId };
  }

  const conflits = await prisma.rendezVous.findMany({
    where: whereClause,
  });

  // Vérifier si un rendez-vous existant chevauche avec le nouveau
  return conflits.some((rdv) => {
    const rdvFin = new Date(rdv.dateHeure);
    rdvFin.setMinutes(rdvFin.getMinutes() + rdv.duree);
    return (
      (dateHeure >= rdv.dateHeure && dateHeure < rdvFin) ||
      (dateFin > rdv.dateHeure && dateFin <= rdvFin) ||
      (dateHeure <= rdv.dateHeure && dateFin >= rdvFin)
    );
  });
};

export const getAllRendezVous = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rendezVous = await prisma.rendezVous.findMany({
      include: {
        patient: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
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
      },
      orderBy: { dateHeure: 'asc' },
    });

    res.json({
      status: 'success',
      data: rendezVous,
    });
  } catch (error) {
    next(error);
  }
};

export const getRendezVousById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const rendezVous = await prisma.rendezVous.findUnique({
      where: { id },
      include: {
        patient: true,
        user: true,
        consultation: true,
      },
    });

    if (!rendezVous) {
      throw new AppError('Rendez-vous non trouvé', 404);
    }

    res.json({
      status: 'success',
      data: rendezVous,
    });
  } catch (error) {
    next(error);
  }
};

export const getRendezVousByMedecin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const rendezVous = await prisma.rendezVous.findMany({
      where: { userId },
      include: {
        patient: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
          },
        },
      },
      orderBy: { dateHeure: 'asc' },
    });

    res.json({
      status: 'success',
      data: rendezVous,
    });
  } catch (error) {
    next(error);
  }
};

export const getRendezVousByPatient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;

    const rendezVous = await prisma.rendezVous.findMany({
      where: { patientId },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            specialite: true,
          },
        },
      },
      orderBy: { dateHeure: 'desc' },
    });

    res.json({
      status: 'success',
      data: rendezVous,
    });
  } catch (error) {
    next(error);
  }
};

export const createRendezVous = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId, userId, dateHeure, duree, motif, notes } = req.body;
    const currentUser = req.user;

    if (!currentUser) {
      throw new AppError('Authentification requise', 401);
    }

    if (!patientId || !userId || !dateHeure) {
      throw new AppError('Patient, utilisateur et date/heure requis', 400);
    }

    // Si c'est un patient qui crée le rendez-vous, vérifier que le patientId correspond à son ID
    if (currentUser.role === 'patient') {
      if (patientId !== currentUser.id) {
        throw new AppError('Un patient ne peut créer un rendez-vous que pour lui-même', 403);
      }
    }

    // Vérifier que le patient existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new AppError('Patient non trouvé', 404);
    }

    // Vérifier que l'utilisateur (médecin) existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Utilisateur (médecin) non trouvé', 404);
    }

    const dateHeureObj = new Date(dateHeure);
    const dureeRdv = duree || 30;

    // Vérifier les disponibilités du médecin
    const isAvailable = await checkDisponibilite(userId, dateHeureObj, dureeRdv);
    if (!isAvailable) {
      throw new AppError('Le médecin n\'est pas disponible à cette heure', 409);
    }

    // Vérifier les conflits avec d'autres rendez-vous
    const hasConflict = await checkConflitRendezVous(userId, dateHeureObj, dureeRdv);
    if (hasConflict) {
      throw new AppError('Un rendez-vous existe déjà à cette heure pour ce médecin', 409);
    }

    // Déterminer le statut selon le rôle
    // Admin/Médecin → "planifie", Patient → "confirme"
    const statut = currentUser.role === 'patient' ? 'confirme' : 'planifie';

    const rendezVous = await prisma.rendezVous.create({
      data: {
        patientId,
        userId,
        dateHeure: dateHeureObj,
        duree: dureeRdv,
        motif,
        notes,
        statut,
      },
      include: {
        patient: true,
        user: true,
      },
    });

    res.status(201).json({
      status: 'success',
      data: rendezVous,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRendezVous = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    const currentUser = req.user;

    if (!currentUser) {
      throw new AppError('Authentification requise', 401);
    }

    // Récupérer le rendez-vous existant
    const existingRendezVous = await prisma.rendezVous.findUnique({
      where: { id },
    });

    if (!existingRendezVous) {
      throw new AppError('Rendez-vous non trouvé', 404);
    }

    const userId = updateData.userId || existingRendezVous.userId;
    const dateHeure = updateData.dateHeure ? new Date(updateData.dateHeure) : existingRendezVous.dateHeure;
    const duree = updateData.duree || existingRendezVous.duree;

    // Vérifier les disponibilités si la date/heure ou le médecin change
    if (updateData.dateHeure || updateData.userId || updateData.duree) {
      const isAvailable = await checkDisponibilite(userId, dateHeure, duree);
      if (!isAvailable) {
        throw new AppError('Le médecin n\'est pas disponible à cette heure', 409);
      }

      // Vérifier les conflits (en excluant le rendez-vous actuel)
      const hasConflict = await checkConflitRendezVous(userId, dateHeure, duree, id);
      if (hasConflict) {
        throw new AppError('Un rendez-vous existe déjà à cette heure pour ce médecin', 409);
      }
    }

    // Convertir dateHeure en Date si présent
    if (updateData.dateHeure) {
      updateData.dateHeure = new Date(updateData.dateHeure);
    }

    const rendezVous = await prisma.rendezVous.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        user: true,
      },
    });

    res.json({
      status: 'success',
      data: rendezVous,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmRendezVous = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser) {
      throw new AppError('Authentification requise', 401);
    }

    const rendezVous = await prisma.rendezVous.findUnique({
      where: { id },
    });

    if (!rendezVous) {
      throw new AppError('Rendez-vous non trouvé', 404);
    }

    // Seuls les admins et médecins peuvent confirmer un rendez-vous
    if (currentUser.role !== 'admin' && currentUser.role !== 'medecin') {
      throw new AppError('Seuls les administrateurs et médecins peuvent confirmer un rendez-vous', 403);
    }

    // Le rendez-vous doit être en statut "confirme" pour être confirmé (passer à "planifie")
    if (rendezVous.statut !== 'confirme') {
      throw new AppError(
        `Impossible de confirmer un rendez-vous avec le statut "${rendezVous.statut}"`,
        400
      );
    }

    const updatedRendezVous = await prisma.rendezVous.update({
      where: { id },
      data: { statut: 'planifie' },
      include: {
        patient: true,
        user: true,
      },
    });

    res.json({
      status: 'success',
      data: updatedRendezVous,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRendezVous = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.rendezVous.delete({
      where: { id },
    });

    res.json({
      status: 'success',
      message: 'Rendez-vous supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
};


