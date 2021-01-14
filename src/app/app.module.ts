import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import { MapChartComponent } from './map-chart/map-chart/map-chart.component';
import { StackedAreaChartComponent } from './stacked-area-chart/stacked-area-chart.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatCardModule} from '@angular/material/card';
import { ParallelComponent } from './parallel/parallel.component';
import { DonutComponent } from './donut/donut.component';
import {MatOptionModule, MatRippleModule} from '@angular/material/core';
import { MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';

@NgModule({
  declarations: [
    AppComponent,
    MapChartComponent,
    StackedAreaChartComponent,
    ParallelComponent,
    DonutComponent,
  ],
    imports: [
        BrowserModule, HttpClientModule, BrowserAnimationsModule, MatCardModule, MatOptionModule,
      MatSelectModule, FormsModule, MatButtonModule, MatChipsModule
    ],
  providers: [HttpClient],
  bootstrap: [AppComponent]
})
export class AppModule { }
