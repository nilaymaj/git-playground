import { FileBlob } from '../../../simulator/file-system/types';
import { IoDocumentOutline } from 'react-icons/io5';

type Props = {
  name: string;
  file: FileBlob;
};

export const FileItem = (props: Props) => {
  return (
    <div className='file-item'>
      <div className='icon'>
        <IoDocumentOutline />
      </div>
      <div className='name'>{props.name}</div>
    </div>
  );
};
