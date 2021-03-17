import { GitObject } from '../../../simulator/git-repository/object-storage/types';
import { MonospaceChip } from '../../ui/monospace-chip';

const getDisplayString = (object: GitObject) => {
  if (object.type === 'blob') {
    const shortContentToken = object.fileData.contentToken.slice(-12);
    const fileVersion = object.fileData.version;
    return `blob: ${shortContentToken}, v${fileVersion}`;
  } else if (object.type === 'tree') {
    const numChildren = object.items.size;
    return `tree: ${numChildren} children`;
  } else {
    const commitMessage = object.message;
    return `commit: ${commitMessage}`;
  }
};

type Props = {
  hash: string;
  object: GitObject;
};

export const ObjectRow = (props: Props) => {
  return (
    <div className='object-row'>
      <div className='hash' title={props.hash}>
        <MonospaceChip
          text={props.hash.slice(-7)}
          color='purple'
          hint={props.hash}
          onClick={() => navigator.clipboard.writeText(props.hash)}
        />
      </div>
      <div className='object'>{getDisplayString(props.object)}</div>
    </div>
  );
};
