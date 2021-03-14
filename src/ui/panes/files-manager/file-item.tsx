import { FileBlob } from '../../../simulator/file-system/types';
import { IoDocumentOutline } from 'react-icons/io5';

type Props = {
  name: string;
  file: FileBlob;
};

export const FileItem = (props: Props) => {
  const { contentToken, version } = props.file;
  const fileInfo = `${contentToken.slice(-12)} v${version}`;

  return (
    <div className='file-item'>
      <div className='icon'>
        <IoDocumentOutline />
      </div>
      <div className='name' title={fileInfo}>
        {props.name}
      </div>
    </div>
  );
};
