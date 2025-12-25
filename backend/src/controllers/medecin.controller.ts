import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getAllMedecins = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        specialite: true,
        numeroOrdre: true,
        telephone: true,
        email: true,
        userRole: true,
        photo: true,
        createdAt: true,
      },
      orderBy: { nom: 'asc' },
    });

    res.json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const getMedecinById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        prenom: true,
        specialite: true,
        numeroOrdre: true,
        telephone: true,
        email: true,
        userRole: true,
        photo: true,
        disponibilites: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    res.json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { nom, prenom, specialite, numeroOrdre, telephone, email, motDePasse, userRole, photo } = req.body;

    if (!nom || !prenom || !specialite || !numeroOrdre || !telephone || !email || !motDePasse) {
      throw new AppError('Tous les champs sont requis', 400);
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('Un utilisateur avec cet email existe déjà', 409);
    }

    // Vérifier si le numéro d'ordre existe déjà
    const existingNumeroOrdre = await prisma.user.findUnique({
      where: { numeroOrdre },
    });

    if (existingNumeroOrdre) {
      throw new AppError('Un utilisateur avec ce numéro d\'ordre existe déjà', 409);
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Créer l'utilisateur (par défaut rôle médecin, sauf si spécifié)
    const user = await prisma.user.create({
      data: {
        nom,
        prenom,
        specialite,
        numeroOrdre,
        telephone,
        email,
        motDePasse: hashedPassword,
        userRole: userRole || 'medecin',
        photo,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        specialite: true,
        numeroOrdre: true,
        telephone: true,
        email: true,
        userRole: true,
        photo: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Utilisateur créé avec succès',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMedecin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateData.email },
      });
      if (emailExists) {
        throw new AppError('Un utilisateur avec cet email existe déjà', 409);
      }
    }

    // Si le numéro d'ordre est modifié, vérifier qu'il n'existe pas déjà
    if (updateData.numeroOrdre && updateData.numeroOrdre !== existingUser.numeroOrdre) {
      const numeroOrdreExists = await prisma.user.findUnique({
        where: { numeroOrdre: updateData.numeroOrdre },
      });
      if (numeroOrdreExists) {
        throw new AppError('Un utilisateur avec ce numéro d\'ordre existe déjà', 409);
      }
    }

    // Si le mot de passe est fourni, le hasher
    if (updateData.motDePasse) {
      updateData.motDePasse = await bcrypt.hash(updateData.motDePasse, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nom: true,
        prenom: true,
        specialite: true,
        numeroOrdre: true,
        telephone: true,
        email: true,
        userRole: true,
        photo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      status: 'success',
      message: 'Utilisateur mis à jour avec succès',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    // Supprimer l'utilisateur (les relations seront supprimées en cascade si configuré)
    await prisma.user.delete({
      where: { id },
    });

    res.json({
      status: 'success',
      message: 'Utilisateur supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
};


