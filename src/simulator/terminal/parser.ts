import yargsParse from 'yargs-parser';
import {
  Command,
  CommandOptions,
  CommandOptionsProfile,
} from '../operations/types';

/**
 * Stores the available executables, like
 * the bash PATH variable.
 */
export type BinPath = { [k: string]: Command<any> };

/**
 * The result of parsing some valid input string
 */
export type ParsedInput = {
  command: string;
  args: string[];
  opts: { [optName: string]: boolean | string };
};

/**
 * Parses user input from the terminal into the command run,
 * along with options and arguments passed.
 */
export default class Parser {
  private binPath: BinPath;

  /**
   * Initializes the parser, loading the commands
   * on provided path into the parser.
   */
  constructor(path: BinPath) {
    this.binPath = path || {};
  }

  /**
   * Parses a terminal input to get the command run, its options and arguments passed.
   * Returns `null` for invalid input or if no matching command is found on path.
   */
  parse = (input: string): ParsedInput | null => {
    if (input.trim().length === 0) return null;

    // Find the command run, by testing each command name against start of input
    const commandName = Object.keys(this.binPath).find((cmdName) => {
      const cmdNamePrefix = cmdName + ' ';
      return input.indexOf(cmdNamePrefix) === 0;
    });
    if (!commandName) return null;

    // Parse the opts-args part of input using the command's option config
    const argSubstring = input.slice(commandName.length + 1);
    const commandOptions = this.binPath[commandName].options;
    const yargsOpts = this.createYargsOptions(commandOptions);
    const parsed = yargsParse(argSubstring, yargsOpts);

    const { _: args, '--': _o, ...opts } = parsed;
    return { command: commandName, args, opts };
  };

  /**
   * Create yargs-specific `opts` object for parsing
   */
  private createYargsOptions = <T extends CommandOptionsProfile>(
    cmdOptions: CommandOptions<T>
  ): yargsParse.Options => {
    const yOpts = {
      string: [] as string[],
      boolean: [] as string[],
      alias: {} as { [key: string]: string | string[] },
    };

    Object.keys(cmdOptions).forEach((optionName) => {
      const option = cmdOptions[optionName];
      if (option.shortLetter) yOpts.alias[optionName] = option.shortLetter;
      if (option.valueType === 'boolean') yOpts.boolean.push(optionName);
      if (option.valueType === 'single') yOpts.string.push(optionName);
    });

    return yOpts;
  };
}
