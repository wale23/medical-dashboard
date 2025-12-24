import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllFactures,
  getFactureById,
  createFacture,
  updateFacture,
  getFacturesByPatient,
} from '../controllers/facture.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllFactures);
router.get('/patient/:patientId', getFacturesByPatient);
router.get('/:id', getFactureById);
router.post('/', createFacture);
router.put('/:id', updateFacture);

export default router;


