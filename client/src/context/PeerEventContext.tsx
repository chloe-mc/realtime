import React from 'react';
import { PeerEventService } from '../services/peer-event-service';

type Props = {
  children: React.ReactElement;
};

type PeerEventContextValue = PeerEventService;

const PeerEventContext = React.createContext<PeerEventContextValue>(
  null as any
);

const createPeerEventProvider =
  (): React.FC<Props> =>
  ({ children }) => {
    return (
      <PeerEventContext.Provider value={new PeerEventService()}>
        {children}
      </PeerEventContext.Provider>
    );
  };

const usePeerEvents = () => {
  const context = React.useContext(PeerEventContext);

  if (!context) {
    throw new Error(
      '`usePeerEvents` must be used within a `<PeerEventContext.Provider>`'
    );
  }

  return context;
};

export { createPeerEventProvider, usePeerEvents };
