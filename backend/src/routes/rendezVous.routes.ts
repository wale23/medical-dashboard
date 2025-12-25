import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getAllRendezVous,
  getRendezVousById,
  createRendezVous,
  updateRendezVous,
  deleteRendezVous,
  getRendezVousByMedecin,
  getRendezVousByPatient,
  confirmRendezVous,
  rejectRendezVous,
} from '../controllers/rendezVous.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllRendezVous);
router.get('/user/:userId', getRendezVousByMedecin);
router.get('/patient/:patientId', getRendezVousByPatient);
router.get('/:id', getRendezVousById);
router.post('/', createRendezVous);
router.put('/:id', updateRendezVous);
router.patch('/:id/confirm', authorize('admin', 'medecin'), confirmRendezVous);
router.patch('/:id/reject', authorize('admin', 'medecin'), rejectRendezVous);
router.delete('/:id', deleteRendezVous);

export default router;


