
import { HttpStatusCode } from "./http-status";
export class AppError extends Error {

  public statusCode: HttpStatusCode;
  public isOperational: boolean;

  constructor(message: string, statusCode: HttpStatusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}