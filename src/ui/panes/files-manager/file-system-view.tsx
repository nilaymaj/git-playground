import { FileSystem } from '../../../simulator/file-system/types';
import { DirectoryChildren } from './directory-children';

type Props = {
  fileSystem: FileSystem;
};

export const FileSystemView = (props: Props) => {
  return (
    <div className='file-system-root'>
      <DirectoryChildren directory={props.fileSystem} />
    </div>
  );
};
