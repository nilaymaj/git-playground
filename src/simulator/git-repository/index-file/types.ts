import { FileSystemPath } from '../../file-system';
import SortedArray from '../../utils/sorted-array';
import { GitObjectAddress } from '../object-storage/types';

export interface IndexFileItem {
  objectHash: GitObjectAddress;
}

export type IndexFile = SortedArray<FileSystemPath, IndexFileItem>;
