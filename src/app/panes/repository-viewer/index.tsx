import { useRepository } from '../../mainframe/providers/sandbox-provider';
import Pane from '../pane';

const RepositoryViewerPane = () => {
  const repository = useRepository();

  return (
    <Pane title='Repository View' accentColor='red'>
      <pre>{JSON.stringify(repository, undefined, 2)}</pre>
    </Pane>
  );
};

export default RepositoryViewerPane;
