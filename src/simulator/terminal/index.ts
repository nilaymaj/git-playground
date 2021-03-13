import CreateCommand from '../operations/file-system/create';
import { SandboxState } from '../types';
import Parser, { BinPath } from './parser';

const PATH: BinPath = {
  create: new CreateCommand(),
};

class Terminal {
  private parser: Parser = new Parser(PATH);

  /**
   * Executes the user input on the system provided.
   * Returns success or failure status of command.
   */
  execute = (input: string, system: SandboxState) => {
    const parsed = this.parser.parse(input);
    console.log(parsed);
    if (!parsed) return false;

    const commandUsed = PATH[parsed.command];
    if (!commandUsed) return false;

    return commandUsed.execute(system, parsed.opts, parsed.args);
  };
}

export default Terminal;
