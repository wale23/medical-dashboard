import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
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
router.post('/', authorize('admin'), createFacture); // Seuls les admins peuvent créer des factures
router.put('/:id', authorize('admin'), updateFacture); // Seuls les admins peuvent modifier/valider des factures

export default router;


