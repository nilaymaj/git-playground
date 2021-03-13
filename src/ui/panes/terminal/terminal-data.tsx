import { TerminalHistory } from './terminal';
import TerminalRow from './terminal-row';

type Props = {
  data: TerminalHistory;
};

export const TerminalData = (props: Props) => {
  return (
    <div className='terminal-data'>
      {Array.from({ length: props.data.size }).map((_, idx) => {
        const dataLine = props.data.get(idx);
        if (!dataLine) throw new Error(`This shouldn't happen.`);
        return (
          <TerminalRow
            key={idx}
            text={dataLine.text}
            prompt={dataLine.prompt}
          />
        );
      })}
    </div>
  );
};
