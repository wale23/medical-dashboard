import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllConsultations,
  getConsultationById,
  createConsultation,
  updateConsultation,
  getConsultationsByPatient,
  getConsultationsByMedecin,
} from '../controllers/consultation.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllConsultations);
router.get('/patient/:patientId', getConsultationsByPatient);
router.get('/user/:userId', getConsultationsByMedecin);
router.get('/:id', getConsultationById);
router.post('/', createConsultation);
router.put('/:id', updateConsultation);

export default router;


