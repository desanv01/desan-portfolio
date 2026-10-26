import { APIError } from 'payload';
/** Authored validation messages only; never construct this from database/native errors. */
export class SafeValidationError extends APIError {
  constructor(
    message: string,
    public fields: string[] = [],
  ) {
    super(message, 400);
  }
}
