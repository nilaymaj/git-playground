import { FileSystemPath } from '../../../simulator/file-system/types';
import { IndexFileItem } from '../../../simulator/git-repository/index-file/types';
import { getPathString } from '../../../simulator/utils/path-utils';

type Props = {
  path: FileSystemPath;
  indexItem: IndexFileItem;
};

export const IndexItemRow = (props: Props) => {
  const shortHash = props.indexItem.objectHash.slice(-7);

  return (
    <div className='index-item-row'>
      <div className='hash'>{shortHash}</div>
      <div className='path'>{getPathString(props.path)}</div>
    </div>
  );
};
