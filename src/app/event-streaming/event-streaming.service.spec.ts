import { TestBed } from '@angular/core/testing';
import { EventStreamingService } from './event-streaming.service';
import { expect } from 'chai';
import { skip } from 'rxjs/operators';

fdescribe('EventStreamingService', () => {
  let originalEventSource;
  let service: EventStreamingService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventStreamingService]
    });

    originalEventSource = EventSource;
    (window as any).EventSource = MockEventSource;
    service = TestBed.get(EventStreamingService);
  });

  afterEach(() => {
    (window as any).EventSource = originalEventSource;
    MockEventSource.instances = [];
  });

  it('should interpret reset events', function (done) {
    const expected = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    service.stream('url', { params: {} }).subscribe(elements => {
      expect(elements).to.deep.equal(expected);
      done();
    }, fail); // fail if observable throws
    const mock = MockEventSource.instances[0];
    mock.dispatchEvent('reset', JSON.stringify(expected));
  });

  it('should interpret update events', function (done) {
    const initial = [{ id: 1 }, { id: 2 }, { id: 3, foo: 'bar' }, { id: 4 }];
    const update = { id: 3, foo: 'qux' };
    const expected = [{ id: 1 }, { id: 2 }, { id: 3, foo: 'qux' }, { id: 4 }];
    service.stream('url', { params: {} }).pipe(skip(1)).subscribe(elements => {
      expect(elements).to.deep.equal(expected);
      done();
    }, fail);
    const mock = MockEventSource.instances[0];
    mock.dispatchEvent('reset', JSON.stringify(initial));
    mock.dispatchEvent('update', JSON.stringify(update));
  });

  it('should interpret add events', function (done) {
    const initial = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const addition = { id: 5 };
    const expected = initial.concat(addition);
    service.stream('url', { params: {} }).pipe(skip(1)).subscribe(elements => {
      expect(elements).to.deep.equal(expected);
      done();
    }, fail);
    const mock = MockEventSource.instances[0];
    mock.dispatchEvent('reset', JSON.stringify(initial));
    mock.dispatchEvent('add', JSON.stringify(addition));
  });

  it('should interpret remove events', function (done) {
    const initial = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const removed = { id: 3 };
    const expected = [{ id: 1 }, { id: 2 }, { id: 4 }];
    service.stream('url', { params: {} }).pipe(skip(1)).subscribe(elements => {
      expect(elements).to.deep.equal(expected);
      done();
    }, fail);
    const mock = MockEventSource.instances[0];
    mock.dispatchEvent('reset', JSON.stringify(initial));
    mock.dispatchEvent('remove', JSON.stringify(removed));
  });

  it('should use the URL', function (done) {
    const URL = 'url';
    // subscribing because the GC gets a little overeager otherwise
    service.stream(URL, { params: {} }).subscribe(done);
    const mock = MockEventSource.instances[0];
    expect(mock.url).to.equal(URL + '?');
    mock.dispatchEvent('reset', '[]');
  });

  it('should use parameters', function (done) {
    const URL = 'url';
    const params = { 'foo': 'bar', 'qux': 'qax' };
    service.stream(URL, { params }).subscribe(done);
    const mock = MockEventSource.instances[0];
    expect(mock.url).to.equal(`${URL}?foo=bar&qux=qax&`);
    mock.dispatchEvent('reset', '[]');
  });
});

// mocking the event source object
class MockEventSource {

  static instances: MockEventSource[] = [];

  url: string;
  listeners: { [key: string]: (message: MessageEvent) => void } = {};

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(event: string, lambda: (message: MessageEvent) => void) {
    this.listeners[event] = lambda;
  }

  dispatchEvent(event: string, data: string) {
    this.listeners[event]({ data } as MessageEvent);
  }

  // mock doesn't need to be that complex - can teardown in afterEach
  close() { }
}