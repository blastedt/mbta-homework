import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';



@Component({
  selector: 'app-date',
  templateUrl: './date.component.html',
  styleUrls: ['./date.component.css']
})
export class DateComponent implements OnInit {
  readonly DATE_FORMAT = "MM-DD-YYYY";
  readonly WEEKDAY_FORMAT = "dddd";

  weekday: string;
  date: string;

  constructor() { }

  ngOnInit() {
    const today = moment();
    this.weekday = today.format(this.WEEKDAY_FORMAT);
    this.date = today.format(this.DATE_FORMAT);
  }

}
