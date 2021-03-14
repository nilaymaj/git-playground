import { getPathString } from '../../../simulator/utils/path-utils';
import { useRepository } from '../../mainframe/providers/sandbox-provider';
import Pane from '../pane';
import { IndexItemRow } from './index-item-row';

type Props = {};

export const IndexFileView = (props: Props) => {
  const repository = useRepository();
  const indexFile = repository.indexFile;
  const indexItems = indexFile.items.toArray();

  return (
    <Pane title='Index File' accentColor='DarkBlue'>
      <div className='index-file-root'>
        {indexItems.map((item) => (
          <IndexItemRow
            key={getPathString(item.key)}
            path={item.key}
            indexItem={item.value}
          />
        ))}
      </div>
    </Pane>
  );
};
