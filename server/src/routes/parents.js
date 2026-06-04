const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const parents = await prisma.parent.findMany({
      include: { pets: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(parents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const parent = await prisma.parent.findUnique({
      where: { id: req.params.id },
      include: { pets: { include: { appointments: { orderBy: { scheduledAt: 'desc' }, take: 5 } } } },
    });
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    res.json(parent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  const { name, phone, email } = req.body;
  try {
    const parent = await prisma.parent.create({ data: { name, phone, email } });
    res.status(201).json(parent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  const { name, phone, email } = req.body;
  try {
    const parent = await prisma.parent.update({
      where: { id: req.params.id },
      data: { name, phone, email },
    });
    res.json(parent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
