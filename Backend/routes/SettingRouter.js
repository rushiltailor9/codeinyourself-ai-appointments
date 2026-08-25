import express from 'express';
import {
  getSettings,
  updateSettings,
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '../controllers/SettingController.js';

const router = express.Router();

// System Settings
router.get('/', getSettings);
router.post('/', updateSettings);
router.put('/', updateSettings);

// Team Members
router.get('/members', getTeamMembers);
router.post('/members', createTeamMember);
router.put('/members/:id', updateTeamMember);
router.delete('/members/:id', deleteTeamMember);

export default router;
