import clsx from 'classnames';

type Props = {
  text: string;
  prompt?: string;
};

/**
 * A single fixed-height row, intended for a single line
 * of terminal input or output.
 */
const TerminalRow = (props: Props) => {
  const classes = clsx('terminal-row', { prompt: !!props.prompt });

  return (
    <div className={classes}>
      {props.prompt && (
        <span className='terminal-row-prompt'>{props.prompt}</span>
      )}
      {props.text}
    </div>
  );
};

export default TerminalRow;
