import express from 'express';
import { getTags, createTag, deleteTag } from '../controllers/tagController.js';

const router = express.Router();

router.get('/', getTags);
router.post('/', createTag);
router.delete('/:id', deleteTag);

export default router;
