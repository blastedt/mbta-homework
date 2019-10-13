import { Component } from '@angular/core';
import { Station } from './mbta-api/model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  readonly Station = Station;
}
