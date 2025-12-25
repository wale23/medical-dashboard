import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getDossierMedicalByPatient,
  updateDossierMedical,
  createDossierMedical,
  updateDossierMedicalByPatient,
} from '../controllers/dossierMedical.controller';

const router = Router();

router.use(authenticate);

router.get('/patient/:patientId', getDossierMedicalByPatient);
router.post('/', authorize('admin', 'medecin'), createDossierMedical);
router.put('/:id', authorize('admin', 'medecin'), updateDossierMedical);
router.put('/patient/:patientId', authorize('admin', 'medecin'), updateDossierMedicalByPatient);

export default router;


