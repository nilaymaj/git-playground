import {
  Command,
  CommandExecReturn,
  CommandOptions,
  CommandOptionsProfile,
  CommandOptionValues,
} from '../types';
import { bumpFileVersionAt } from '../../file-system/index';
import { parsePathString } from '../../utils/path-utils';
import { SandboxState } from '../../types';

interface EditOptions extends CommandOptionsProfile {}

const editOptions: CommandOptions<EditOptions> = {};

/**
 * Bumps the file version of files at specified paths.
 */
export default class EditCommand implements Command<EditOptions> {
  name = 'edit';
  options = editOptions;

  execute = (
    system: SandboxState,
    print: (text: string) => void,
    _opts: CommandOptionValues<EditOptions>,
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
      // Bump file at current path
      const newFS = bumpFileVersionAt(currentFS, path);
      if (!newFS) {
        print(`'path' is not a file`);
        return { system: { ...system, fileSystem: currentFS }, success: false };
      }
      currentFS = newFS;
    }

    return { system: { ...system, fileSystem: currentFS }, success: true };
  };
}
