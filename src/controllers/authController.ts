import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { generateToken, setTokenCookie, clearTokenCookie } from '../utils/token.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
      return;
    }

    // Create user (password hashing is handled in User schema pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
    });

    sendSuccess(
      res,
      { user },
      'Registration successful. Please log in.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate JWT & set HttpOnly cookie
    const token = generateToken(user._id.toString());
    setTokenCookie(res, token);

    sendSuccess(
      res,
      { user },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(res, { user: req.user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log user out & clear token cookie
 * @route   POST /api/v1/auth/logout
 * @access  Public / Private
 */
export const logout = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    clearTokenCookie(res);
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};
