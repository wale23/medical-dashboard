import { Router } from 'express';
import { login, register, loginPatient } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/patient/login', loginPatient);

export default router;


