import express from 'express';
import { createInstitute, updateInstitute } from '../controllers/InstituteManagement';
import { checkAuth } from '../middleware/checkAuth';
import { checkRole } from '../middleware/checkRole';

const router = express.Router();

router.use(checkAuth, checkRole("admin"));

router.post('/', createInstitute);
router.put('/:id', updateInstitute);

export default router;