import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { pomodoroRepository } from "./pomodoro.repository.js";

export async function getSettings(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const settings = await pomodoroRepository.getSettings(req.userId!);
    return res.json({ settings });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const settings = await pomodoroRepository.updateSettings(req.userId!, req.body);
    return res.json({ message: "Pengaturan pomodoro berhasil disimpan", settings });
  } catch (err) {
    next(err);
  }
}

export async function createSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { session, created } = await pomodoroRepository.insertSession(req.userId!, req.body);

    // 200 (not 201) on a retried/duplicate id: the client's offline queue needs
    // "already stored" to be a success, not an error.
    return res.status(created ? 201 : 200).json({
      message: created ? "Sesi fokus tersimpan" : "Sesi fokus sudah tersimpan",
      session,
      duplicate: !created,
    });
  } catch (err) {
    next(err);
  }
}

export async function listSessions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { from, to, limit } = req.query as {
      from?: string;
      to?: string;
      limit?: number;
    };

    const sessions = await pomodoroRepository.listSessions(req.userId!, {
      from,
      to,
      limit: limit ? Number(limit) : undefined,
    });

    return res.json({ sessions });
  } catch (err) {
    next(err);
  }
}

export async function getStats(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const requestedYear = req.query.year ? Number(req.query.year) : undefined;
    const stats = await pomodoroRepository.aggregateStats(req.userId!, requestedYear);
    return res.json(stats);
  } catch (err) {
    next(err);
  }
}
