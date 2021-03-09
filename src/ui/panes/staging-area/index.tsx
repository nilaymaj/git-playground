import { useRepository } from '../../mainframe/providers/sandbox-provider';
import Pane from '../pane';

const StagingAreaPane = () => {
  const repository = useRepository();

  return (
    <Pane title='Staging Area' accentColor='blue'>
      <pre>{JSON.stringify(repository, undefined, 2)}</pre>
    </Pane>
  );
};

export default StagingAreaPane;
