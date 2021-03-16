/**
 * Represents an error originating from an invalid path
 * being provided to a function or command.
 */
export class InvalidPathError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidPathError.prototype);
  }
}
