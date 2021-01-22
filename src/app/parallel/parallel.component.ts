/* tslint:disable:no-string-literal */
import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {DataService} from '../services/data.service';
import {
  brushY,
  cross,
  curveCatmullRom,
  scaleOrdinal,
} from 'd3';
import * as d3 from 'd3';

@Component({
  selector: 'app-parallel',
  templateUrl: './parallel.component.html',
  styleUrls: ['./parallel.component.css']
})
export class ParallelComponent implements OnInit {
  @ViewChild('parallel') private chartContainer: ElementRef;
  // margin = {top: 30, right: 10, bottom: 10, left: 10};
  keys = [
    'BikeAgeGrp',
    'Weather',
    'LightCond',
    // 'RdCharacte',
    // 'CrashHour',
    // 'DrvrAgeGrp',
    'BikeInjury',
    // 'DrvrVehTyp',
    // 'DrvrInjury',
    'DrvrSex',
    'HitRun'];
  keysForMap = [
    ['BikeAgeGrp', ['Unknown', '0-5', '6-10', '11-15', '16-19', '20-24', '25-29', '30-39', '40-49', '50-59', '60-69', '70+']],
    ['Weather', ['Clear', 'Cloudy', 'Rain', 'Fog, Smog, Smoke', 'Other', 'Snow, Sleet, Hail, Freezing Rain/Drizzle']],
    ['CrashHour', ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
      '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']],
    ['DrvrAgeGrp', ['Unknown', '0-19', '20-24', '25-29', '30-39', '40-49', '50-59', '60-69', '70+']],
    ['BikeInjury', ['O: No Injury', 'Unknown Injury', 'C: Possible Injury',
      'B: Suspected Minor Injury', 'A: Suspected Serious Injury', 'K: Killed']],
    ['DrvrVehTyp', ['Unknown', 'Pickup', 'Passenger Car', 'Van', 'Light Truck (Mini-Van, Panel)',
      'Light Truck (Mini-Van, Panel)', 'Sport Utility', 'Tractor/Semi-Trailer', 'Truck/Trailer',
      'Single Unit Truck (2-Axle, 6-Tire)', 'Taxicab', 'Single Unit Truck (3 Or More Axles)',
      'Police', 'Motorcycle', 'Commercial Bus', 'Other Bus', 'School Bus', 'Unknown Heavy Truck',
      'Pedestrian', 'Pedalcycle', 'Motor Home/Recreational Vehicle', 'EMS Vehicle, Ambulance, Rescue Squad',
      'Truck/Tractor', 'Activity Bus', 'Moped', 'Firetruck', 'All Terrain Vehicle (ATV)']],
    ['DrvrInjury', ['O: No Injury', 'Unknown Injury', 'C: Possible Injury',
      'B: Suspected Minor Injury', 'A: Suspected Serious Injury', 'K: Killed']],
    ['HitRun', ['Yes', 'No']],
    ['LightCond' , ['Daylight', 'Dark - Lighted Roadway', 'Dusk', 'Dawn',
      'Dark - Roadway Not Lighted', 'Dark - Unknown Lighting', 'Other', 'Unknown']],
    // 'Locality',
    // ['RdCharacte', ['Straight - Level', 'Curve - Level']],
    // 'RdConditio',
    // 'RdSurface',
    // 'Region',
    // 'RuralUrban',
    // 'BikeAlcFlg',
    // 'BikeDir',
    // 'BikePos',
    // 'County',
    // 'CrashAlcoh',
    // 'CrashGrp',
    // 'DrvrAlcFlg',
    ['DrvrSex', ['Unknown', 'Female', 'Male']],
  ];

  // @ts-ignore
  keyMap = new Map(this.keysForMap);

  private data: ({ [p: string]: any } | null)[];
  private x;
  private y: Map<any, any>;
  // private line;
  // private dragging;
  // private axis;
  // private z: any;
  dimensions = ({
    height: 300,
    width: 1240,
    margin: {
      top: 10,
      right: 10,
      bottom: 10,
      left: 30,
    }
  });
  private polylines: any;
  private activeBrushes: Map<any, any>;
  private currentBrush: any;

  constructor(private dataService: DataService) {
    // this.height = this.keys.length * 100;
  }

  ngOnInit(): void {
    this.dataService.ready.subscribe(ready => {
      if (ready) {
        this.data = this.dataService.crashData.getValue().features.map(d => d.properties);
        this.initAxis();
        this.createChart();
      }
    });
  }

  initAxis(): void {
    this.x = d3.scalePoint(this.keys, [this.dimensions.margin.left, this.dimensions.width - this.dimensions.margin.right]);
    this.y = new Map();
    this.keys.forEach((attribute) => {
        if (attribute === 'BikeAgeGrp') {
          const BikeAgeGrp = ['Unknown', '0-5', '6-10', '11-15', '16-19', '20-24', '25-29', '30-39', '40-49', '50-59', '60-69', '70+'];
          const rangeArr = this.getRange(BikeAgeGrp);
          this.y.set(
            attribute,
            scaleOrdinal()
              .domain(BikeAgeGrp)
              .range(rangeArr));
        } else if (attribute === 'HitRun') {
          const arr = ['Yes', 'No'];
          const rangeArr = this.getRange(arr);
          this.y.set(
            attribute,
            scaleOrdinal()
              .domain(arr)
              .range(rangeArr));
        } else if (attribute === 'DrvrSex') {
          const arr = ['Unknown', 'Female', 'Male'];
          const rangeArr = this.getRange(arr);
          this.y.set(
            attribute,
            scaleOrdinal()
              .domain(arr)
              .range(rangeArr));
        } else if (attribute === 'CrashHour') {
          const arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
            '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];
          const rangeArr = this.getRange(arr);
          this.y.set(
            attribute,
            scaleOrdinal()
              .domain(arr)
              .range(rangeArr));
        } else if (attribute === 'Weather') {
          const arr = ['Clear', 'Cloudy', 'Rain', 'Fog, Smog, Smoke', 'Other', 'Snow, Sleet, Hail, Freezing Rain/Drizzle'];
          const rangeArr = this.getRange(arr);
          this.y.set(
            attribute,
            scaleOrdinal()
              .domain(arr)
              .range(rangeArr));
        } else if (attribute === 'BikeInjury') {
          const arr = ['O: No Injury', 'Unknown Injury', 'C: Possible Injury', 'B: Suspected Minor Injury', 'A: Suspected Serious Injury', 'K: Killed'];
          const rangeArr = this.getRange(arr);
          this.y.set(
            attribute,
            scaleOrdinal()
              .domain(arr)
              .range(rangeArr));
        } else if (attribute === 'DrvrInjury') {
          const arr = ['O: No Injury', 'Unknown Injury', 'C: Possible Injury', 'B: Suspected Minor Injury', 'A: Suspected Serious Injury', 'K: Killed'];
          const rangeArr = this.getRange(arr);
          this.y.set(
            attribute,
            scaleOrdinal()
              .domain(arr)
              .range(rangeArr));
        } else if (attribute === 'DrvrVehTyp') {
          const arr = ['Unknown', 'Pickup', 'Passenger Car', 'Van', 'Light Truck (Mini-Van, Panel)',
            'Light Truck (Mini-Van, Panel)', 'Sport Utility', 'Tractor/Semi-Trailer', 'Truck/Trailer',
            'Single Unit Truck (2-Axle, 6-Tire)', 'Taxicab', 'Single Unit Truck (3 Or More Axles)',
            'Police', 'Motorcycle', 'Commercial Bus', 'Other Bus', 'School Bus', 'Unknown Heavy Truck',
            'Pedestrian', 'Pedalcycle', 'Motor Home/Recreational Vehicle', 'EMS Vehicle, Ambulance, Rescue Squad',
            'Truck/Tractor', 'Activity Bus', 'Moped', 'Firetruck', 'All Terrain Vehicle (ATV)'];
          const rangeArr = this.getRange(arr);
          this.y.set(
            attribute,
            scaleOrdinal()
              .domain(arr)
              .range(rangeArr));
        } else if (attribute === 'DrvrAgeGrp') {
          const arr = ['Unknown', '0-19', '20-24', '25-29', '30-39', '40-49', '50-59', '60-69', '70+'];
          const rangeArr = this.getRange(arr);
          this.y.set(
            attribute,
            scaleOrdinal()
              .domain(arr)
              .range(rangeArr));
        } else if (attribute === 'LightCond') {
          const arr = ['Daylight', 'Dark - Lighted Roadway', 'Dusk', 'Dawn',
            'Dark - Roadway Not Lighted', 'Dark - Unknown Lighting', 'Other', 'Unknown'];
          const rangeArr = this.getRange(arr);
          this.y.set(
            attribute,
            scaleOrdinal()
              .domain(arr)
              .range(rangeArr));
        }
      }
    );

  }


  private getRange(arr: string[]): number[] {
    const delta = (this.dimensions.height - this.dimensions.margin.bottom) / (arr.length - 1);
    const rangeArr = [];
    for (const [i] of arr.entries()) {
      rangeArr.push(this.dimensions.height - this.dimensions.margin.bottom - i * delta);
    }
    return rangeArr;
  }

  getValuesForRange(attribute: string, range: [number, number]): any[] {
    const values = this.keyMap.get(attribute) as any[];
    const filteredValues = [];
    if (values.length > 0) {
      const valueRange = this.getRange(values);
      for (const [i, value] of valueRange.entries()) {
        if (value >= range[0] && value <= range[1]) {
          filteredValues.push(values[i]);
        }
      }
    }
    return filteredValues;
  }


  private createChart(): void {
    d3.select('#parallel svg').remove();
    const nativeElement = this.chartContainer.nativeElement;
    const svg = d3.select(nativeElement)
      .append('svg')
      .attr('width', this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right)
      .attr('height', this.dimensions.height + this.dimensions.margin.top + this.dimensions.margin.bottom);

    this.activeBrushes = new Map();

    const yY = this.y;
    this.polylines = svg
      .append('g')
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.3)
      .selectAll('path')
      .data(this.data)
      .join('path')
      // TODO: create the polylines
      .attr('d', d => d3.line()
        .curve(curveCatmullRom)
        .defined(([, value]) => value != null)
        .y(([key, value]) => this.y.get(key)(value))
        .x(([key]) => this.x(key))
        // @ts-ignore
        (cross(this.keys, [d], (key, v) => [key, v[key]])))
      .attr('stroke', '#890812');
    const axes = svg
      .append('g')
      .selectAll('g')
      .data(this.keys)
      .join('g')
      .attr('transform', d => `translate(${this.x(d)},0)`)
      // tslint:disable-next-line:typedef
      .each(function(d) {
        d3.select(this).call(d3.axisRight(yY.get(d)));
      })
      .call(g => g.append('text')
        .attr('y', this.dimensions.height + 20)
        .attr('x', -5)
        .attr('text-anchor', 'start')
        .attr('fill', 'currentColor')
        .attr('font-weight', 'bold')
        .text(d => d))
      .call(g => g.selectAll('text')
        .clone(true).lower()
        .attr('fill', 'none')
        .attr('stroke-width', 5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke', 'white')
      );
    const brushes = axes.append('g').call(
      brushY()
        .extent([[-10, 0], [10, this.dimensions.height - this.dimensions.margin.bottom]])
        .on('brush', this.brushed.bind(this))
        .on('end', this.brushEnd.bind(this))
    );
    brushes.append('style')
      .text('path.hidden { stroke: #000; stroke-opacity: 0.01;}');
  }


  // tslint:disable-next-line:typedef
  updateBrushing() {
    // TODO implement brushing & linking
    this.polylines.classed('hidden', d => {
      let hidden;
      this.keys.forEach((key, value) => {
        if (!this.activeBrushes.has(key)) {
          return;
        } else if (this.activeBrushes.get(key) === null) {
          return;
        } else {
          const [y0, y1] = this.activeBrushes.get(key);
          if (!hidden) {
            hidden = y0 > this.y.get(key)(d[key]) ||
              y1 < this.y.get(key)(d[key]);
          }
        }
      });
      return hidden;
    });
  }

  brushed(event, attribute): void {
    this.activeBrushes.set(attribute, event.selection);
    this.updateBrushing();
  }

  brushEnd(event, attribute): void {
    if (event.selection !== null) {
      const values = this.getValuesForRange(attribute, event.selection);
      this.dataService.filterDataByAttribute(attribute, values);
      this.dataService.updateCharts();
      return;
    }
    this.activeBrushes.delete(attribute);
    this.updateBrushing();
    this.dataService.filterDataByAttribute(attribute, []);
    this.dataService.updateCharts();
  }


}
