import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getAllDisponibilites = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const disponibilites = await prisma.disponibilite.findMany({
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            specialite: true,
            userRole: true, // Inclure le rôle pour filtrer côté frontend
          },
        },
      },
      orderBy: [{ userId: 'asc' }, { jourSemaine: 'asc' }],
    });

    // Filtrer pour exclure les disponibilités des admins (seuls les médecins ont des disponibilités)
    const disponibilitesMedecins = disponibilites.filter(
      (disp) => disp.user.userRole === 'medecin'
    );

    res.json({
      status: 'success',
      data: disponibilitesMedecins,
    });
  } catch (error) {
    next(error);
  }
};

export const getDisponibiliteById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const disponibilite = await prisma.disponibilite.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!disponibilite) {
      throw new AppError('Disponibilité non trouvée', 404);
    }

    res.json({
      status: 'success',
      data: disponibilite,
    });
  } catch (error) {
    next(error);
  }
};

export const getDisponibilitesByMedecin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const disponibilites = await prisma.disponibilite.findMany({
      where: { userId },
      orderBy: [
        { dateSpecifique: { sort: 'asc', nulls: 'last' } },
        { jourSemaine: 'asc' },
      ],
    });

    res.json({
      status: 'success',
      data: disponibilites,
    });
  } catch (error) {
    next(error);
  }
};

export const createDisponibilite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      userId,
      jourSemaine,
      heureDebut,
      heureFin,
      dureeConsultation,
      dateSpecifique,
      estException,
      estDisponible,
      notes,
    } = req.body;

    if (!userId || !heureDebut || !heureFin) {
      throw new AppError('Champs obligatoires manquants', 400);
    }

    // Validation : si c'est une exception, dateSpecifique est requis, sinon jourSemaine est requis
    if (estException) {
      if (!dateSpecifique) {
        throw new AppError('La date spécifique est requise pour une exception', 400);
      }
    } else {
      if (jourSemaine === undefined) {
        throw new AppError('Le jour de la semaine est requis pour une disponibilité régulière', 400);
      }
    }

    const disponibilite = await prisma.disponibilite.create({
      data: {
        userId,
        jourSemaine: estException ? 0 : Number(jourSemaine), // 0 par défaut pour les exceptions
        heureDebut,
        heureFin,
        dureeConsultation: dureeConsultation || 30,
        dateSpecifique: dateSpecifique ? new Date(dateSpecifique) : null,
        estException: estException || false,
        estDisponible: estDisponible !== undefined ? estDisponible : true,
        notes,
      },
      include: {
        user: true,
      },
    });

    res.status(201).json({
      status: 'success',
      data: disponibilite,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDisponibilite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.dateSpecifique) {
      updateData.dateSpecifique = new Date(updateData.dateSpecifique);
    }

    const disponibilite = await prisma.disponibilite.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
      },
    });

    res.json({
      status: 'success',
      data: disponibilite,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDisponibilite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.disponibilite.delete({
      where: { id },
    });

    res.json({
      status: 'success',
      message: 'Disponibilité supprimée avec succès',
    });
  } catch (error) {
    next(error);
  }
};


