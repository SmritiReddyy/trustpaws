const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

router.post('/', authenticate, async (req, res) => {
  const { appointmentId, severity, title, description, actionTaken } = req.body;
  try {
    const incident = await prisma.incident.create({
      data: { appointmentId, severity, title, description, actionTaken },
    });
    res.status(201).json(incident);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  const { severity, title, description, actionTaken } = req.body;
  try {
    const incident = await prisma.incident.update({
      where: { id: req.params.id },
      data: { severity, title, description, actionTaken },
    });
    res.json(incident);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.incident.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
