const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

const INCLUDE_FULL = {
  pet: { include: { parent: true } },
  staff: { select: { id: true, name: true, email: true } },
  services: true,
  incidents: true,
  photos: true,
};

router.get('/', authenticate, async (req, res) => {
  try {
    const { date, status } = req.query;
    const where = {};

    if (status) where.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.scheduledAt = { gte: start, lte: end };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: INCLUDE_FULL,
      orderBy: { scheduledAt: 'asc' },
    });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: INCLUDE_FULL,
    });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  const { petId, staffId, scheduledAt, notes, services } = req.body;
  try {
    const appointment = await prisma.appointment.create({
      data: {
        petId,
        staffId,
        scheduledAt: new Date(scheduledAt),
        notes,
        services: {
          create: (services || []).map((s) => ({ name: s })),
        },
      },
      include: INCLUDE_FULL,
    });
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  try {
    const data = { status };
    if (status === 'COMPLETED') data.completedAt = new Date();

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data,
      include: INCLUDE_FULL,
    });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/service/:serviceId', authenticate, async (req, res) => {
  const { completed, notes } = req.body;
  try {
    const service = await prisma.appointmentService.update({
      where: { id: req.params.serviceId },
      data: {
        completed,
        notes,
        completedAt: completed ? new Date() : null,
      },
    });
    res.json(service);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  const { staffId, scheduledAt, notes } = req.body;
  try {
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { staffId, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined, notes },
      include: INCLUDE_FULL,
    });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
