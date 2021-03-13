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
  name = 'create';
  options = createOptions;

  parse = (args: string[]) => {
    return args.map(parsePathString);
  };

  execute = (
    system: SandboxState,
    print: (text: string) => void,
    opts: CommandOptionValues<CreateOptions>,
    args: string[]
  ) => {
    if (opts.throwErr) print('throwErr was passed!');
    const paths = this.parse(args);
    console.log(paths);
    if (paths.length === 0) {
      console.log('no file paths provided');
      print('no file paths provided');
      return { system, success: false };
    }

    let currentFS = system.fileSystem;
    for (const path of paths) {
      const newFS = createItemAt(currentFS, path, 'file');
      if (!newFS) {
        print(`path "${path}" does not exist`);
        return { system: { ...system, fileSystem: currentFS }, success: false };
      }
      currentFS = newFS;
    }
    const newSystem = { ...system, fileSystem: currentFS };
    return { system: newSystem, success: true };
  };
}

export default CreateCommand;
