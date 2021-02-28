type Props = {};

const TerminalPane = (props: Props) => {
  return (
    <div className='terminal-pane'>
      <h1>Terminal</h1>
      <pre>{JSON.stringify('temp')}</pre>
    </div>
  );
};

export default TerminalPane;
