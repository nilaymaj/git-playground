import { MosaicParent } from 'react-mosaic-component';

/**
 * A layout similar to VS Code:
 * - Full-height file manager on left
 * - Bottom-half terminal on right
 * - Two horizontal-split panes in top-right space
 */
export const vsCodeLayout: MosaicParent<string> = {
  direction: 'row',
  splitPercentage: 25,
  first: 'file-system',
  second: {
    direction: 'column',
    splitPercentage: 60,
    first: {
      direction: 'row',
      splitPercentage: 40,
      first: 'index-file-view',
      second: 'object-storage-view',
    },
    second: 'terminal',
  },
};

/**
 * Ultra-multitasking view:
 * - Terminal at top-right
 * - File manager at bottom-right
 * and four panes on left
 */
export const multitaskerLayout: MosaicParent<string> = {
  direction: 'row',
  splitPercentage: 75,
  first: {
    direction: 'column',
    splitPercentage: 50,
    first: {
      direction: 'row',
      first: 'index-file-view',
      second: 'object-storage-view',
    },
    second: {
      direction: 'row',
      first: 'staging-area',
      second: 'repository-view',
    },
  },
  second: {
    direction: 'column',
    splitPercentage: 50,
    first: 'terminal',
    second: 'file-system',
  },
};
