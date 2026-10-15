import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} from '../validators/taskSchemas.js';

const router = Router();

// Protect all task endpoints
router.use(protect);

router
  .route('/')
  .get(validateRequest(taskQuerySchema, 'query'), getTasks)
  .post(validateRequest(createTaskSchema, 'body'), createTask);

router
  .route('/:id')
  .get(getTaskById)
  .patch(validateRequest(updateTaskSchema, 'body'), updateTask)
  .delete(deleteTask);

export default router;
