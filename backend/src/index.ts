import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Routes
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import medecinRoutes from './routes/medecin.routes';
import rendezVousRoutes from './routes/rendezVous.routes';
import consultationRoutes from './routes/consultation.routes';
import dossierMedicalRoutes from './routes/dossierMedical.routes';
import prescriptionRoutes from './routes/prescription.routes';
import factureRoutes from './routes/facture.routes';
import disponibiliteRoutes from './routes/disponibilite.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medecins', medecinRoutes);
app.use('/api/rendez-vous', rendezVousRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/dossiers-medicaux', dossierMedicalRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/factures', factureRoutes);
app.use('/api/disponibilites', disponibiliteRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});


