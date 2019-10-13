import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Station, CompletePrediction, Prediction, PredictionsResponse, Route, Stop, Resource, Vehicle, Trip } from './model';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { EventStreamingService } from '../event-streaming/event-streaming.service';

@Injectable()
export class MbtaApiService {

  constructor(
    private readonly http: HttpClient,
    private readonly eventStreaming: EventStreamingService,
  ) { }

  memoizedNames: { [stop: string]: Observable<string> } = {}

  getStopName(stop: Station): Observable<string> {
    if (!this.memoizedNames[stop]) {
      this.memoizedNames[stop] = this.http
        .get<any>(`${environment.API_BASE}/stops/${stop}`, {
          params: {
            'api_key': environment.API_KEY,
          }
        })
        .pipe(
          map(stop => {
            if (!stop || !stop.data || !stop.data.attributes) {
              return '';
            }
            return stop.data.attributes.name;
          }),
          shareReplay(1)
        );
    }
    return this.memoizedNames[stop];
  }

  // getPredictionsForStop(stop: Station, onlyCommuterRail: boolean = true): Observable<CompletePrediction[]> {
  //   return this.http.get<PredictionsResponse>(`${environment.API_BASE}/predictions`, {
  //     params: {
  //       'filter[stop]': stop.toString(),
  //       'sort': 'time',
  //       'include': 'schedule,route,trip,vehicle,alerts,stop',
  //       'api_key': environment.API_KEY,
  //     }
  //   })
  //     .pipe(
  //       map(predictions => this.mapPredictions(predictions, onlyCommuterRail))
  //     );
  // }

  streamPredictionsForStop(stop: Station, onlyCommuterRail: boolean = true): Observable<CompletePrediction[]> {
    return this.eventStreaming.stream<Resource>(`${environment.API_BASE}/predictions`, {
      params: {
        'filter[stop]': stop.toString(),
        'sort': 'time',
        'include': 'schedule,route,trip,vehicle,alerts,stop',
        'api_key': environment.API_KEY,
      }
    }).pipe(
      map(predictions => this.mapPredictions(predictions, onlyCommuterRail))
    )
  }

  mapPredictions(resources: Resource[], onlyCommuterRail: boolean): CompletePrediction[] {
    return resources
      .filter((resource: Resource): resource is Prediction => resource.type === 'prediction')
      .map<CompletePrediction>(prediction => {
        const relatedRouteId = prediction.relationships.route.data && prediction.relationships.route.data.id;
        const relatedRoute = resources.find(included => included.id === relatedRouteId) as Route;

        const relatedTripId = prediction.relationships.trip.data && prediction.relationships.trip.data.id;
        const relatedTrip = resources.find(included => included.id === relatedTripId) as Trip;

        const relatedStopId = prediction.relationships.stop.data && prediction.relationships.stop.data.id;
        const relatedStop: Stop = resources.find(included => included.id === relatedStopId) as Stop;

        const relatedVehicleId = prediction.relationships.vehicle.data && prediction.relationships.vehicle.data.id;
        const relatedVehicle = resources.find(included => included.id === relatedVehicleId) as Vehicle;

        const time = prediction.attributes.arrival_time || prediction.attributes.departure_time;
        const timeMoment = moment(time);

        return {
          time: timeMoment.isValid() ? timeMoment.format('hh:mm A') : 'No Time Given',
          status: this.status(
            prediction.attributes.status,
            prediction.attributes.departure_time,
            prediction.attributes.arrival_time,
            relatedVehicle && relatedVehicle.attributes.current_status
          ),
          first_stop: !!(!prediction.attributes.arrival_time && prediction.attributes.departure_time),
          last_stop: !!(prediction.attributes.arrival_time && !prediction.attributes.departure_time),
          vehicle: relatedVehicle,
          stop: relatedStop,
          trip: relatedTrip,
          route: relatedRoute,
        }
      })
      .filter(
        prediction => !onlyCommuterRail || this.isCommuterRail(prediction)
      );
  }

  // mapPredictions(predictions: PredictionsResponse, onlyCommuterRail: boolean): CompletePrediction[] {
  //   return predictions.data
  //     .map<CompletePrediction>(prediction => {
  //       const relatedRouteId = prediction.relationships.route.data && prediction.relationships.route.data.id;
  //       const relatedRoute = predictions.included.find(included => included.id === relatedRouteId);

  //       const relatedTripId = prediction.relationships.trip.data && prediction.relationships.trip.data.id;
  //       const relatedTrip = predictions.included.find(included => included.id === relatedTripId);

  //       const relatedStopId = prediction.relationships.stop.data && prediction.relationships.stop.data.id;
  //       const relatedStop: Stop = predictions.included.find(included => included.id === relatedStopId);

  //       const relatedVehicleId = prediction.relationships.vehicle.data && prediction.relationships.vehicle.data.id;
  //       const relatedVehicle = predictions.included.find(included => included.id === relatedVehicleId);

  //       const time = prediction.attributes.arrival_time || prediction.attributes.departure_time;
  //       const timeMoment = moment(time);

  //       return {
  //         time: timeMoment.isValid() ? timeMoment.format('hh:mm A') : 'No Time Given',
  //         status: this.status(
  //           prediction.attributes.status,
  //           prediction.attributes.departure_time,
  //           prediction.attributes.arrival_time,
  //           relatedVehicle && relatedVehicle.attributes.current_status
  //         ),
  //         first_stop: !!(!prediction.attributes.arrival_time && prediction.attributes.departure_time),
  //         last_stop: !!(prediction.attributes.arrival_time && !prediction.attributes.departure_time),
  //         vehicle: relatedVehicle,
  //         stop: relatedStop,
  //         trip: relatedTrip,
  //         route: relatedRoute,
  //       }
  //     })
  //     .filter(
  //       prediction => !onlyCommuterRail || this.isCommuterRail(prediction)
  //     );
  // }

  isCommuterRail(prediction: CompletePrediction): boolean {
    return prediction.stop && prediction.stop.attributes && prediction.stop.attributes.vehicle_type == 2;
  }

  /** 
   * get the status string of the train
   * follows the best practices included on the api documentation
   */
  status(status: string, departure_time: string | null, arrival_time: string | null, vehicle_status: string) {
    if (status) {
      return status;
    }

    const desired_time = arrival_time || departure_time;

    if (!desired_time) {
      return 'Unknown';
    }

    const now = moment();
    const arrival = moment(desired_time);
    const time_to_arrival = moment.duration(arrival.diff(now));
    const seconds_to_arrival: number = time_to_arrival.as('seconds');

    if (vehicle_status === 'STOPPED_AT' && seconds_to_arrival < 90) {
      return 'Boarding';
    }

    if (seconds_to_arrival <= 30) {
      return arrival_time ? 'Arriving' : 'Boarding';
    }

    if (seconds_to_arrival <= 60) {
      return 'Approaching';
    }

    const minutes_to_arrival = Math.round(time_to_arrival.as('minutes'));
    return `${minutes_to_arrival} minutes`;
  }
}
