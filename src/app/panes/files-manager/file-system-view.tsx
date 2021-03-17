import { FileSystem } from '../../../simulator/file-system';
import { EmptyPrompt } from '../../ui/empty-prompt';
import { DirectoryChildren } from './directory-children';

type Props = {
  fileSystem: FileSystem;
};

export const FileSystemView = (props: Props) => {
  const isEmptyFS = props.fileSystem._tree.size === 0;

  return (
    <div className='file-system-root'>
      {!isEmptyFS ? (
        <DirectoryChildren directory={props.fileSystem._tree} />
      ) : (
        <EmptyPrompt
          message='Create a file or directory from the terminal!'
          color='green'
        />
      )}
    </div>
  );
};
