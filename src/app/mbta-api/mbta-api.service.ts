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
        'sort': '-arrival_time',
        'include': 'schedule,route,trip,vehicle,alerts',
      }
    }).pipe(map(predictions => {
      return predictions.data.map(prediction => {
        const relatedRouteId = prediction.relationships.route.data && prediction.relationships.route.data.id;
        const relatedRoute = predictions.included.find(included => {
          return included.id === relatedRouteId;
        });

        const relatedTripId = prediction.relationships.trip.data && prediction.relationships.trip.data.id;
        const relatedTrip = predictions.included.find(included => included.id === relatedTripId);

        return {
          time: moment(prediction.attributes.departure_time).format('hh:mm A'),
          status: prediction.attributes.status,
          first_stop: !!(!prediction.attributes.arrival_time && prediction.attributes.departure_time),
          last_stop: !!(prediction.attributes.arrival_time && !prediction.attributes.departure_time),
          destination: this.nextStop(prediction, relatedRoute),
          line: relatedRoute && relatedRoute.attributes && relatedRoute.attributes.long_name,
          line_color: relatedRoute && relatedRoute.attributes && relatedRoute.attributes.color,
          line_text_color: relatedRoute && relatedRoute.attributes && relatedRoute.attributes.text_color,
          headsign: relatedTrip && relatedTrip.attributes && relatedTrip.attributes.headsign,
        }
      });
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
}
