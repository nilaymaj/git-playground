import { List } from 'immutable';

type TerminalLine = {
  text: string;
  prompt?: string;
};

export type TerminalHistory = List<TerminalLine>;

/**
 * Creates a blank terminal data holder.
 */
export const startTerminal = (): TerminalHistory => List();

/**
 * Pushes a line of output into the terminal, and
 * returns the new terminal data holder.
 */
export const pushOutput = (
  terminalLines: TerminalHistory,
  text: string
): TerminalHistory => terminalLines.push({ text });

/**
 * Pushes a line of user input into the terminal, and
 * returns the new terminal data holder.
 */
export const pushInput = (
  terminalLines: TerminalHistory,
  text: string,
  prompt: string
): TerminalHistory => terminalLines.push({ text, prompt });
