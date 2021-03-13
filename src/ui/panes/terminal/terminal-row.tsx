type Props = {
  text: string;
  prompt?: string;
};

/**
 * A single fixed-height row, intended for a single line
 * of terminal input or output.
 */
const TerminalRow = (props: Props) => {
  return (
    <div className='terminal-row'>
      {props.prompt && (
        <span className='terminal-row-prompt'>{props.prompt}</span>
      )}
      {props.text}
    </div>
  );
};

export default TerminalRow;
