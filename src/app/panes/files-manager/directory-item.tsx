import * as React from 'react';
import { FileSystemInternalNode } from '../../../simulator/file-system';
import { IoChevronForward, IoChevronDown } from 'react-icons/io5';
import { DirectoryChildren } from './directory-children';

type SingleDirectoryItemProps = {
  name: string;
  expanded: boolean;
  onToggleExpand: () => void;
};

const SingleDirectoryItem = (props: SingleDirectoryItemProps) => {
  return (
    <div className='directory-item-row' onClick={props.onToggleExpand}>
      <div className='icon'>
        {props.expanded ? <IoChevronDown /> : <IoChevronForward />}
      </div>
      <div className='name'>{props.name}</div>
    </div>
  );
};

type Props = {
  name: string;
  directory: FileSystemInternalNode;
};

export const DirectoryItem = (props: Props) => {
  const [expanded, setExpanded] = React.useState(true);
  return (
    <div className='directory-item'>
      <SingleDirectoryItem
        name={props.name}
        expanded={expanded}
        onToggleExpand={() => setExpanded((e) => !e)}
      />
      <DirectoryChildren collapsed={!expanded} directory={props.directory} />
    </div>
  );
};
