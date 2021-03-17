import './App.css';
import { SandboxProvider } from './app/mainframe/providers/sandbox-provider';
import { Mainframe } from './app/mainframe';

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
