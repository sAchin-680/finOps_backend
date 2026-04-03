import { Router } from 'express';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';
import validate from '../middlewares/validate';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  usersQuerySchema,
} from '../validators/user.validator';
import {
  getMe,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';

const router = Router();

// All routes require a valid JWT
router.use(authenticate);

// Any authenticated user can view their own profile
router.get('/me', getMe);

// Admin-only routes
router.use(authorize('admin'));

router.get('/', validate(usersQuerySchema), getAllUsers);
router.post('/', validate(createUserSchema), createUser);
router.get('/:id', validate(userIdParamSchema), getUserById);
router.patch('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', validate(userIdParamSchema), deleteUser);

export default router;
