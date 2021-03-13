import clsx from 'classnames';
import { FileSystemInternalNode } from '../../../simulator/file-system/types';
import { isLeafNode } from '../../../simulator/utils/tree';
import { DirectoryItem } from './directory-item';
import { FileItem } from './file-item';

type DirectoryChildrenProps = {
  directory: FileSystemInternalNode;
  collapsed?: boolean;
};

export const DirectoryChildren = (props: DirectoryChildrenProps) => {
  const children = [...props.directory.entries()];
  const classes = clsx('directory-children', { collapse: props.collapsed });

  return (
    <div className={classes}>
      {children.map((child) => {
        const [childName, childNode] = child;
        if (isLeafNode(childNode))
          return <FileItem key={childName} name={childName} file={childNode} />;
        return (
          <DirectoryItem
            key={childName}
            name={childName}
            directory={childNode}
          />
        );
      })}
    </div>
  );
};
