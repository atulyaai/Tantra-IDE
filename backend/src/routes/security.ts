import express from 'express';

const router = express.Router();

router.post('/scan', async (req, res, next) => {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

router.post('/fix', async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Vulnerability fixed' });
  } catch (error) {
    next(error);
  }
});

export default router;

