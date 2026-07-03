import express from 'express';
import { getDashboardSummary, getFullSummary } from './dashboardController.js';

const router = express.Router();

router.get('/summary', getDashboardSummary);
router.get('/full-summary', getFullSummary);

export default router;
