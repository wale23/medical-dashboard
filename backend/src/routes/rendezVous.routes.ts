import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllRendezVous,
  getRendezVousById,
  createRendezVous,
  updateRendezVous,
  deleteRendezVous,
  getRendezVousByMedecin,
  getRendezVousByPatient,
  confirmRendezVous,
} from '../controllers/rendezVous.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllRendezVous);
router.get('/user/:userId', getRendezVousByMedecin);
router.get('/patient/:patientId', getRendezVousByPatient);
router.get('/:id', getRendezVousById);
router.post('/', createRendezVous);
router.put('/:id', updateRendezVous);
router.patch('/:id/confirm', confirmRendezVous);
router.delete('/:id', deleteRendezVous);

export default router;


