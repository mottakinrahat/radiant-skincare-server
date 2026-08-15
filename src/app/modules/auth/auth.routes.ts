import express from 'express';
import { authController } from './auth.controller';
import { auth } from '../../middleWares/auth';
import { UserRole } from '../../../../prisma/generated/prisma';
import { UserController } from '../User/user.controller';
import { UserValidation } from '../User/user.validation';
import validateRequest from '../../middleWares/validateRequest';

const router = express.Router();

router.post(
  '/register',
  validateRequest(UserValidation.createBuyerValidationSchema),
  UserController.createBuyer
);
router.post('/login', authController.loginUser);
router.post('/refreshToken', authController.refreshToken);
router.post('/change-password', auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.BUYER), authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export const authRoutes = router;


