import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// Fonction pour vérifier les disponibilités
const checkDisponibilite = async (userId: string, dateHeure: Date, duree: number): Promise<{ available: boolean; hasDisponibilites: boolean }> => {
  const jourSemaine = dateHeure.getDay(); // 0=Dimanche, 1=Lundi, ..., 6=Samedi
  const heure = dateHeure.getHours();
  const minutes = dateHeure.getMinutes();
  
  // Calculer l'heure de fin du rendez-vous
  const dateFin = new Date(dateHeure);
  dateFin.setMinutes(dateFin.getMinutes() + duree);

  // Vérifier d'abord si le médecin a des disponibilités définies
  const allDisponibilites = await (prisma as any).disponibilite.findMany({
    where: {
      userId,
      estDisponible: true,
    },
  });

  // Si aucune disponibilité n'est définie, empêcher la création du rendez-vous
  if (allDisponibilites.length === 0) {
    return { available: false, hasDisponibilites: false };
  }

  // Vérifier les disponibilités régulières (par jour de semaine)
  const disponibilites = await (prisma as any).disponibilite.findMany({
    where: {
      userId,
      jourSemaine,
      estDisponible: true,
      estException: false,
    },
  });

  // Vérifier si l'heure du rendez-vous est dans une plage de disponibilité
  let isAvailable = disponibilites.some((disp: any) => {
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
    const exceptions = await (prisma as any).disponibilite.findMany({
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
      isAvailable = exceptions.some((disp: any) => {
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

  return { available: isAvailable, hasDisponibilites: true };
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
    // Si c'est un admin, pas de filtre (voir tous les rendez-vous)

    const rendezVous = await (prisma as any).rendezVous.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            dateNaissance: true,
            sexe: true,
            telephone: true,
            email: true,
            adresse: true,
            numeroSS: true,
            createdAt: true,
            updatedAt: true,
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

    const rendezVous = await (prisma as any).rendezVous.findUnique({
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

    const rendezVous = await (prisma as any).rendezVous.findMany({
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

    const rendezVous = await (prisma as any).rendezVous.findMany({
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
    const { patientId, userId, dateHeure, motif, notes } = req.body;
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
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Utilisateur (médecin) non trouvé', 404);
    }

    const dateHeureObj = new Date(dateHeure);
    
    // Récupérer la durée depuis la disponibilité du médecin
    const dateOnly = new Date(dateHeureObj.getFullYear(), dateHeureObj.getMonth(), dateHeureObj.getDate());
    const heure = dateHeureObj.getHours();
    const minutes = dateHeureObj.getMinutes();
    const heureMinutes = heure * 60 + minutes;
    
    // Chercher une disponibilité pour cette date spécifique
    let disponibilite = await (prisma as any).disponibilite.findFirst({
      where: {
        userId,
        estDisponible: true,
        dateSpecifique: {
          gte: dateOnly,
          lt: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000), // Jour suivant
        },
      },
    });

    // Vérifier que l'heure du rendez-vous est dans la plage de disponibilité
    if (disponibilite) {
      const [debutH, debutM] = disponibilite.heureDebut.split(':').map(Number);
      const [finH, finM] = disponibilite.heureFin.split(':').map(Number);
      const debutMinutes = debutH * 60 + debutM;
      const finMinutes = finH * 60 + finM;
      
      if (heureMinutes < debutMinutes || heureMinutes >= finMinutes) {
        disponibilite = null; // L'heure n'est pas dans la plage
      }
    }

    // Utiliser la durée de la disponibilité ou 30 minutes par défaut
    const dureeRdv = disponibilite?.dureeConsultation || 30;

    // Vérifier les disponibilités du médecin
    const disponibiliteCheck = await checkDisponibilite(userId, dateHeureObj, dureeRdv);
    
    // Si le médecin n'a pas de disponibilités définies, empêcher la création
    if (!disponibiliteCheck.hasDisponibilites) {
      const medecin = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: { prenom: true, nom: true, specialite: true },
      });
      const medecinName = medecin ? `Dr. ${medecin.prenom} ${medecin.nom}` : 'Le médecin';
      throw new AppError(
        `${medecinName} n'a pas encore défini ses disponibilités. Veuillez demander au médecin de définir ses disponibilités avant de créer un rendez-vous.`,
        409
      );
    }
    
    // Si le médecin a des disponibilités mais n'est pas disponible à cette heure
    if (!disponibiliteCheck.available) {
      // Récupérer les informations du médecin pour un message plus informatif
      const medecin = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: { prenom: true, nom: true, specialite: true },
      });
      const medecinName = medecin ? `Dr. ${medecin.prenom} ${medecin.nom}` : 'Le médecin';
      const dateFormatted = dateHeureObj.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      throw new AppError(
        `${medecinName} n'est pas disponible à cette heure (${dateFormatted}).`,
        409
      );
    }

    // Vérifier les conflits avec d'autres rendez-vous
    const hasConflict = await checkConflitRendezVous(userId, dateHeureObj, dureeRdv);
    if (hasConflict) {
      throw new AppError('Un rendez-vous existe déjà à cette heure pour ce médecin', 409);
    }

    // Déterminer le statut selon le rôle
    // Admin/Médecin → "planifie", Patient → "en_attente" (en attente de confirmation par l'admin)
    const statut = currentUser.role === 'patient' ? 'en_attente' : 'planifie';

    const rendezVous = await (prisma as any).rendezVous.create({
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

    const userId = updateData.userId || (existingRendezVous as any).userId;
    const dateHeure = updateData.dateHeure ? new Date(updateData.dateHeure) : existingRendezVous.dateHeure;
    const duree = updateData.duree || existingRendezVous.duree;

    // Vérifier les disponibilités si la date/heure ou le médecin change
    if (updateData.dateHeure || updateData.userId || updateData.duree) {
      const disponibiliteCheck = await checkDisponibilite(userId, dateHeure, duree);
      if (!disponibiliteCheck.available && disponibiliteCheck.hasDisponibilites) {
        // Récupérer les informations du médecin pour un message plus informatif
        const medecin = await (prisma as any).user.findUnique({
          where: { id: userId },
          select: { prenom: true, nom: true, specialite: true },
        });
        const medecinName = medecin ? `Dr. ${medecin.prenom} ${medecin.nom}` : 'Le médecin';
        const dateFormatted = dateHeure.toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        throw new AppError(
          `${medecinName} n'est pas disponible à cette heure (${dateFormatted}).`,
          409
        );
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

    const rendezVous = await (prisma as any).rendezVous.update({
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

    // Le rendez-vous doit être en statut "en_attente" pour être confirmé (passer à "confirme")
    const statutStr = String(rendezVous.statut);
    if (statutStr !== 'en_attente') {
      throw new AppError(
        `Impossible de confirmer un rendez-vous avec le statut "${rendezVous.statut}". Seuls les rendez-vous en attente peuvent être confirmés.`,
        400
      );
    }

    const updatedRendezVous = await (prisma as any).rendezVous.update({
      where: { id },
      data: { statut: 'confirme' },
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

export const rejectRendezVous = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { raisonAnnulation } = req.body;
    const currentUser = req.user;

    if (!currentUser) {
      throw new AppError('Authentification requise', 401);
    }

    // Seuls les admins et médecins peuvent rejeter un rendez-vous
    if (currentUser.role !== 'admin' && currentUser.role !== 'medecin') {
      throw new AppError('Seuls les administrateurs et médecins peuvent rejeter un rendez-vous', 403);
    }

    const rendezVous = await (prisma as any).rendezVous.findUnique({
      where: { id },
    });

    if (!rendezVous) {
      throw new AppError('Rendez-vous non trouvé', 404);
    }

    // Le rendez-vous doit être en statut "en_attente" pour être rejeté
    const statutStr = String(rendezVous.statut);
    if (statutStr !== 'en_attente') {
      throw new AppError(
        `Impossible de rejeter un rendez-vous avec le statut "${rendezVous.statut}". Seuls les rendez-vous en attente peuvent être rejetés.`,
        400
      );
    }

    const updatedRendezVous = await (prisma as any).rendezVous.update({
      where: { id },
      data: {
        statut: 'annule',
        raisonAnnulation: raisonAnnulation || 'Rendez-vous rejeté par l\'administrateur',
      },
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


