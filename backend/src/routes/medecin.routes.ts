import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getAllMedecins, getMedecinById, createUser, updateMedecin, deleteUser } from '../controllers/medecin.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllMedecins);
router.get('/:id', getMedecinById);
router.post('/', authorize('admin'), createUser);
router.put('/:id', authorize('admin'), updateMedecin);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;


