import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      throw new AppError('Email et mot de passe requis', 400);
    }

    const user = await (prisma as any).user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    const isPasswordValid = await bcrypt.compare(motDePasse, user.motDePasse);

    if (!isPasswordValid) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.userRole },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    res.json({
      status: 'success',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        specialite: user.specialite,
        userRole: user.userRole,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nom, prenom, specialite, numeroOrdre, telephone, email, motDePasse, userRole } = req.body;

    if (!nom || !prenom || !specialite || !numeroOrdre || !telephone || !email || !motDePasse) {
      throw new AppError('Tous les champs sont requis', 400);
    }

    // Vérifier si l'email existe déjà
    const existingUser = await (prisma as any).user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('Un utilisateur avec cet email existe déjà', 409);
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const user = await (prisma as any).user.create({
      data: {
        nom,
        prenom,
        specialite,
        numeroOrdre,
        telephone,
        email,
        motDePasse: hashedPassword,
        userRole: userRole || 'medecin',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.userRole },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    res.status(201).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        specialite: user.specialite,
        userRole: user.userRole,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Authentification patient
export const loginPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { telephone, motDePasse } = req.body;

    if (!telephone || !motDePasse) {
      throw new AppError('Téléphone et mot de passe requis', 400);
    }

    const patient = await (prisma as any).patient.findUnique({
      where: { telephone },
      select: {
        id: true,
        nom: true,
        prenom: true,
        telephone: true,
        email: true,
        motDePasse: true,
      },
    });

    if (!patient) {
      throw new AppError('Téléphone ou mot de passe incorrect', 401);
    }

    // Vérifier si le patient a un mot de passe
    const patientPassword = (patient as any).motDePasse;
    if (!patientPassword) {
      throw new AppError('Ce compte patient n\'a pas de mot de passe. Veuillez contacter l\'administration.', 401);
    }

    const isPasswordValid = await bcrypt.compare(motDePasse, patientPassword);

    if (!isPasswordValid) {
      throw new AppError('Téléphone ou mot de passe incorrect', 401);
    }

    const token = jwt.sign(
      { id: patient.id, telephone: patient.telephone, role: 'patient' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    res.json({
      status: 'success',
      token,
      patient: {
        id: patient.id,
        nom: patient.nom,
        prenom: patient.prenom,
        telephone: patient.telephone,
        email: patient.email,
      },
    });
  } catch (error) {
    next(error);
  }
};


