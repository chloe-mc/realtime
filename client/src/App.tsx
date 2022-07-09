import React from 'react';
import { ListManager } from './components/ListManager';
import { List } from './components/List';
import { createPeerEventProvider } from './context/PeerEventContext';

export const CLIENT_URL = 'http://localhost:3000';
export const SERVER_URL = 'http://localhost:5000';

const PeerEventProvider = createPeerEventProvider();

function App() {
  const [docId, setDocId] = React.useState<string>(
    window.location.hash.replace(/^#/, '')
  );

  return (
    <PeerEventProvider>
      <>
        <ListManager onListChange={setDocId} />
        <List docId={docId} />
      </>
    </PeerEventProvider>
  );
}

export default App;
