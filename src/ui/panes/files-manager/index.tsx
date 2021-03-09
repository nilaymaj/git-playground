import { useFileSystem } from '../../mainframe/providers/sandbox-provider';
import Pane from '../pane';

type Props = {};

const FileSystemPane = (props: Props) => {
  const fileSystem = useFileSystem();

  return (
    <Pane title='File System' accentColor='green'>
      <pre>{JSON.stringify(fileSystem, undefined, 2)}</pre>
    </Pane>
  );
};

export default FileSystemPane;
