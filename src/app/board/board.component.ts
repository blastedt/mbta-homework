import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { MbtaApiService } from '../mbta-api/mbta-api.service';
import { Station, CompletePrediction } from '../mbta-api/model';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit {

  predictions: CompletePrediction[];

  constructor(private readonly mbta: MbtaApiService) { }

  ngOnInit() {
    this.mbta
      .getPredictionsForStop(Station.SOUTH)
      .subscribe(json => this.predictions = json);
  }

  button() {
    console.log(this.predictions);
  }

}
