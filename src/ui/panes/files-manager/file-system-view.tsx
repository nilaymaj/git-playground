import { FileSystem } from '../../../simulator/file-system/types';
import { DirectoryChildren } from './directory-children';

type Props = {
  fileSystem: FileSystem;
};

export const FileSystemView = (props: Props) => {
  const isEmptyFS = props.fileSystem.size === 0;

  return (
    <div className='file-system-root'>
      {!isEmptyFS ? (
        <DirectoryChildren directory={props.fileSystem} />
      ) : (
        <p style={{ padding: '1em 2em' }}>Create a file or directory!</p>
      )}
    </div>
  );
};
