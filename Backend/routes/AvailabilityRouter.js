import express from 'express';
import {
  getSlots,
  getAvailabilitySettings,
  saveAvailability,
  addHoliday,
} from '../controllers/AvailabilityController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/', getSlots);
router.get('/settings', getAvailabilitySettings);
router.post('/settings', authMiddleware, adminMiddleware, saveAvailability);
router.post('/holidays', authMiddleware, adminMiddleware, addHoliday);

export default router;
