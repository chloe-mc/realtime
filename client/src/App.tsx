import React from 'react';
import * as Automerge from 'automerge';
import localforage from 'localforage';

type Todo = {
  text: string;
  done: boolean;
};

let docId = window.location.hash.replace(/^#/, '');
let channel = new BroadcastChannel(docId);

function App() {
  const [doc, setDoc] = React.useState<Automerge.Doc<any>>();
  const [inputValue, setInputValue] = React.useState<string>('');

  React.useEffect(() => {
    // const initDoc = Automerge.init();
    const getDocument = async () => {
      const binary = await localforage.getItem<Automerge.BinaryDocument>(docId);
      if (binary) {
        setDoc(Automerge.load(binary));
      }
    };
    // const loadFromRemote = async () => {
    //   const response = await fetch(`http://localhost:5000/${docId}`);
    //   if (response.status !== 200)
    //     throw new Error('No saved draft for doc with id=' + docId);
    //   const respbuffer = await response.arrayBuffer();
    //   if (respbuffer.byteLength === 0)
    //     throw new Error('No saved draft for doc with id=' + docId);
    //   const view = new Uint8Array(respbuffer);
    //   let newDoc = Automerge.merge(initDoc, Automerge.load(view as any));
    //   setDoc(newDoc);
    // };

    getDocument();
    // loadFromRemote();
  }, []);

  React.useEffect(() => {
    channel.onmessage = (ev: MessageEvent) => {
      if (doc) {
        let newDoc = Automerge.merge(doc, Automerge.load(ev.data));
        setDoc(newDoc);
      }
    };
  }, [doc]);

  function saveToRemote(docId: string, binary: Automerge.BinaryDocument) {
    fetch(`http://localhost:5000/${docId}`, {
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
    channel.postMessage(binary);
    saveToRemote(docId, binary);
  };

  const addItem = (text: string) => {
    let newDoc = Automerge.change(doc, (doc) => {
      if (!doc.items) doc.items = [];
      doc.items.push({ text, done: false });
    });
    updateDoc(newDoc);
  };

  const toggle = (index: number) => {
    let newDoc = Automerge.change(doc, (doc) => {
      doc.items[index].done = !doc.items[index].done;
    });
    updateDoc(newDoc);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();
    if (inputValue) {
      addItem(inputValue);
      setInputValue('');
    }
  };

  return (
    <div>
      <ul id="todo-list">
        {doc?.items?.map((item: Todo, i: number) => (
          <li
            key={i}
            onClick={() => toggle(i)}
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
    </div>
  );
}

export default App;
