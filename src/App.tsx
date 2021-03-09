import './App.css';
import { SandboxProvider } from './ui/mainframe/providers/sandbox-provider';
import { Mainframe } from './ui/mainframe';

function App() {
  return (
    <div className='App'>
      <SandboxProvider>
        <Mainframe />
      </SandboxProvider>
    </div>
  );
}

export default App;
