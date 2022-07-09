import React from 'react';
import * as Automerge from 'automerge';
import localforage from 'localforage';
import { SERVER_URL } from '../App';
import { usePeerEvents } from '../context/PeerEventContext';
import { useSubscription } from 'observable-hooks';

type Todo = {
  text: string;
  done: boolean;
};

type Doc = Automerge.Doc<any>;

type Props = {
  docId: string;
};

const loadFromRemote = async (docId: string): Promise<Doc | null> => {
  const response = await fetch(`${SERVER_URL}/${docId}`);
  if (response.status !== 200) {
    return null;
  }

  const respbuffer = await response.arrayBuffer();
  if (respbuffer.byteLength === 0) {
    return null;
  }

  return Automerge.load(new Uint8Array(respbuffer) as Automerge.BinaryDocument);
};

const List: React.FC<Props> = ({ docId }) => {
  const [doc, setDoc] = React.useState<Doc>();
  const [inputValue, setInputValue] = React.useState<string>('');
  const [peerEventService] = React.useState(usePeerEvents());

  function saveToRemote(docId: string, binary: Automerge.BinaryDocument) {
    fetch(`${SERVER_URL}/${docId}`, {
      body: binary,
      method: 'post',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    }).catch((err) => console.log(err));
  }

  const updateDoc = (newDoc: any) => {
    setDoc(newDoc);
    let binary = Automerge.save(newDoc);
    localforage
      .setItem<Automerge.BinaryDocument>(docId, binary)
      .catch((err) => console.log(err));
    saveToRemote(docId, binary);
  };

  useSubscription(peerEventService.subscribe(docId), (event) =>
    updateDoc(Automerge.load(event.doc))
  );

  React.useEffect(() => {
    const sync = (localDoc: Doc | null, peerDoc: Doc | null) => {
      if (!peerDoc && localDoc) {
        return updateDoc(localDoc);
      }

      if (!localDoc && peerDoc) {
        return updateDoc(peerDoc);
      }

      if (localDoc && peerDoc) {
        return updateDoc(Automerge.merge(localDoc, peerDoc));
      }

      return updateDoc(undefined);
    };

    const getDocument = async () => {
      const binary = await localforage.getItem<Automerge.BinaryDocument>(docId);
      const localDoc = binary ? (Automerge.load(binary) as Doc) : null;
      const serverDoc = await loadFromRemote(docId);
      sync(localDoc, serverDoc);
    };

    getDocument();
  }, [docId]);

  const addItem = (text: string) => {
    let newDoc = Automerge.change(doc, (doc) => {
      if (!doc.items) doc.items = [];
      doc.items.push({ text, done: false });
    });
    updateDoc(newDoc);
    if (newDoc) {
      peerEventService.emit(Automerge.save(newDoc));
    }
  };

  const toggleItem = (index: number) => {
    let newDoc = Automerge.change(doc, (doc) => {
      doc.items[index].done = !doc.items[index].done;
    });
    updateDoc(newDoc);
    if (newDoc) {
      peerEventService.emit(Automerge.save(newDoc));
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();
    if (inputValue) {
      addItem(inputValue);
      setInputValue('');
    }
  };

  return (
    <>
      <ul id="todo-list">
        {doc?.items?.map((item: Todo, i: number) => (
          <li
            key={i}
            onClick={() => toggleItem(i)}
            style={{
              cursor: 'pointer',
              textDecoration: item.done ? 'line-through' : '',
            }}
          >
            {item.text}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          id="new-todo"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </form>
    </>
  );
};

export { List };
