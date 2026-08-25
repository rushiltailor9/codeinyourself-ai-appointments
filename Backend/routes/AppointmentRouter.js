import express from 'express';
import {
  create,
  getClientAppointments,
  getAppointmentById,
  reschedule,
  cancel,
  listAllAdmin,
  updateStatusAdmin,
} from '../controllers/AppointmentController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/my', optionalAuthMiddleware, getClientAppointments);
router.post('/', optionalAuthMiddleware, create);
router.get('/admin', authMiddleware, adminMiddleware, listAllAdmin);
router.get('/', authMiddleware, adminMiddleware, listAllAdmin); // Support GET /api/admin/appointments
router.patch('/admin/:id/status', authMiddleware, adminMiddleware, updateStatusAdmin);
router.patch('/:id/status', authMiddleware, adminMiddleware, updateStatusAdmin); // Support PATCH /api/admin/appointments/:id/status
router.get('/:id', optionalAuthMiddleware, getAppointmentById);
router.put('/:id', optionalAuthMiddleware, reschedule);
router.delete('/:id', optionalAuthMiddleware, cancel);

export default router;
