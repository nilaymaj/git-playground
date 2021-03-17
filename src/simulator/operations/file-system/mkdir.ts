import {
  Command,
  CommandExecReturn,
  CommandOptions,
  CommandOptionsProfile,
  CommandOptionValues,
} from '../types';
import { SandboxState } from '../../types';
import { parsePathString } from '../../utils/path-utils';

interface MkdirOptions extends CommandOptionsProfile {}

const mkdirOptions: CommandOptions<MkdirOptions> = {};

/**
 * Creates new empty directory at specified paths, similar to UNIX `mkdir`
 */
export default class MkdirCommand implements Command<MkdirOptions> {
  name = 'mkdir';
  options = mkdirOptions;

  execute = (
    system: SandboxState,
    print: (text: string) => void,
    _opts: CommandOptionValues<MkdirOptions>,
    args: string[]
  ): CommandExecReturn => {
    const paths = args.map(parsePathString);
    if (paths.length === 0) {
      // No paths provided
      print('missing path operand');
      return { system, success: false };
    }

    let currentFS = system.fileSystem;
    for (const path of paths) {
      // Execute `mkdir` for this path
      const newFS = currentFS.create(path, 'directory');
      if (!newFS) {
        print(`'${path}': no such file or directory`);
        return { system: { ...system, fileSystem: currentFS }, success: false };
      }
      currentFS = newFS;
    }

    return { system: { ...system, fileSystem: currentFS }, success: true };
  };
}
