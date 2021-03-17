import { useFileSystem } from '../../mainframe/providers/sandbox-provider';
import Pane from '../pane';
import { FileSystemView } from './file-system-view';

type Props = {};

const FileSystemPane = (props: Props) => {
  const fileSystem = useFileSystem();

  return (
    <Pane title='File System' accentColor='green'>
      <FileSystemView fileSystem={fileSystem} />
    </Pane>
  );
};

export default FileSystemPane;
