/** An error with an associated HTTP status, thrown by the service layer. */
export class ServiceError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
  }
}

/** Extract a user-safe message from an unknown thrown value. */
export function toClientMessage(err: unknown): string {
  return err instanceof ServiceError ? err.message : 'Something went wrong';
}
