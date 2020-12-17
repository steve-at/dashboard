import { Component } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DataModel} from './model/data-model';
import {Observable} from 'rxjs';
import {FeatureCollection} from '@turf/helpers';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  data: Observable<DataModel>;
  geometryData: Observable<FeatureCollection>;
  crashData: Observable<FeatureCollection>;

  constructor(private http: HttpClient) {
    this.data = this.http.get<DataModel>('../assets/data.json');
    this.geometryData = this.http.get<FeatureCollection>('../assets/north-carolina-counties.json');
    this.crashData = this.http.get<FeatureCollection>('../assets/BikePedCrash.json');
  }
}
