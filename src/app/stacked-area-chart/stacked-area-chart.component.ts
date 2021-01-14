import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {DataService} from '../services/data.service';
import * as d3 from 'd3';
import {FeatureCollection, Feature, Point} from '@turf/helpers';
import {Area, BrushBehavior, ScaleLinear, ScaleTime} from 'd3';

@Component({
  selector: 'app-stacked-area-chart',
  templateUrl: './stacked-area-chart.component.html',
  styleUrls: ['./stacked-area-chart.component.css']
})
export class StackedAreaChartComponent implements OnInit {
  @ViewChild('sbchart') private chartContainer: ElementRef;
  margin = {top: 10, right: 10, bottom: 20, left: 30};
  width = 1240;
  height = 120;

  // @ts-ignore
  svg: Selection<ElementTagNameMap[string], unknown, HTMLElement, any>;
  crashMap: [any, any][];
  private x: ScaleTime<number, number, never>;
  private y: ScaleLinear<number, number, never>;
  // @ts-ignore
  private xAxis: Selection<ElementTagNameMap[string], unknown, HTMLElement, any>;
  // @ts-ignore
  private yAxis: Selection<ElementTagNameMap[string], unknown, HTMLElement, any>;
  private brush: BrushBehavior<unknown>;
  private areaGenerator: Area<[number, number]>;
  // @ts-ignore
  private area: Selection<ElementTagNameMap[string], unknown, HTMLElement, any>;
  private fromToIndex: [number, number] = [0, 0];

  constructor(private dataService: DataService) {
  }

  ngOnInit(): void {
    this.dataService.ready.subscribe(ready => {
      if (ready) {
        console.log('chart created');
        this.crashMap = this.dataService.crashMap.getValue().map(([date, count]) => [new Date(date), count]);
        this.createChart();
        console.log(this.crashMap);
      }
    });
    this.initAxis();
  }

  private createChart(): void {
    d3.select('#sbchart svg').remove();
    const nativeElement = this.chartContainer.nativeElement;

    const svg = d3.select(nativeElement)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')');
    this.x = d3.scaleTime()
      .domain(d3.extent(this.crashMap, d => d[0]))
      .range([0, this.width]);
    this.xAxis = svg.append('g')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(d3.axisBottom(this.x));
    this.y = d3.scaleLinear()
      .domain([0, d3.max(this.crashMap, d => d[1])])
      .range([this.height, 0]);
    this.yAxis = svg.append('g')
      .call(d3.axisLeft(this.y));
    this.brush = d3.brushX()
      .extent([[0, 0], [this.width, this.height]])
      .on('end', this.updateChart.bind(this));
    const clip = svg.append('defs').append('svg:clipPath')
      .attr('id', 'clip')
      .append('svg:rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('x', 0)
      .attr('y', 0);
    this.area = svg.append('g')
      .attr('clip-path', 'url(#clip)');
    this.areaGenerator = d3.area()
      .x(d => this.x(d[0]))
      .y0(this.y(0))
      .y1(d => this.y(d[1]));
    this.area.append('path')
      .datum(this.crashMap)
      .attr('class', 'myArea')
      .attr('fill-opacity', 255)
      .attr('fill', '#890812')
      .attr('stroke', '#000000')
      .attr('stroke-width', 2)
      .attr('d', this.areaGenerator);
    this.area.append('g')
      .attr('class', 'brush')
      .call(this.brush);
    svg.on('dblclick', () => {
      console.log('db');
      // this.x.domain(d3.extent(this.crashMap, d => d[0]));
      // this.xAxis.transition().call(d3.axisBottom(this.x));
      // this.area
      //   .select('.myArea')
      //   .transition()
      //   .attr('d', this.areaGenerator);
      this.dataService.resetTime();
      // this.dataService.updateTime();
      this.dataService.updateCharts();
    });

  }

  private updateChart(event): void {
    console.log(event.selection);
    let idleTimeout;
    function idled(): void {
      idleTimeout = null;
    }

    if (event.selection === null) {
      if (!idleTimeout) {
        // @ts-ignore
        return idleTimeout = setTimeout(idled, 350);
      }
      console.log('no data');
      this.x.domain([d3.min(this.crashMap, datum => datum[0]), d3.max(this.crashMap, datum => datum[0])]);
    }
    // const extent = d3.event.selection;
    const [from, to] = this.getValueRange(event.selection);
    this.dataService.setTime(from[0], to[0]);
    this.dataService.updateCharts();
    // this.dataService.updateTime();

  }

  private initAxis(): void {
    this.y = d3.scaleLinear()
      .domain([0, d3.max(this.crashMap, d => d[1])]).nice()
      .range([this.height - this.margin.bottom, this.margin.top]);
    this.x = d3.scaleUtc()
      .domain(d3.extent(this.crashMap, d => d[0]))
      .range([this.margin.left, this.width - this.margin.right]);
    // tslint:disable-next-line:no-shadowed-variable
    const xAxis = (g, x) => g
      .attr('transform', `translate(0,${this.height - this.margin.bottom})`)
      .call(d3.axisBottom(x).ticks(this.width / 80).tickSizeOuter(0));
    // tslint:disable-next-line:no-shadowed-variable
    const yAxis = (g, y) => g
      .attr('transform', `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(y).ticks(null, 's'))
      // tslint:disable-next-line:no-shadowed-variable
      .call(g => g.select('.domain').remove())
      // tslint:disable-next-line:no-shadowed-variable
      .call(g => g.select('.tick:last-of-type text').clone()
        .attr('x', 3)
        .attr('text-anchor', 'start')
        .attr('font-weight', 'bold'));
  }


  getValueRange(range: [number, number]): [any, any] {
    if (range) {
      const fromToIndex = [0, 0];
      const binWidth = this.width / this.crashMap.length;
      fromToIndex[0] = Math.floor(range[0] / binWidth);
      fromToIndex[1] = Math.ceil(range[1] / binWidth);
      if (fromToIndex[1] >= this.crashMap.length) {
        fromToIndex[1] = this.crashMap.length - 1;
      }
      return [this.crashMap[fromToIndex[0]], this.crashMap[fromToIndex[1]]];
    }
  }
}
