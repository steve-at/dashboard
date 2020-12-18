import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import { MapChartComponent } from './map-chart/map-chart/map-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    MapChartComponent
  ],
  imports: [
    BrowserModule, HttpClientModule
  ],
  providers: [HttpClient],
  bootstrap: [AppComponent]
})
export class AppModule { }
