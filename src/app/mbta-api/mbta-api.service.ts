import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Station, CompletePrediction, Prediction, PredictionsResponse, Route } from './model';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class MbtaApiService {

  constructor(private readonly http: HttpClient) { }

  getPredictionsForStop(stop: Station): Observable<CompletePrediction[]> {
    return this.http.get<PredictionsResponse>(`${environment.API_BASE}/predictions`, {
      params: {
        'filter[stop]': stop.toString(),
        'sort': 'time',
        'include': 'schedule,route,trip,vehicle,alerts,stop',
      }
    }).pipe(map(predictions => {
      let logged = false;
      return predictions.data.map<CompletePrediction>(prediction => {
        const relatedRouteId = prediction.relationships.route.data && prediction.relationships.route.data.id;
        const relatedRoute = predictions.included.find(included => {
          return included.id === relatedRouteId;
        });

        const relatedTripId = prediction.relationships.trip.data && prediction.relationships.trip.data.id;
        const relatedTrip = predictions.included.find(included => included.id === relatedTripId);

        const relatedStopId = prediction.relationships.stop.data && prediction.relationships.stop.data.id;
        const relatedStop = predictions.included.find(included => included.id === relatedStopId);

        const relatedVehicleId = prediction.relationships.vehicle.data && prediction.relationships.vehicle.data.id;
        const relatedVehicle = predictions.included.find(included => included.id === relatedVehicleId);

        return {
          time: moment(prediction.attributes.departure_time).format('hh:mm A'),
          status: this.status(
            prediction.attributes.status,
            prediction.attributes.departure_time,
            prediction.attributes.arrival_time,
            relatedVehicle && relatedVehicle.attributes.current_status
          ),
          first_stop: !!(!prediction.attributes.arrival_time && prediction.attributes.departure_time),
          last_stop: !!(prediction.attributes.arrival_time && !prediction.attributes.departure_time),
          destination: this.nextStop(prediction, relatedRoute),
          line: relatedRoute && relatedRoute.attributes && relatedRoute.attributes.long_name,
          line_color: relatedRoute && relatedRoute.attributes && relatedRoute.attributes.color,
          line_text_color: relatedRoute && relatedRoute.attributes && relatedRoute.attributes.text_color,
          headsign: relatedTrip && relatedTrip.attributes && relatedTrip.attributes.headsign,
          platform: relatedStop && relatedStop.attributes && relatedStop.attributes.platform_code
        }
      })
        .filter(prediction => prediction);
    }));
  }

  private nextStop(prediction: Prediction, relatedRoute: Route): string {
    const nextStopSequence = prediction.attributes.stop_sequence + (prediction.attributes.direction_id === 0 ? -1 : 1);
    const nextStop = relatedRoute
      && relatedRoute.attributes
      && relatedRoute.attributes.direction_destinations
      && relatedRoute.attributes.direction_destinations[nextStopSequence];
    return nextStop || '';
  }

  private status(status: string, departure_time: string | null, arrival_time: string | null, vehicle_status: string) {
    if (status) {
      return status;
    }
    const desired_time = arrival_time || departure_time;
    if (!desired_time) {
      return '';
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
