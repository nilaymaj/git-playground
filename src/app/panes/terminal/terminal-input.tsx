import * as React from 'react';

type Props = {
  onInput: (input: string) => void;
};

export const TerminalInput = (props: Props) => {
  const [input, setInput] = React.useState('');
  const { onInput } = props;

  const changeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  // Set up event listener for Enter key
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      const trimmedInput = input.trim();
      if (trimmedInput === '') return;
      setInput('');
      onInput(trimmedInput);
    };
    document.addEventListener('keyup', handler);
    return () => document.removeEventListener('keyup', handler);
  }, [input, onInput]);

  return (
    <div className='terminal-input'>
      <span className='prompt'>{'>'}</span>
      <input value={input} onChange={changeInput} className='input' />
    </div>
  );
};
