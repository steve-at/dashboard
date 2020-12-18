import {Component} from '@angular/core';
import {Observable} from 'rxjs';
import {FeatureCollection} from '@turf/helpers';
import {DataService} from './services/data.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  geometryData: FeatureCollection;
  crashData: FeatureCollection;

  constructor(private dataService: DataService) {
    dataService.crashDataAsObservable.subscribe(data => this.crashData = data);
    dataService.geometryDataAsObservable.subscribe(data => this.geometryData = data);
  }
}
