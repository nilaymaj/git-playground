import CreateCommand from '../operations/file-system/create';
import { SandboxState } from '../types';
import Parser, { BinPath } from './parser';

type ExecResult = {
  system: SandboxState;
  success: boolean;
};

const PATH: BinPath = {
  create: new CreateCommand(),
};

class Terminal {
  private parser: Parser = new Parser(PATH);

  /**
   * Executes the user input on the system provided.
   * Returns success or failure status of command.
   */
  execute = (
    input: string,
    system: SandboxState,
    print: (text: string) => void
  ): ExecResult => {
    const parsed = this.parser.parse(input);
    console.log(parsed);
    if (!parsed) return { system, success: false };

    const commandUsed = PATH[parsed.command];
    if (!commandUsed) return { system, success: false };

    return commandUsed.execute(system, print, parsed.opts, parsed.args);
  };
}

export default Terminal;
