import {Component, ElementRef, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import * as d3 from 'd3';
import {FeatureCollection, Point, Polygon, lineString} from '@turf/helpers';
import bbox from '@turf/bbox';
import {DataService} from '../../services/data.service';

@Component({
  selector: 'app-map-chart',
  templateUrl: './map-chart.component.html',
  styleUrls: ['./map-chart.component.css']
})
export class MapChartComponent implements OnChanges, OnInit {
  @ViewChild('mapchart') private chartContainer: ElementRef;
  @Input() geometries: FeatureCollection<Polygon>;
  @Input() crashData: FeatureCollection<Point>;
  width = 960;
  height = 600;
  path = d3.geoPath();
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  g: any;
  zoom: d3.ZoomBehavior<Element, unknown>;
  currentBounds: { x0: number, y0: number, x1: number, y1: number };
  private counties: any;
  currentFeature: any;
  projection: d3.GeoProjection;
  brush: d3.BrushBehavior<unknown>;
  br: d3.Selection<SVGGElement, unknown, null, undefined>;

  constructor(private dataService: DataService) {
  }

  ngOnInit(): void {
    this.dataService.geometryDataAsObservable.subscribe(data => {
      if (data) {
        // @ts-ignore
        this.geometries = data;
        this.dataService.crashDataAsObservable.subscribe(crash => {
          if (crash) {
            // @ts-ignore
            this.crashData = crash;
            this.updateMap();
          }
        });
      }
    });
  }

  ngOnChanges(): void {
  }

  private createChart(): void {
    d3.select('svg').remove();
    const nativeElement = this.chartContainer.nativeElement;
    const data = new Map();
    this.geometries.features.forEach(entry => {
      data.set(entry.properties.County, entry.properties.count);
    });
    this.zoom = d3.zoom()
      .scaleExtent([1, 11])
      .on('zoom', this.zoomed.bind(this));

    const color = d3.scaleSequential().domain(d3.extent(Array.from(data.values()))).interpolator(d3.interpolateReds).unknown('#ccc');

    this.svg = d3.select(nativeElement).append('svg')
      .on('click', this.reset.bind(this))
      .attr('width', this.width)
      .attr('height', this.height);
    this.projection = d3.geoMercator().fitSize([this.width, this.height], this.geometries);
    this.path = d3.geoPath(this.projection);
    this.g = this.svg.append('g');
    this.brush = d3.brush()
      .extent([[0, 0], [this.width, this.height]])
      .on('end', this.brushEnd.bind(this));
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
    this.br = this.svg.append('g')
      .attr('class', 'brush')
      .call(this.brush);
  }

  private brushEnd(event): void {
    if (event.selection) {
      const [[x0, y0], [x1, y1]] = event.selection;
      this.svg.transition().duration(500).call(
        this.zoom.transform,
        d3.zoomIdentity
          .translate(this.width / 2, this.height / 2)
          .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / this.width, (y1 - y0) / this.height)))
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
        d3.pointer(event, this.svg.node())
      );
      this.brush.clear(this.br);
      const p0 = this.projection.invert([x0, y0]);
      const p1 = this.projection.invert([x1, y1]);
      this.dataService.updateBbox(bbox(lineString([p0, p1])));
    }
  }

  private zoomed(event): void {
    const {transform} = event;
    this.g.attr('transform', transform);
    this.g.attr('stroke-width', 1 / transform.k);
  }

  private clicked(event, d): void {
    const [[x0, y0], [x1, y1]] = this.path.bounds(d);
    this.currentBounds = {x0, y0, x1, y1};
    event.stopPropagation();
    this.counties.transition().style('fill', null);
    this.currentFeature = event.target;
    console.log(d3.select(event.target).style('fill'));
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
    const p0 = this.projection.invert([0, 0]);
    const p1 = this.projection.invert([this.width, this.height]);
    this.dataService.updateBbox(bbox(lineString([p0, p1])));
  }

  private updateMap(): void {
    if (this.geometries && this.crashData) {
      if (this.geometries.features) {
        for (const feature of this.geometries.features) {
          feature.properties.count = 0;
          for (const c of this.crashData.features) {
            if (feature.properties.County.toLowerCase() === c.properties.County.toLowerCase()) {
              feature.properties.count++;
            }
          }
        }
      } else {
        return;
      }
      this.createChart();
    } else {
      return;
    }
  }
}
