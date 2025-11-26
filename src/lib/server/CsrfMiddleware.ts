import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

const CSRF_COOKIE_NAME = "_csrf";

export const createCsrfMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Generate or retrieve token
    let token = req.cookies[CSRF_COOKIE_NAME];

    if (!token) {
      token = crypto.randomBytes(32).toString("hex");
      res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }

    // 2. Expose token to the response locals (for injection into the view)
    res.locals.csrfToken = token;

    // 3. Verify token on state-changing methods
    const method = req.method.toUpperCase();
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      const headerToken = req.headers["x-csrf-token"];

      if (!headerToken || headerToken !== token) {
        return res.status(403).json({ error: "Invalid CSRF Token" });
      }
    }

    next();
  };
};
