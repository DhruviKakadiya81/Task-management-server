import { Response } from 'express';

export interface StandardResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): void => {
  res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  });
};
