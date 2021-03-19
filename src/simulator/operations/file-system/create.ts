import { Command, CommandOptions, CommandOptionsProfile } from '../types';
import { parsePathString } from '../../utils/path-utils';
import { errorState, successState } from '../utils';

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

const createCommand: Command<CreateOptions> = {
  name: 'create',
  options: createOptions,

  execute: (system, print, opts, args) => {
    if (opts.throwErr) print('throwErr was passed!');
    const paths = args.map(parsePathString);
    if (paths.length === 0) {
      print('no file paths provided');
      return errorState(system);
    }

    let currentFS = system.fileSystem;
    for (const path of paths) {
      const newFS = currentFS.create(path, 'file');
      if (!newFS) {
        print(`path "${path}" does not exist`);
        return errorState(system, currentFS);
      }
      currentFS = newFS;
    }

    return successState(system, currentFS);
  },
};

export default createCommand;
