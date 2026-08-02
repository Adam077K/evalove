import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { connectWs, disconnectWs } from './ws';

export default function App() {
  useEffect(() => {
    connectWs();
    return () => disconnectWs();
  }, []);

  return <Layout />;
}
