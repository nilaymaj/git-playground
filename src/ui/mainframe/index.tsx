import * as React from 'react';
import { Mosaic, MosaicParent } from 'react-mosaic-component';
import FileSystemPane from '../panes/files-manager';
import RepositoryViewerPane from '../panes/repository-viewer';
import StagingAreaPane from '../panes/staging-area';
import TerminalPane from '../panes/terminal';
import { SandboxContext } from './providers/sandbox-provider';

const ELEMENT_MAP: { [key: string]: JSX.Element } = {
  'file-system': <FileSystemPane />,
  'staging-area': <StagingAreaPane />,
  'repository-view': <RepositoryViewerPane />,
  terminal: <TerminalPane />,
};

const defaultLayout: MosaicParent<string> = {
  direction: 'row',
  splitPercentage: 25,
  first: 'file-system',
  second: {
    direction: 'column',
    splitPercentage: 60,
    first: {
      direction: 'row',
      splitPercentage: 40,
      first: 'staging-area',
      second: 'repository-view',
    },
    second: 'terminal',
  },
};

export const Mainframe = () => {
  const sandboxManager = React.useContext(SandboxContext);

  if (!sandboxManager.value) return null;

  return (
    <Mosaic<string>
      className={'pane-mosaic'}
      renderTile={(id) => ELEMENT_MAP[id]}
      initialValue={defaultLayout}
    />
  );
};
