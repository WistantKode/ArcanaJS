import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Response {
      /**
       * Sends a success response with a standard format.
       *
       * @param data - The data payload to include in the response (default: {}).
       * @param message - A descriptive message for the success (default: "Success").
       * @param status - The HTTP status code to return (default: 200).
       * @returns The Express Response object.
       */
      success: (
        data?: string | object | null,
        message?: string,
        status?: number
      ) => Response;

      /**
       * Sends an error response with a standard format.
       *
       * @param message - A descriptive message for the error (default: "Error").
       * @param status - The HTTP status code to return (default: 500).
       * @param error - Additional error details or object (default: null).
       * @param data - Optional data payload to include in the error response (default: null).
       * @returns The Express Response object.
       */
      error: (
        message?: string,
        status?: number,
        error?: string | object | null,
        data?: string | object | null
      ) => Response;
    }
  }
}

export const responseHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.success = (
    data: string | object | null = {},
    message: string = "Success",
    status: number = 200
  ) => {
    return res.status(status).json({
      success: true,
      message,
      data,
      error: null,
    });
  };

  res.error = (
    message: string = "Error",
    status: number = 500,
    error: string | object | null = null,
    data: string | object | null = null
  ) => {
    const errorResponse: string | object | null = error
      ? typeof error === "object" && error !== null
        ? error instanceof Error
          ? error.toString()
          : error
        : error.toString()
      : null;

    return res.status(status).json({
      success: false,
      message,
      data,
      error: errorResponse,
    });
  };

  next();
};
