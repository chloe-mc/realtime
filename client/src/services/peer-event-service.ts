import { Subject, Observable, filter } from 'rxjs';
import * as Automerge from 'automerge';
import { v4 as uuid } from 'uuid';

type PeerEvent = {
  id: string;
  doc: Automerge.BinaryDocument;
};

export class PeerEventService {
  private channel?: BroadcastChannel;
  private lastEventId = '';

  constructor(private peerEvent$ = new Subject<PeerEvent>()) {}

  private _setChannel = (docId: string) => {
    this.channel = new BroadcastChannel(docId);
    this.channel.onmessage = (ev: MessageEvent) => {
      this.peerEvent$.next({ ...ev.data });
    };
  };

  private _skipOwnEvents = (e: PeerEvent) => e.id !== this.lastEventId;

  public subscribe = (docId: string): Observable<PeerEvent> => {
    this._setChannel(docId);
    return this.peerEvent$.pipe(filter(this._skipOwnEvents));
  };

  public emit = (doc: Automerge.BinaryDocument) => {
    this.lastEventId = uuid();
    this.channel?.postMessage({ doc, id: this.lastEventId });
  };
}
