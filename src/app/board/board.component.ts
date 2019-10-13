import { Component, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { MbtaApiService } from '../mbta-api/mbta-api.service';
import { Station, CompletePrediction } from '../mbta-api/model';
import { EventStreamingService } from '../event-streaming/event-streaming.service';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit {

  @Input() stop: Station;
  @Input() onlyCommuterRail: boolean;

  predictions: CompletePrediction[];
  name: string;

  constructor(
    private readonly mbta: MbtaApiService,
    private readonly events: EventStreamingService,
  ) { }

  ngOnInit() {
    if (this.onlyCommuterRail === undefined || this.onlyCommuterRail === null) {
      this.onlyCommuterRail = true;
    }
    this.mbta
      .streamPredictionsForStop(this.stop, this.onlyCommuterRail)
      .subscribe(json => this.predictions = json);
    this.mbta.getStopName(this.stop).subscribe(name => this.name = name);
  }

  button(arg: any) {
    console.log(arg);
  }
}
