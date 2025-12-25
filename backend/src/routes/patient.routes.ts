import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getMyProfile,
} from '../controllers/patient.controller';

const router = Router();

router.use(authenticate);

// Route pour que les patients accèdent à leur propre profil
router.get('/me', getMyProfile);

// Routes protégées pour médecins/admins
router.use(authorize('medecin', 'admin'));

router.get('/', getAllPatients);
router.get('/:id', getPatientById);
router.post('/', createPatient);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

export default router;


