/**
 * Represents an error originating from an invalid path
 * being provided to a function or command.
 */
export class InvalidArgError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidArgError.prototype);
  }
}

/**
 * Represents an error originating from something that just
 * shouldn't happen, something terribly wrong.
 */
export class Apocalypse extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, Apocalypse.prototype);
  }
}
