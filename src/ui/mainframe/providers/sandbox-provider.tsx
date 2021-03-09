import * as React from 'react';
import { createNewSandbox } from '../../../simulator';
import { SandboxState } from '../../../simulator/types';

const sampleSandbox = createNewSandbox();
export const SandboxContext = React.createContext<SandboxManager>({
  value: sampleSandbox,
});

type SandboxManager = {
  value: SandboxState | null;
};

type Props = {
  children: JSX.Element;
};

/**
 * Stores and maintains the currently open sandbox.
 */
export const SandboxProvider = (props: Props) => {
  const [sandbox, setSandbox] = React.useState<SandboxState | null>(null);

  // Initialize sandbox
  React.useEffect(() => {
    setSandbox(createNewSandbox());
  }, []);

  const sandboxManager = React.useMemo(
    () => ({
      value: sandbox,
    }),
    [sandbox]
  );

  return (
    <SandboxContext.Provider value={sandboxManager}>
      {props.children}
    </SandboxContext.Provider>
  );
};

/**
 * Returns the file system of current sandbox.
 * Avoid using where sandbox may not be set.
 */
export const useFileSystem = () => {
  const { value } = React.useContext(SandboxContext);
  return (value as SandboxState).fileSystem;
};

/**
 * Returns the repository of current sandbox.
 * Avoid using where sandbox may not be set.
 */
export const useRepository = () => {
  const { value } = React.useContext(SandboxContext);
  return (value as SandboxState).repository;
};
