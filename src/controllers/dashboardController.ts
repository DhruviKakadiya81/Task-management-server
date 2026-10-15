import { Request, Response, NextFunction } from 'express';
import { Task } from '../models/Task.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * @desc    Get dashboard metrics and recent tasks for current user
 * @route   GET /api/v1/dashboard/stats
 * @access  Private
 */
export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;

    // Run counts and recent tasks query in parallel
    const [totalTasks, pendingTasks, inProgressTasks, completedTasks, recentTasks] =
      await Promise.all([
        Task.countDocuments({ userId }),
        Task.countDocuments({ userId, status: 'Pending' }),
        Task.countDocuments({ userId, status: 'In Progress' }),
        Task.countDocuments({ userId, status: 'Completed' }),
        Task.find({ userId }).sort({ createdAt: -1 }).limit(5),
      ]);

    sendSuccess(res, {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};
