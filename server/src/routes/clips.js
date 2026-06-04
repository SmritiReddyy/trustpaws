const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/clips'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}.webm`),
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

router.get('/appointment/:appointmentId', authenticate, async (req, res) => {
  try {
    const clips = await prisma.clip.findMany({
      where: { appointmentId: req.params.appointmentId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(clips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public route — accessible via tracking token (no auth needed)
router.get('/public/:appointmentId', async (req, res) => {
  try {
    const clips = await prisma.clip.findMany({
      where: { appointmentId: req.params.appointmentId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, url: true, triggerType: true, durationSec: true, createdAt: true },
    });
    res.json(clips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, upload.single('clip'), async (req, res) => {
  const { appointmentId, triggerType, confidence, durationSec } = req.body;
  try {
    if (!req.file) return res.status(400).json({ error: 'No clip uploaded' });
    const url = `/uploads/clips/${req.file.filename}`;
    const clip = await prisma.clip.create({
      data: {
        appointmentId,
        url,
        triggerType: triggerType || 'MANUAL',
        confidence: confidence ? parseFloat(confidence) : null,
        durationSec: durationSec ? parseInt(durationSec) : null,
      },
    });

    // Auto-create a draft incident for non-manual triggers
    if (triggerType !== 'MANUAL') {
      await prisma.incident.create({
        data: {
          appointmentId,
          severity: triggerType === 'AUDIO_DISTRESS' ? 'MEDIUM' : 'LOW',
          title: triggerType === 'AUDIO_DISTRESS'
            ? 'Auto-detected: Pet distress sounds'
            : 'Auto-detected: Sudden motion spike',
          description: `TrustPaws AI flagged a potential issue. Confidence: ${Math.round((confidence || 0) * 100)}%. Please review the clip and update or dismiss this incident.`,
          actionTaken: '',
        },
      });
    }

    res.status(201).json(clip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/reviewed', authenticate, async (req, res) => {
  try {
    const clip = await prisma.clip.update({
      where: { id: req.params.id },
      data: { reviewed: true },
    });
    res.json(clip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.clip.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
