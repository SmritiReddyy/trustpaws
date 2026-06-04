const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Public route — no auth needed, used by pet parents via tracking link
router.get('/:token', async (req, res) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { trackingToken: req.params.token },
      include: {
        pet: { include: { parent: true } },
        staff: { select: { name: true } },
        services: { orderBy: { id: 'asc' } },
        incidents: { orderBy: { reportedAt: 'asc' } },
        photos: { orderBy: { uploadedAt: 'asc' } },
      },
    });
    if (!appointment) return res.status(404).json({ error: 'Tracking link not found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
