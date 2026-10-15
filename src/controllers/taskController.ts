import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { TaskQueryInput } from '../validators/taskSchemas.js';

/**
 * @desc    Get all tasks for current authenticated user with search, filtering, sorting, pagination
 * @route   GET /api/v1/tasks
 * @access  Private
 */
export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { search, status, priority, sortBy, order, page, limit } =
      req.query as unknown as TaskQueryInput;

    // Build filter query scoped strictly to the authenticated user
    const filter: Record<string, unknown> = { userId };

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    // Build sort object with allowlisted fields
    const sortField = ['createdAt', 'dueDate', 'title', 'priority'].includes(sortBy)
      ? sortBy
      : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const skip = (page - 1) * limit;

    // Execute query & count in parallel
    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sort).skip(skip).limit(limit),
      Task.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    sendSuccess(res, {
      items: tasks,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/v1/tasks/:id
 * @access  Private
 */
export const getTaskById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid task ID format' });
      return;
    }

    const task = await Task.findOne({
      _id: id,
      userId: req.user!._id,
    });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    sendSuccess(res, task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/v1/tasks
 * @access  Private
 */
export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId: req.user!._id,
    });

    sendSuccess(res, task, 'Task created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task details or status
 * @route   PATCH /api/v1/tasks/:id
 * @access  Private
 */
export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid task ID format' });
      return;
    }

    const updateData: Record<string, unknown> = { ...req.body };
    if (updateData.dueDate !== undefined) {
      updateData.dueDate = updateData.dueDate ? new Date(updateData.dueDate as string) : undefined;
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user!._id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    sendSuccess(res, task, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/v1/tasks/:id
 * @access  Private
 */
export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid task ID format' });
      return;
    }

    const task = await Task.findOneAndDelete({
      _id: id,
      userId: req.user!._id,
    });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    sendSuccess(res, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};
