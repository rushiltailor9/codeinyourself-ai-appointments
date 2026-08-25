import express from 'express';
import {
  getServices,
  getAllServicesAdmin,
  createService,
  updateService,
  deleteService,
} from '../controllers/ServiceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/', getServices);
router.get('/admin', authMiddleware, adminMiddleware, getAllServicesAdmin);
router.post('/', authMiddleware, adminMiddleware, createService);
router.put('/:id', authMiddleware, adminMiddleware, updateService);
router.delete('/:id', authMiddleware, adminMiddleware, deleteService);

export default router;
