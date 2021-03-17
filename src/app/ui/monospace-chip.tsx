import clsx from 'classnames';

type Props = {
  color: string;
  text: string;
  hint?: string;
  onClick?: () => void;
  className?: string;
};

export const MonospaceChip = (props: Props) => {
  const classes = clsx('chip', props.className, props.onClick && 'button');
  return (
    <div
      className={classes}
      style={{ backgroundColor: props.color }}
      onClick={props.onClick}
      title={props.hint}
    >
      {props.text}
    </div>
  );
};
