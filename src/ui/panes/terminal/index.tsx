import * as React from 'react';
import Terminal from '../../../simulator/terminal';
import { SandboxContext } from '../../mainframe/providers/sandbox-provider';
import Pane from '../pane';
import { pushInput, startTerminal } from './terminal';
import { TerminalData } from './terminal-data';
import { TerminalInput } from './terminal-input';

const terminalObj = new Terminal();

const TerminalPane = () => {
  const system = React.useContext(SandboxContext).value;
  const terminalRef = React.useRef(terminalObj);
  const [terminalHistory, setTerminalHistory] = React.useState(startTerminal());
  if (!system) throw new Error('Terminal running without sandbox!');

  React.useEffect(() => {
    // @ts-ignore
    global.system = system;
    // @ts-ignore
    global.terminal = terminalRef.current;
  }, [system]);

  /**
   * Execute the user input and add it to the terminal history
   */
  const executeInput = (input: string) => {
    const terminal = terminalRef.current;
    terminal.execute(input, system);
    const newData = pushInput(terminalHistory, input, '> ');
    setTerminalHistory(newData);
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
