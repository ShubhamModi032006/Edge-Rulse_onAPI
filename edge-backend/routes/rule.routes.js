import express from 'express';
import {
    createNewRule,
    listAllRules,
    getSingleRule,
    updateExistingRule,
    deleteRule,
    listRuleVersions,
    getRuleCacheDebug
} from '../controllers/rule.controller.js';

const router = express.Router();

router.post('/', createNewRule);
router.get('/', listAllRules);
router.get('/:id', getSingleRule);
router.put('/:id', updateExistingRule);
router.delete('/:id', deleteRule);
router.get('/:id/versions', listRuleVersions);
router.get('/:apiId/cache', getRuleCacheDebug);

export default router;
