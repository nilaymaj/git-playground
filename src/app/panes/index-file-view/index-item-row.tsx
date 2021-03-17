import { FileSystemPath } from '../../../simulator/file-system';
import { IndexFileItem } from '../../../simulator/git-repository/index-file/types';
import { getPathString } from '../../../simulator/utils/path-utils';
import { MonospaceChip } from '../../ui/monospace-chip';

type Props = {
  path: FileSystemPath;
  indexItem: IndexFileItem;
};

export const IndexItemRow = (props: Props) => {
  const shortHash = props.indexItem.objectHash.slice(-7);

  return (
    <div className='index-item-row'>
      <div className='hash'>
        <MonospaceChip
          color='darkblue'
          text={shortHash}
          hint={props.indexItem.objectHash}
          onClick={() =>
            navigator.clipboard.writeText(props.indexItem.objectHash)
          }
        />
      </div>
      <div className='path'>{getPathString(props.path)}</div>
    </div>
  );
};
