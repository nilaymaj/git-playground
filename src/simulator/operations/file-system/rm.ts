import {
  Command,
  CommandExecReturn,
  CommandOptions,
  CommandOptionsProfile,
  CommandOptionValues,
} from '../types';
import { SandboxState } from '../../types';
import { parsePathString } from '../../utils/path-utils';
import Tree from '../../utils/tree';
import { errorState, successState } from '../utils';
import { Apocalypse } from '../../utils/errors';

interface RmOptions extends CommandOptionsProfile {
  recursive: 'boolean';
}

const rmOptions: CommandOptions<RmOptions> = {
  recursive: {
    shortLetter: 'r',
    description: 'delete recursively',
    valueType: 'boolean',
  },
};

/**
 * Delete files or directories at specified paths, similar to UNIX `rm`.
 */
export default class RmCommand implements Command<RmOptions> {
  name = 'rm';
  options = rmOptions;

  execute = (
    system: SandboxState,
    print: (text: string) => void,
    opts: CommandOptionValues<RmOptions>,
    args: string[]
  ): CommandExecReturn => {
    const paths = args.map(parsePathString);
    if (paths.length === 0) {
      print('missing file operand');
      return errorState(system);
    }

    let currentFS = system.fileSystem;
    for (const path of paths) {
      const node = currentFS.get(path);
      if (!node) {
        // Path does not exist
        print(`'${path}': no such file or directory`);
        return errorState(system, currentFS);
      } else if (!Tree.isLeafNode(node) && !opts.recursive) {
        // Path is directory, and `recursive` not provided
        print(`'${path}': is a directory`);
        return errorState(system, currentFS);
      }

      // Remove item and update FS
      const newFS = currentFS.delete(path);
      if (!newFS) throw new Apocalypse();
      currentFS = newFS;
    }

    return successState(system, currentFS);
  };
}
