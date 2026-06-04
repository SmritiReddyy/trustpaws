require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const parentRoutes = require('./routes/parents');
const petRoutes = require('./routes/pets');
const appointmentRoutes = require('./routes/appointments');
const incidentRoutes = require('./routes/incidents');
const photoRoutes = require('./routes/photos');
const trackingRoutes = require('./routes/tracking');
const clipRoutes = require('./routes/clips');
const parentAuthRoutes = require('./routes/parentAuth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/track', trackingRoutes);
app.use('/api/clips', clipRoutes);
app.use('/api/parent-auth', parentAuthRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
