import * as React from 'react';
import { Mosaic } from 'react-mosaic-component';
import FileSystemPane from '../panes/files-manager';
import { IndexFileView } from '../panes/index-file-view';
import ObjectStorageView from '../panes/object-storage-view';
import RepositoryViewerPane from '../panes/repository-viewer';
import StagingAreaPane from '../panes/staging-area';
import TerminalPane from '../panes/terminal';
import { multitaskerLayout } from './layouts';
import { SandboxContext } from './providers/sandbox-provider';

const ELEMENT_MAP: { [key: string]: JSX.Element } = {
  'file-system': <FileSystemPane />,
  'staging-area': <StagingAreaPane />,
  'repository-view': <RepositoryViewerPane />,
  'object-storage-view': <ObjectStorageView />,
  'index-file-view': <IndexFileView />,
  terminal: <TerminalPane />,
};

export const Mainframe = () => {
  const sandboxManager = React.useContext(SandboxContext);

  if (!sandboxManager.value) return null;

  return (
    <Mosaic<string>
      className={'pane-mosaic'}
      renderTile={(id) => ELEMENT_MAP[id]}
      initialValue={multitaskerLayout}
    />
  );
};
