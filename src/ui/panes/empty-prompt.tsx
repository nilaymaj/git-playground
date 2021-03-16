type Props = {
  message: string;
  color: string;
};

export const EmptyPrompt = (props: Props) => {
  return (
    <div className='empty-prompt' style={{ color: props.color }}>
      <p>{props.message}</p>
    </div>
  );
};
