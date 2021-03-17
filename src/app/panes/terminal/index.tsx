import * as React from 'react';
import Terminal from '../../../simulator/terminal';
import { SandboxContext } from '../../mainframe/providers/sandbox-provider';
import Pane from '../pane';
import { pushInput, pushOutput, startTerminal } from './terminal';
import { TerminalData } from './terminal-data';
import { TerminalInput } from './terminal-input';

const terminalObj = new Terminal();

const TerminalPane = () => {
  const sandboxManager = React.useContext(SandboxContext);
  const terminalRef = React.useRef(terminalObj);
  const [terminalHistory, setTerminalHistory] = React.useState(startTerminal());

  /**
   * Execute the user input and add it to the terminal history
   */
  const executeInput = (input: string) => {
    const terminal = terminalRef.current;
    if (!sandboxManager.value) throw new Error(`command executed w/o sandbox`);
    setTerminalHistory((oldHistory) => pushInput(oldHistory, input, '>'));
    if (input === 'clear') return setTerminalHistory(startTerminal());

    const { system: newSystem } = terminal.execute(
      input,
      sandboxManager.value,
      (text) => setTerminalHistory((h) => pushOutput(h, text))
    );

    sandboxManager.setSandbox(newSystem);
  };

  return (
    <Pane className='terminal-pane'>
      <div className='terminal-container'>
        <TerminalData data={terminalHistory} />
        <TerminalInput onInput={executeInput} />
      </div>
    </Pane>
  );
};

export default TerminalPane;
