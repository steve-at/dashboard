import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {FeatureCollection} from '@turf/helpers';
import {DataService} from './services/data.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  implements OnInit {
  geometryData: FeatureCollection;
  crashData: FeatureCollection;
  activeFilter: Map<any, any[]>;
  overview: {
    from: Date,
    to: Date,
    total: number
  };
  loading = true;
  constructor(private dataService: DataService) {
    this.overview = {from: new Date(), to: new Date(), total: 0};
  }

  ngOnInit(): void {
    this.dataService.ready.subscribe(ready => {
      if (ready) {
        this.overview = {
          from: this.dataService.currentFromTime,
          to: this.dataService.currentToTime,
          total: this.dataService.crashData.getValue().features.length
        };
        this.loading = false;
      }
    });
    this.dataService.geometryDataAsObservable.subscribe(data => this.geometryData = data);
    this.dataService.activeFiltersAsObservable.subscribe(filter => {
      this.activeFilter = filter;
    });
  }

  removeFilter(key: any, value: any): void {
    const newValue = this.activeFilter.get(key);
    newValue.splice(newValue.indexOf(value), 1);
    if (newValue.length < 1) {
      this.activeFilter.delete(key);
    } else {
      this.activeFilter.set(key, newValue);
    }
    this.dataService.activeFilters.next(this.activeFilter);
    this.dataService.updateCharts();
  }

  removeFilterKategory(key: any): void {
    this.activeFilter.delete(key);
    this.dataService.activeFilters.next(this.activeFilter);
    this.dataService.updateCharts();
  }
}
