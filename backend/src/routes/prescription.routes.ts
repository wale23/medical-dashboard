import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  getPrescriptionsByPatient,
} from '../controllers/prescription.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllPrescriptions);
router.get('/patient/:patientId', getPrescriptionsByPatient);
router.get('/:id', getPrescriptionById);
router.post('/', createPrescription);
router.put('/:id', updatePrescription);

export default router;


