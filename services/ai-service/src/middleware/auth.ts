import type { Request, Response, NextFunction } from "express";

export type ServiceUser = {
  id: string;
  role: string;
};

declare module "express-serve-static-core" {
  interface Request {
    serviceUser?: ServiceUser;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const expected = process.env.AI_SERVICE_API_KEY;

  if (!expected || apiKey !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.headers["x-user-id"];
  const userRole = req.headers["x-user-role"];

  if (typeof userId !== "string" || typeof userRole !== "string") {
    res.status(400).json({ error: "X-User-Id and X-User-Role headers required" });
    return;
  }

  req.serviceUser = { id: userId, role: userRole };
  next();
}

export function requireLearner(req: Request, res: Response, next: NextFunction) {
  if (req.serviceUser?.role !== "LEARNER") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.serviceUser?.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
