import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-time',
  templateUrl: './time.component.html',
  styleUrls: ['./time.component.css']
})
export class TimeComponent implements OnInit {

  readonly TIME_FORMAT = "hh:mm A";
  time: string;

  constructor() { }

  ngOnInit() {
    const now = moment();
    this.time = now.format(this.TIME_FORMAT);
  }

}
