const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const pets = await prisma.pet.findMany({
      include: { parent: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(pets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { id: req.params.id },
      include: {
        parent: true,
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          include: { services: true, incidents: true, photos: true, staff: true },
        },
      },
    });
    if (!pet) return res.status(404).json({ error: 'Pet not found' });
    res.json(pet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  const { name, breed, species, age, weight, notes, parentId } = req.body;
  try {
    const pet = await prisma.pet.create({
      data: { name, breed, species, age, weight, notes, parentId },
      include: { parent: true },
    });
    res.status(201).json(pet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  const { name, breed, species, age, weight, notes } = req.body;
  try {
    const pet = await prisma.pet.update({
      where: { id: req.params.id },
      data: { name, breed, species, age, weight, notes },
    });
    res.json(pet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
