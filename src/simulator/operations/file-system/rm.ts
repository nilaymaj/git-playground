import {
  Command,
  CommandExecReturn,
  CommandOptions,
  CommandOptionsProfile,
  CommandOptionValues,
} from '../types';
import { deleteItemAt, getItemAt } from '../../file-system/index';
import { SandboxState } from '../../types';
import { parsePathString } from '../../utils/path-utils';
import Tree from '../../utils/tree';

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
      return { system, success: false };
    }

    let currentFS = system.fileSystem;
    for (const path of paths) {
      const node = getItemAt(currentFS, path);
      if (!node) {
        // Path does not exist
        print(`'${path}': no such file or directory`);
        return { system: { ...system, fileSystem: currentFS }, success: false };
      } else if (!Tree.isLeafNode(node) && !opts.recursive) {
        // Path is directory, and `recursive` not provided
        print(`'${path}': is a directory`);
        return { system: { ...system, fileSystem: currentFS }, success: false };
      }

      // Remove item and update FS
      const newFS = deleteItemAt(currentFS, path);
      if (!newFS) throw new Error(`This shouldn't happen.`);
      currentFS = newFS;
    }

    return { system: { ...system, fileSystem: currentFS }, success: true };
  };
}
