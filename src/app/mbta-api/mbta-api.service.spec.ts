import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import * as chai from 'chai';
import * as moment from 'moment';
import { of } from 'rxjs';
import { EventStreamingService } from '../event-streaming/event-streaming.service';
import { MbtaApiService } from './mbta-api.service';
import { Station } from './model';



describe('MbtaApiService', () => {
  let service: MbtaApiService;
  let httpGetSpy: jasmine.Spy;
  let streamSpy: jasmine.Spy;
  beforeEach(() => {
    httpGetSpy = jasmine.createSpy('httpGetSpy');
    streamSpy = jasmine.createSpy('eventStreamingSpy');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HttpClient,
          useValue: {
            get: httpGetSpy
          }
        },
        MbtaApiService,
        {
          provide: EventStreamingService,
          useValue: {
            stream: streamSpy
          }
        }
      ]
    });
    service = TestBed.get(MbtaApiService);
  });

  describe('stop names', function () {
    const NAME = 'Stop Human Name', STATION = 'station-enum' as Station;

    beforeEach(function () {
      httpGetSpy.and.returnValue(of({ data: { attributes: { name: NAME } } }));
    });

    it('should get the stop name', function (done) {
      service.getStopName(STATION).subscribe(name => {
        chai.expect(name).to.equal(NAME);
        done();
      });
    });

    it('should get the stop name only once and cache', function () {
      service.getStopName(STATION);
      service.getStopName(STATION);
      expect(httpGetSpy).toHaveBeenCalledTimes(1);
    });

    it('should hit the correct url', function () {
      service.getStopName(STATION);
      chai.expect(httpGetSpy.calls.argsFor(0)[0]).to.contain(`stops/${STATION}`);
    });
  });

  describe('status strings', function () {
    it('should return an existing status', function () {
      const STATUS = 'a status';
      chai.expect(service.status(STATUS, null, null, '')).to.equal(STATUS);
    });

    it('should return ignore if there isnt a projected time', function () {
      chai.expect(service.status(null, null, null, '')).to.equal('Unknown');
    });

    it('should return Boarding if the vehicle is stopped and less than 90 sec to arrival', function () {
      const now = moment();
      const slightly_later = now.add(45, 'seconds');
      const actual = service.status(null, null, slightly_later.format(), 'STOPPED_AT');
      chai.expect(actual).to.equal('Boarding');
    });

    it('should return Arriving if a vehicle is <30 sec away and has arrival time', function () {
      const now = moment();
      const slightly_later = now.add(20, 'seconds');
      const actual = service.status(null, slightly_later.format(), slightly_later.format(), '');
      chai.expect(actual).to.equal('Arriving');
    });

    it('should return Boarding if a vehicle is <30 sec away and has no arrival time', function () {
      const now = moment();
      const slightly_later = now.add(20, 'seconds');
      const actual = service.status(null, slightly_later.format(), null, '');
      chai.expect(actual).to.equal('Boarding');
    });

    it('should return Approaching if a vehicle is <60 sec away', function () {
      const now = moment();
      const slightly_later = now.add(45, 'seconds');
      const actual = service.status(null, slightly_later.format(), null, '');
      chai.expect(actual).to.equal('Approaching');
    });

    it('should otherwise display minutes remaining', function () {
      const now = moment();
      const later = now.add(149, 'seconds');
      const actual = service.status(null, later.format(), null, '');
      chai.expect(actual).to.equal('2 minutes');
    });
  });

  it('can determine if a train is CR', function () {
    const actual = service.isCommuterRail({ stop: { attributes: { vehicle_type: 2 } } } as any);
    chai.expect(actual).to.be.true;
  });

  it('can determine a train isnt CR', function () {
    const actual = service.isCommuterRail({ stop: { attributes: { vehicle_type: 1 } } } as any);
    chai.expect(actual).to.be.false;
  });

  it('defaults trains without associated stop to be non-CR', function () {
    const actual = service.isCommuterRail({ stop: null } as any);
    chai.expect(actual).not.to.be.ok;
  });

  describe('mapping predictions', function () {
    it('works in simple case', function () {
      const resources = [
        {
          type: 'prediction',
          id: 'prediction-1',
          attributes: {
            status: 'status',
            arrival_time: '2019-10-12T22:00:00-04:00'
          },
          relationships: {
            stop: { data: { id: 'stop-1' } },
            trip: { data: { id: 'trip-1' } },
            vehicle: { data: { id: 'vehicle-1' } },
            route: { data: { id: 'route-1' } },
          }
        },
        {
          type: 'route',
          id: 'route-1',
        },
        {
          type: 'trip',
          id: 'trip-1'
        },
        {
          type: 'vehicle',
          id: 'vehicle-1'
        },
        {
          type: 'stop',
          id: 'stop-1'
        }
      ] as any;
      const actual = service.mapPredictions(resources, false);
      chai.expect(actual.length).to.equal(1);
      const actualPrediction = actual[0];
      chai.expect(actualPrediction.time).to.equal('10:00 PM');
      chai.expect(actualPrediction.status).to.equal('status');
      chai.expect(actualPrediction.first_stop).to.be.false;
      chai.expect(actualPrediction.last_stop).to.be.true;
      chai.expect(actualPrediction.vehicle.type).to.equal('vehicle');
      chai.expect(actualPrediction.trip.type).to.equal('trip');
      chai.expect(actualPrediction.stop.type).to.equal('stop');
      chai.expect(actualPrediction.route.type).to.equal('route');
    });
  });

});
