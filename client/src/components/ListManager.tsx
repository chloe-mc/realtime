import localforage from 'localforage';
import React from 'react';
import { CLIENT_URL, SERVER_URL } from '../App';

type Props = {
  onListChange?: (docId: string) => void;
};

const ListManager: React.FC<Props> = ({ onListChange }) => {
  const [lists, setLists] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const getLists = async () => {
      const localLists = await localforage.keys();
      const serverLists = await fetch(`${SERVER_URL}/lists`).then((res) =>
        res.json()
      );
      setLists(new Set([...localLists, ...serverLists].filter((l) => l)));
    };
    getLists();
  }, []);

  return (
    <>
      <div style={{ padding: '5px' }}>To Do Lists</div>
      <select
        value={window.location.hash.replace(/^#/, '')}
        onChange={(e) => {
          window.location.replace(`${CLIENT_URL}/#${e.target.value}`);
          onListChange && onListChange(e.target.value);
        }}
      >
        {Array.from(lists).map((list) => (
          <option key={list}>{list}</option>
        ))}
      </select>
    </>
  );
};

export { ListManager };
