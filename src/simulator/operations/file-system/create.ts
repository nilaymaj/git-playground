import {
  Command,
  CommandOptions,
  CommandOptionsProfile,
  CommandOptionValues,
} from '../types';
import { createItemAt } from '../../file-system/index';
import { SandboxState } from '../../types';
import { parsePathString } from '../../utils/path-utils';

interface CreateOptions extends CommandOptionsProfile {
  throwErr: 'boolean';
}

const createOptions: CommandOptions<CreateOptions> = {
  throwErr: {
    description: 'Print a fake error to the console',
    shortLetter: 'e',
    valueType: 'boolean',
  },
};

/**
 * Creates new files at specified paths, similar to UNIX `touch`.
 * Returns boolean array denoting success state of each `create` operation.
 */
class CreateCommand implements Command<CreateOptions> {
  name = 'cp';
  options = createOptions;

  parse = (args: string[]) => {
    return args.map(parsePathString);
  };

  execute = (
    system: SandboxState,
    opts: CommandOptionValues<CreateOptions>,
    args: string[]
  ) => {
    if (opts.throwErr) console.error('throwErr was passed!');
    const paths = this.parse(args);
    if (paths.length === 0) return false;

    for (const path of paths) {
      const result = createItemAt(system.fileSystem, path, 'file');
      if (!result) return false;
    }
    return true;
  };
}

export default CreateCommand;
