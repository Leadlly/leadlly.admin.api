import express from 'express';
import { createInstitute, getCurrentUserInstitutes, updateInstitute } from '../controllers/InstituteManagement';
import { checkAuth } from '../middleware/checkAuth';
import { checkRole } from '../middleware/checkRole';

const router = express.Router();

router.use(checkAuth, checkRole("admin"));

router.post('/create', createInstitute);
router.put('/:id', updateInstitute);
router.get('/my', getCurrentUserInstitutes);

export default router;