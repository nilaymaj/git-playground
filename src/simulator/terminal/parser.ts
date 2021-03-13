import minimist from 'minimist';
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
    const inputWords = input.split(' ');
    if (inputWords.length === 0) return null;

    // Try taking first two words as command name
    console.log('Parsing at 2...');
    const parseAt2 = this.splitAndParseFrom(inputWords, 2);
    if (parseAt2) return parseAt2;

    // Try taking only first word as command name
    console.log('Parsing at 1...');
    const parseAt1 = this.splitAndParseFrom(inputWords, 1);
    if (parseAt1) return parseAt1;

    console.log('Parse failed!');

    return null;
  };

  /**
   * Parse the given input, assuming that the first `cmdLength` words
   * of the input represent the command name run.
   *
   * Returns `null` if input is invalid, or command does not exist in PATH
   */
  private splitAndParseFrom = (
    inputWords: string[],
    cmdLength: number
  ): ParsedInput | null => {
    if (inputWords.length < cmdLength) return null;
    const commandName = inputWords.slice(0, cmdLength).join(' ');
    const command = this.binPath[commandName];
    if (!command) return null;

    // Create minimist parser and parse input
    const minimistOpts = this.createMinimistOptions(command.options);
    console.log(inputWords.slice(cmdLength));
    const parsed = minimist(inputWords.slice(cmdLength), minimistOpts);
    const { _: args, '--': _o, ...opts } = parsed;
    return { command: commandName, args, opts };
  };

  /**
   * Create Minimist-specific `opts` object for parsing
   */
  private createMinimistOptions = <T extends CommandOptionsProfile>(
    cmdOptions: CommandOptions<T>
  ): minimist.Opts => {
    const mOpts = {
      string: [] as string[],
      boolean: [] as string[],
      alias: {} as { [key: string]: string | string[] },
    };

    Object.keys(cmdOptions).forEach((optionName) => {
      const option = cmdOptions[optionName];
      if (option.shortLetter) mOpts.alias[optionName] = option.shortLetter;
      if (option.valueType === 'boolean') mOpts.boolean.push(optionName);
      if (option.valueType === 'single') mOpts.string.push(optionName);
    });

    return mOpts;
  };
}
