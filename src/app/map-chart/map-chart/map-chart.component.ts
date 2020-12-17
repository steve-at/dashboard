import {Component, ElementRef, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import * as d3 from 'd3';
import {FeatureCollection, Point, Polygon} from '@turf/helpers';
import bbox from '@turf/bbox';
import legend from 'd3-color-legend';

@Component({
  selector: 'app-map-chart',
  templateUrl: './map-chart.component.html',
  styleUrls: ['./map-chart.component.css']
})
export class MapChartComponent implements OnChanges {
  @ViewChild('mapchart') private chartContainer: ElementRef;
  @Input() geometries: FeatureCollection<Polygon>;
  @Input() crashData: FeatureCollection<Point>;
  width = 960;
  height = 600;
  path = d3.geoPath();
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  g: any;
  zoom: d3.ZoomBehavior<Element, unknown>;
  private counties: any;
  constructor() {
  }

  ngOnChanges(): void {
    if (this.geometries && this.crashData) {
      for (const feature of this.geometries.features) {
        feature.properties.count = 0;
        for (const crash of this.crashData.features) {
          if (feature.properties.County.toLowerCase() === crash.properties.County.toLowerCase()) {
            feature.properties.count++;
          }
        }
      }
      this.createChart();
    } else {
      return;
    }
  }

  private createChart(): void{
    d3.select('svg').remove();
    const element = this.chartContainer.nativeElement;
    const data = new Map();
    this.geometries.features.forEach(entry => {
      data.set(entry.properties.County, entry.properties.count);
    });
    this.zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', this.zoomed.bind(this));


    const color = d3.scaleSequential().domain(d3.extent(Array.from(data.values()))).interpolator(d3.interpolateReds).unknown('#ccc');

    this.svg = d3.select(element).append('svg')
      .on('click', this.reset.bind(this))
      .attr('width', this.width)
      .attr('height', this.height);
    const projection = d3.geoMercator().fitSize([this.width, this.height], this.geometries);
    this.path = d3.geoPath(projection);
    this.g = this.svg.append('g');

    this.counties = this.g.append('g')
      .selectAll('path')
      .data(this.geometries.features)
      .join('path')
      .on('click', this.clicked.bind(this))
      .attr('fill', d => color(data.get(d.properties.County)))
      .attr('d', this.path)
      .append('title')
      .text(d => `${d.properties.County}
        ${data.has(d.properties.County) ? data.get(d.properties.County) : 'N/A'}`);

    this.svg.call(this.zoom);
  }

  // tslint:disable-next-line:typedef
  private zoomed(event) {
    const {transform} = event;
    console.log(transform);
    this.g.attr('transform', transform);
    this.g.attr('stroke-width', 1 / transform.k);
  }
  // tslint:disable-next-line:typedef
  private clicked(event, d) {
    const [ [x0, y0], [x1, y1] ] = this.path.bounds(d);
    event.stopPropagation();
    this.counties.transition().style('fill', null);
    d3.select(event.target).transition().style('fill', 'blue');
    this.svg.transition().duration(500).call(
      this.zoom.transform,
      d3.zoomIdentity
        .translate(this.width / 2, this.height / 2)
        .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / this.width, (y1 - y0) / this.height)))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      d3.pointer(event, this.svg.node())
    );
  }

  private reset(event): any {
    this.counties.transition().style('fill', null);
    this.svg.transition().duration(750).call(
      this.zoom.transform,
      d3.zoomIdentity,
      d3.zoomTransform(this.svg.node()).invert([this.width / 2, this.height / 2])
    );
  }
}
