import { FileSystemPath } from '../file-system/types';
import { isPrefix } from './path-utils';

test('Is path1 prefix of path2', () => {
  const prefix1 = ['a', 'b', 'c'];
  const fullPath1 = ['a', 'b', 'c', 'd'];
  expect(isPrefix(fullPath1, prefix1)).toBe(true);

  const prefix2 = ['a', 'b', 'c'];
  const fullPath2 = ['a', 'b', 'c'];
  expect(isPrefix(fullPath2, prefix2)).toBe(true);

  const prefix3 = ['a', 'b', 'c'];
  const fullPath3 = ['a', 'b'];
  expect(isPrefix(fullPath3, prefix3)).toBe(false);

  const prefix4 = ['a1', 'b', 'c'];
  const fullPath4 = ['a2', 'b', 'c', 'd'];
  expect(isPrefix(fullPath4, prefix4)).toBe(false);

  const prefix5: FileSystemPath = [];
  const fullPath5 = ['a', 'b'];
  expect(isPrefix(fullPath5, prefix5)).toBe(true);
});
