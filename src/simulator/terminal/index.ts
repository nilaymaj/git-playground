import CpCommand from '../operations/file-system/cp';
import CreateCommand from '../operations/file-system/create';
import EditCommand from '../operations/file-system/edit';
import MkdirCommand from '../operations/file-system/mkdir';
import MvCommand from '../operations/file-system/mv';
import RmCommand from '../operations/file-system/rm';
import GitAddCommand from '../operations/git-repository/add';
import GitCheckoutCommand from '../operations/git-repository/checkout';
import GitCommitCommand from '../operations/git-repository/commit';
import GitResetCommand from '../operations/git-repository/reset';
import { SandboxState } from '../types';
import Parser, { BinPath } from './parser';

type ExecResult = {
  system: SandboxState;
  success: boolean;
};

const PATH: BinPath = {
  create: new CreateCommand(),
  edit: new EditCommand(),
  mkdir: new MkdirCommand(),
  rm: new RmCommand(),
  cp: new CpCommand(),
  mv: new MvCommand(),

  'git add': new GitAddCommand(),
  'git checkout': new GitCheckoutCommand(),
  'git commit': new GitCommitCommand(),
  'git reset': new GitResetCommand(),
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
    if (!parsed) return { system, success: false };

    const commandUsed = PATH[parsed.command];
    if (!commandUsed) return { system, success: false };

    return commandUsed.execute(system, print, parsed.opts, parsed.args);
  };
}

export default Terminal;
