import {Component, ElementRef, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {DataService} from '../services/data.service';
import {NgForm} from '@angular/forms';
import {
  Arc,
  arc,
  DefaultArcObject,
  interpolateReds,
  pie as d3pie,
  quantize,
  ScaleOrdinal,
  scaleOrdinal,
  interpolateSpectral,
  pie,
  scaleLinear,
  scaleSequential,
  schemeReds
} from 'd3';
import * as d3 from 'd3';

@Component({
  selector: 'app-donut',
  templateUrl: './donut.component.html',
  styleUrls: ['./donut.component.css']
})
export class DonutComponent implements OnInit {
  @ViewChild('donut') private chartContainer: ElementRef;
  margin = {top: 30, right: 300, bottom: 50, left: 30};
  width = 450;
  height = 450;
  radius: number;
  attributes: string[];
  public dataKey: string;
  private data: [any, any][];
  private processedData: { key: any; value: number }[];
  private colors: string[];

  constructor(private dataService: DataService) {
  }

  ngOnInit(): void {
    this.radius = Math.min(this.width, this.height) / 2 - this.margin.bottom;
    this.dataService.ready.subscribe(ready => {
      if (ready) {
        this.attributes = this.dataService.getAllAttributes();
        this.data = this.dataService.donutMap.getValue();
        this.processedData = this.toKeyValue(this.data);
        this.createChart();
      }
    });
  }

  dataChanged($event: any): void {
    this.data = this.dataService.setupDonutMap(this.dataKey);
    this.dataService.currentDonutKey = this.dataKey;
    this.processedData = this.toKeyValue(this.data);
    this.createChart();
  }

  private toKeyValue(data: [any, any][]): { key: any, value: number }[] {
    const ret: { key: any, value: number }[] = [];
    data.forEach(value => {
      const v = {
        key: value[0],
        value: value[1]
      };
      ret.push(v);
    });
    return ret;
  }

  private createChart(): void {
    d3.select('#donut svg').remove();
    const nativeElement = this.chartContainer.nativeElement;

    const svg = d3.select(nativeElement)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')');

    // const colorScale = scaleOrdinal(this.processedData.map(d => d.key), this.colors);
    const colorScale = d3.scaleSequential().domain(d3.extent(this.data.map(d => d[1]))).interpolator(interpolateReds).unknown('#ccc');

    const ar = arc()
      .innerRadius( 0.5 * this.height / 2 )
      .outerRadius( 0.85 * this.height / 2 );
    const pi = pie()
      // @ts-ignore
      .value(d => d.value);
    const labelArcs = arc()
      .innerRadius( 0.95 * this.height / 2 )
      .outerRadius( 0.95 * this.height / 2 );

    // @ts-ignore
    const pieArcs = pi(this.processedData);
    svg
      .selectAll('path')
      .data( pieArcs )
      .join('path')
      .style('stroke', 'white')
      .style('stroke-width', 3)
      // @ts-ignore
      .style('fill', d => colorScale( d.data.value ))
      // @ts-ignore
      .attr('d', ar);

    // @ts-ignore
    const text = svg.append('g')
      .attr('class', 'labels-container')
      // .attr('transform', `translate(${ this.width / 2 },${ this.height / 2 })`)
      .selectAll('text')

      .data( pieArcs )
      .join('text')
      // @ts-ignore
      .attr('transform', d => `translate(${ labelArcs.centroid(d) })`)
      .attr('text-anchor', 'middle');

    // This section explained below
    text.selectAll('tspan')
      // @ts-ignore
      .data( d => [d.data.key, d.data.value
      ])
      // 2
      .join('tspan')
      .attr('x', 0)
      .style('font-family', 'sans-serif')
      .style('font-size', 12)
      .style('font-weight', (d, i) => i ? undefined : 'bold')
      .style('fill', '#222')
      .attr('dy', (d, i) => i ? '1.2em' : 0 )
      .text(d => d);
  }


}
