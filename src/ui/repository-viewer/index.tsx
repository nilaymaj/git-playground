type Props = {};

const RepositoryViewerPane = (props: Props) => {
  return (
    <div className='staging-area-pane'>
      <h1>Staging Area</h1>
      <pre>{JSON.stringify('temp')}</pre>
    </div>
  );
};

export default RepositoryViewerPane;
