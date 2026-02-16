
import express from 'express';
import { createRule, listRules } from '../controllers/rule.controller.js';

const router = express.Router();

router.post('/', createRule);
router.get('/', listRules);

export default router;
