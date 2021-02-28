import { StagingArea } from '../../simulator/staging-area';

type Props = {
  stagingArea: StagingArea;
};

const StagingAreaPane = (props: Props) => {
  return (
    <div className='staging-area-pane'>
      <h1>Staging Area</h1>
      <pre>{JSON.stringify(props.stagingArea)}</pre>
    </div>
  );
};

export default StagingAreaPane;
