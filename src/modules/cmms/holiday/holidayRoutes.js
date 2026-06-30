import express from 'express';
import { getAllHolidays, createHoliday, deleteHoliday } from './holidayController.js';
import authMiddleware from '../../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getAllHolidays);
router.post('/', authMiddleware, createHoliday);
router.delete('/:id', authMiddleware, deleteHoliday);

export default router;
