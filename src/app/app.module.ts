import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { DateComponent } from './date/date.component';
import { TimeComponent } from './time/time.component';
import { BoardComponent } from './board/board.component';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MbtaApiService } from './mbta-api/mbta-api.service';
import { EventStreamingService } from './event-streaming/event-streaming.service';

@NgModule({
  declarations: [
    AppComponent,
    DateComponent,
    TimeComponent,
    BoardComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
  ],
  providers: [
    MbtaApiService,
    EventStreamingService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
