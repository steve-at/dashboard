import {Injectable} from '@angular/core';
import {BBox, FeatureCollection} from '@turf/helpers';
import bboxPolygon from '@turf/bbox-polygon';
import {BehaviorSubject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import pointsWithinPolygon from '@turf/points-within-polygon';
import booleanWithin from '@turf/boolean-within';
@Injectable({
  providedIn: 'root'
})
export class DataService {
  private geometryData = new BehaviorSubject<FeatureCollection>(null);
  private crashData = new BehaviorSubject<FeatureCollection>(null);
  public geometryDataAsObservable = this.geometryData.asObservable();
  public crashDataAsObservable = this.crashData.asObservable();
  private baseCrashData: FeatureCollection;
  private baseGeometryData: FeatureCollection;
  constructor(private http: HttpClient) {
    this.http.get<FeatureCollection>('../assets/north-carolina-counties.json').subscribe(data => {
      this.geometryData.next(data);
      this.baseGeometryData = data;
    });
    this.http.get<FeatureCollection>('../assets/BikePedCrash.json').subscribe(data => {
      this.crashData.next(data);
      this.baseCrashData = data;
    });
  }

  public updateBbox(bbox: BBox): void {
    const bounds = bboxPolygon(bbox);
    // @ts-ignore
    const filteredCrashs = pointsWithinPolygon(this.baseCrashData, bounds);
    console.log(filteredCrashs);
    // @ts-ignore
    const filteredCounties = this.baseGeometryData.features.filter(feature => booleanWithin(feature, bounds));
    console.log(filteredCounties);
    // @ts-ignore
    this.crashData.next(filteredCrashs);
    // @ts-ignore
    this.geometryData.next(filteredCounties);
  }

}
