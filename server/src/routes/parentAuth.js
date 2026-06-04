const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// Parent login — phone + PIN
router.post('/login', async (req, res) => {
  const { phone, pin } = req.body;
  try {
    const parent = await prisma.parent.findUnique({ where: { phone } });
    if (!parent || !parent.pin) {
      return res.status(401).json({ error: 'Invalid phone number or PIN not set. Ask the spa to set your PIN.' });
    }
    const valid = await bcrypt.compare(String(pin), parent.pin);
    if (!valid) return res.status(401).json({ error: 'Incorrect PIN' });

    const token = jwt.sign(
      { id: parent.id, name: parent.name, phone: parent.phone, role: 'PARENT' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({ token, parent: { id: parent.id, name: parent.name, phone: parent.phone, email: parent.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Staff sets/resets a parent's PIN
router.post('/set-pin', authenticate, async (req, res) => {
  const { parentId, pin } = req.body;
  if (!pin || String(pin).length < 4) return res.status(400).json({ error: 'PIN must be at least 4 digits' });
  try {
    const hashed = await bcrypt.hash(String(pin), 10);
    const parent = await prisma.parent.update({
      where: { id: parentId },
      data: { pin: hashed },
      select: { id: true, name: true, phone: true },
    });
    res.json({ success: true, parent });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get parent's own data (used by parent portal)
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'PARENT') return res.status(403).json({ error: 'Not a parent token' });

    const parent = await prisma.parent.findUnique({
      where: { id: decoded.id },
      include: {
        pets: {
          include: {
            appointments: {
              orderBy: { scheduledAt: 'desc' },
              include: {
                staff: { select: { name: true } },
                services: true,
                incidents: true,
                photos: true,
              },
            },
          },
        },
      },
    });
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    const { pin: _, ...safeParent } = parent;
    res.json(safeParent);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
