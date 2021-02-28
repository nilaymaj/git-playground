import { FileSystemPath } from '../../file-system/types';
import { SortedArray } from '../../utils/sorted-array';
import { GitObjectAddress } from '../object-storage/types';

export interface IndexFileItem {
  lastModified: Date;
  objectHash: GitObjectAddress;
}

export type IndexFile = SortedArray<FileSystemPath, IndexFileItem>;
