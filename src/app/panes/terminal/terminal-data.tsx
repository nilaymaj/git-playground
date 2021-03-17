import * as React from 'react';
import { TerminalHistory } from './terminal';
import TerminalRow from './terminal-row';

type Props = {
  data: TerminalHistory;
};

export const TerminalData = (props: Props) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when history changes
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [props.data]);

  return (
    <div className='terminal-data' ref={(r) => (containerRef.current = r)}>
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
