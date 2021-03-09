import Pane from '../pane';

const TerminalPane = () => {
  return (
    <Pane className='terminal-pane'>
      <pre>{JSON.stringify('terminal!')}</pre>
    </Pane>
  );
};

export default TerminalPane;
