import { getPathString } from '../../../simulator/utils/path-utils';
import { useRepository } from '../../mainframe/providers/sandbox-provider';
import { EmptyPrompt } from '../../ui/empty-prompt';
import Pane from '../pane';
import { IndexItemRow } from './index-item-row';

type Props = {};

export const IndexFileView = (props: Props) => {
  const repository = useRepository();
  const indexFile = repository.indexFile;
  const indexItems = indexFile.entries();
  const isEmptyIndex = indexItems.length === 0;

  return (
    <Pane title='Index File' accentColor='DarkBlue'>
      <div className='index-file-root'>
        {isEmptyIndex ? (
          <EmptyPrompt message='The index file is empty!' color='DarkBlue' />
        ) : (
          indexItems.map((item) => (
            <IndexItemRow
              key={getPathString(item.path)}
              path={item.path}
              indexItem={item.entry}
            />
          ))
        )}
      </div>
    </Pane>
  );
};
