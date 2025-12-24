import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllDisponibilites,
  getDisponibiliteById,
  createDisponibilite,
  updateDisponibilite,
  deleteDisponibilite,
  getDisponibilitesByMedecin,
} from '../controllers/disponibilite.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllDisponibilites);
router.get('/user/:userId', getDisponibilitesByMedecin);
router.get('/:id', getDisponibiliteById);
router.post('/', createDisponibilite);
router.put('/:id', updateDisponibilite);
router.delete('/:id', deleteDisponibilite);

export default router;


