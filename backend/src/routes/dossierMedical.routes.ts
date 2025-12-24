import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getDossierMedicalByPatient,
  updateDossierMedical,
  createDossierMedical,
} from '../controllers/dossierMedical.controller';

const router = Router();

router.use(authenticate);

router.get('/patient/:patientId', getDossierMedicalByPatient);
router.post('/', createDossierMedical);
router.put('/:id', updateDossierMedical);

export default router;


