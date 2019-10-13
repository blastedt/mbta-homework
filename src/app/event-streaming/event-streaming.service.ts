import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable()
export class EventStreamingService {

  constructor() { }

  /**
   * Turns an event-stream server source into an RxJS Observable
   * @param url url to hit
   * @param { params } query parameters (structure mirrors HttpClient argument structure)
   */
  stream<T extends { id: any }>(url: string, { params }): Observable<T[]> {
    let withParams = url + '?';
    for (const [key, param] of Object.entries(params)) {
      withParams += key + '=' + param + '&';
    }
    return Observable.create(observer => {
      // kind of like promise-ifying a callback, but more complicated
      const source: EventSource = new EventSource(withParams);
      let store: T[] = [];
      source.addEventListener('reset', (message: MessageEvent) => {
        store = JSON.parse(message.data);
        observer.next(store);
      });
      source.addEventListener('add', (message: MessageEvent) => {
        const added: T = JSON.parse(message.data);
        store.push(added);
        observer.next(store);
      });
      source.addEventListener('update', (message: MessageEvent) => {
        const updated: T = JSON.parse(message.data);
        const index = store.findIndex(element => element.id === updated.id);
        store[index] = updated;
        observer.next(store);
      });
      source.addEventListener('remove', (message: MessageEvent) => {
        const updated: T = JSON.parse(message.data);
        const index = store.findIndex(element => element.id === updated.id);
        store.splice(index, 1);
        observer.next(store);
      });

      return () => source.close(); // rxjs teardown function
    })
  }
}
