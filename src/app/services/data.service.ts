import {Injectable} from '@angular/core';
import {BBox, Feature, featureCollection, FeatureCollection, Polygon, Properties} from '@turf/helpers';
import bboxPolygon from '@turf/bbox-polygon';
import {BehaviorSubject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import pointsWithinPolygon from '@turf/points-within-polygon';
import booleanOverlap from '@turf/boolean-overlap';
import booleanWithin from '@turf/boolean-within';
import * as d3 from 'd3';
import bbox from '@turf/bbox';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  geometryData = new BehaviorSubject<FeatureCollection>(null);
  crashData = new BehaviorSubject<FeatureCollection>(null);
  public geometryDataAsObservable = this.geometryData.asObservable();
  public crashDataAsObservable = this.crashData.asObservable();
  private baseCrashData: FeatureCollection;
  private baseGeometryData: FeatureCollection;
  private readySubject = new BehaviorSubject<boolean>(false);
  public ready = this.readySubject.asObservable();

  activeFilters = new BehaviorSubject<Map<any, any[]>>(new Map());
  public activeFiltersAsObservable = this.activeFilters.asObservable();


  crashMap = new BehaviorSubject<[any, any][]>(null);
  donutMap = new BehaviorSubject<[any, any][]>(null);

  currentFromTime;
  currentToTime;
  private currentBbox: BBox;
  private bounds: Feature<Polygon, Properties>;
  private attributeFilterMap: Map<any, any[]>;
  currentDonutKey: string;

  constructor(private http: HttpClient) {
    this.attributeFilterMap = new Map();
    this.currentDonutKey = 'BikeInjury';
    this.http.get<FeatureCollection>('../assets/north-carolina-counties.json').subscribe(gData => {
      this.baseGeometryData = gData;
      console.log(this.baseGeometryData);
      this.currentBbox = bbox(this.baseGeometryData);
      this.http.get<FeatureCollection>('../assets/BikePedCrash.json').subscribe(cData => {
        this.baseCrashData = featureCollection(cData.features.filter(feature => feature.properties.CrashYear >= 2010));
        this.initialDataPreprocessing(gData, this.baseCrashData);
        this.resetTime();
      });
    });
  }

  public updateBbox(): void {
    this.bounds = bboxPolygon(this.currentBbox);
    // @ts-ignore
    const filteredCrashs = pointsWithinPolygon(this.baseCrashData, this.bounds);
    const filteredCounties = this.baseGeometryData.features
      .filter(feature => booleanOverlap(feature, this.bounds) || booleanWithin(feature, this.bounds));
    this.geometryData.next(featureCollection(filteredCounties));
    // @ts-ignore
    this.crashData.next(filteredCrashs);

    this.setupCrashMap();

  }

  public getAllAttributes(): string[] {
    return Object.keys(this.crashData.getValue().features[0].properties);
  }

  private initialDataPreprocessing(geometry: FeatureCollection, crash: FeatureCollection): void {
    this.baseGeometryData = geometry;
    this.baseCrashData = crash;
    if (this.baseGeometryData && this.baseCrashData) {
      this.fiterGeometryByCrashes(this.baseGeometryData, this.baseCrashData);

      this.geometryData.next(this.baseGeometryData);
      this.mergeDate();
      this.crashData.next(this.baseCrashData);
      this.setupMaps();
      this.resetTime();
      this.readySubject.next(true);

    }
  }

  private fiterGeometryByCrashes(geometryData: FeatureCollection, crashData: FeatureCollection): void {
    for (const feature of geometryData.features) {
      feature.properties.count = 0;
      for (const c of crashData.features) {
        if (feature.properties.County.toLowerCase() === c.properties.County.toLowerCase()) {
          feature.properties.count++;
        }
      }
    }
  }

  private mergeDate(): void {
    const parseTime = d3.timeParse('%Y %B');
    this.baseCrashData.features.map(f => f.properties.date = parseTime(f.properties.CrashYear.toString() + ' ' + f.properties.CrashMonth));
    this.baseCrashData.features.map(f => f.properties);
  }

  private setupMaps(): void {
    this.setupCrashMap();
    this.setupDonutMap(this.currentDonutKey);
  }
  private setupCrashMap(): void {
    const dates = new Map();
    this.crashData.getValue().features.forEach(d => {
      let count = dates.get(d.properties.date.toDateString());
      if (count) {
        dates.set(d.properties.date.toDateString(), ++count);
      } else {
        dates.set(d.properties.date.toDateString(), 1);
      }
    });
    this.crashMap.next([...dates.entries()].sort(((a, b) => new Date(a[0]).valueOf() - new Date(b[0]).valueOf())));
  }
  setupDonutMap(key: string): [any, any][] {
    const values = new Map();
    this.crashData.getValue().features.forEach(d => {
      let count = values.get(d.properties[key]);
      if (count) {
        values.set(d.properties[key], ++count);
      } else {
        values.set(d.properties[key], 1);
      }
    });
    this.donutMap.next([...values.entries()]);
    return [...values.entries()];
  }

  updateTime(): void {
    if (this.geometryData.getValue().features.length > 0) {
      const filteredCrashes = this.crashData.getValue().features.filter((crash) =>
        crash.properties.date >= this.currentFromTime && crash.properties.date <= this.currentToTime);
      const fc = featureCollection(filteredCrashes);
      const geom = this.geometryData.getValue();
      this.fiterGeometryByCrashes(geom, fc);
      if (this.geometryData.getValue().features.length < 1) {
        this.geometryData.next(this.baseGeometryData);
      }

      this.crashData.next(fc);
      this.setupMaps();
    }
  }

  updateAttributes(): void {
    const attributeFilterMap = this.activeFilters.getValue();
    if (this.geometryData.getValue().features.length > 0) {
      const filteredCrashes = this.crashData.getValue().features.filter((crash) => {
        const within: boolean[] = [];
        attributeFilterMap.forEach(((value, key) => {
          if (value.includes(crash.properties[key])) {
            within.push(true);
          } else {
            within.push(false);
          }
        }));
        return !within.includes(false);
      });
      const fc = featureCollection(filteredCrashes);
      const geom = this.geometryData.getValue();
      this.fiterGeometryByCrashes(geom, fc);
      if (this.geometryData.getValue().features.length < 1) {
        this.geometryData.next(this.baseGeometryData);
      }

      this.crashData.next(fc);
      this.setupMaps();
    }
  }
  resetTime(): void {
    this.currentFromTime = this.baseCrashData.features[0].properties.date;
    this.currentToTime = this.baseCrashData.features[this.baseCrashData.features.length - 1].properties.date;
  }

  setTime(from: Date, to: Date): void {
    this.currentFromTime = from;
    this.currentToTime = to;
  }

  setBbox(boundingBox: BBox): void {
    this.currentBbox = boundingBox;
  }

  updateCharts(): void {
    this.readySubject.next(false);
    this.updateBbox();
    this.updateTime();
    this.updateAttributes();
    // this.notifyActiveFilers();
    this.readySubject.next(true);
  }

  resetBbox(): void {
    this.currentBbox = bbox(this.baseGeometryData);
  }

  filterDataByAttribute(attribute: any, range: any[]): void {
    if (range.length < 1) {
      const filters = this.activeFilters.getValue();
      filters.delete(attribute);
      this.activeFilters.next(filters);
    } else {
      const filters = this.activeFilters.getValue();
      filters.set(attribute, range);
      this.activeFilters.next(filters);
    }

  }

  // private notifyActiveFilers(): void {
  //   this.activeFilters.next(this.attributeFilterMap);
  // }
}
