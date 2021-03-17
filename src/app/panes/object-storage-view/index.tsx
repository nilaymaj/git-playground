import { useRepository } from '../../mainframe/providers/sandbox-provider';
import { EmptyPrompt } from '../../ui/empty-prompt';
import Pane from '../pane';
import { ObjectRow } from './object-row';

type Props = {};

const ObjectStorageView = (props: Props) => {
  const repository = useRepository();
  const objectStorage = repository.objectStorage;
  const objects = [...objectStorage.entries()];
  const isEmpty = objects.length === 0;

  return (
    <Pane title='Object Storage' accentColor='purple'>
      <div className='object-storage-root'>
        {isEmpty ? (
          <EmptyPrompt message='No objects yet.' color='purple' />
        ) : (
          objects.map(([hash, object]) => (
            <ObjectRow key={hash} hash={hash} object={object} />
          ))
        )}
      </div>
    </Pane>
  );
};

export default ObjectStorageView;
