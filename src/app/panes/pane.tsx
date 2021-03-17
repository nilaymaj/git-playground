import clsx from 'classnames';

type Props = {
  children: React.ReactNode;
  accentColor?: string;
  title?: string;
  className?: string;
};

const Pane = (props: Props) => {
  const paneClass = clsx('pane', props.className);

  return (
    <div className='pane-wrapper'>
      <div className={paneClass} style={{ borderColor: props.accentColor }}>
        {props.title && (
          <div
            className='pane-header'
            style={{ backgroundColor: props.accentColor }}
          >
            {props.title}
          </div>
        )}
        <div className='pane-body'>{props.children}</div>
      </div>
    </div>
  );
};

export default Pane;
