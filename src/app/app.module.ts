import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { FirstChartComponent } from './first-chart/first-chart.component';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import { MapChartComponent } from './map-chart/map-chart/map-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    FirstChartComponent,
    MapChartComponent
  ],
  imports: [
    BrowserModule, HttpClientModule
  ],
  providers: [HttpClient],
  bootstrap: [AppComponent]
})
export class AppModule { }
