import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Finance API Error:", err);

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: "Validasi data gagal",
      details: formattedErrors,
    });
  }

  const statusCode = err.statusCode || (err.status && typeof err.status === "number" ? err.status : 500);
  const message = err.message || "Terjadi kesalahan internal pada server";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
