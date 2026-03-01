
import express from 'express';
import { registerApi, listApis } from '../controllers/api.controller.js';

const router = express.Router();

router.post('/register', registerApi);
router.get('/list', listApis);

export default router;
