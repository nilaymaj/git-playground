import { FileSystem } from '../../simulator/file-system/types';

type Props = {
  fileSystem: FileSystem;
};

const FilesManagerPane = (props: Props) => {
  return (
    <div className='files-manager-pane'>
      <h1>Files Manager</h1>
      <pre>{JSON.stringify(props.fileSystem)}</pre>
    </div>
  );
};

export default FilesManagerPane;
