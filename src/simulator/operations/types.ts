import { SandboxState } from '../types';

export type Operation<A, R> = (system: SandboxState, args: A) => R;

type StringToType = {
  boolean: boolean;
  single: string;
};

// CLI options can have boolean, string or numerical values
export type CommandOptionType = keyof StringToType;

/**
 * Information about a single CLI option taken by the command.
 */
export type CommandOption<T extends CommandOptionType> = {
  shortLetter?: string;
  description: string;
  valueType: T;
};

/**
 * Describes the option value types of each option
 * taken by the command.
 */
export interface CommandOptionsProfile {
  [name: string]: CommandOptionType;
}

/**
 * Describes the CLI options taken by the command
 */
export type CommandOptions<T extends CommandOptionsProfile> = {
  [K in keyof T]: CommandOption<T[K]>;
};

/**
 * The option value object passed to command for execution.
 */
export type CommandOptionValues<T extends CommandOptionsProfile> = {
  [K in keyof T]?: StringToType[T[K]];
};

export type CommandExecReturn = {
  system: SandboxState;
  success: boolean;
};

/**
 * Represents a CLI command callable through the virtual terminal.
 *
 * Is characterised by its option profile `T`, which describes the options
 * it takes and the types of their values.
 */
export interface Command<T extends CommandOptionsProfile> {
  name: string;
  options: CommandOptions<T>;

  execute(
    system: SandboxState,
    print: (text: string) => void,
    opts: CommandOptionValues<T>,
    args: string[]
  ): CommandExecReturn;
}
