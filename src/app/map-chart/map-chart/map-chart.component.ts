import {Component, ElementRef, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import * as d3 from 'd3';
import * as fc from 'd3fc';
import {FeatureCollection, Point, Polygon, lineString} from '@turf/helpers';
import bbox from '@turf/bbox';
import {DataService} from '../../services/data.service';

@Component({
  selector: 'app-map-chart',
  templateUrl: './map-chart.component.html',
  styleUrls: ['./map-chart.component.css']
})
export class MapChartComponent implements OnInit {
  @ViewChild('mapchart') private chartContainer: ElementRef;
  @ViewChild('mapLegend') private legendContainer: ElementRef;
  geometries: FeatureCollection<Polygon>;
  crashData: FeatureCollection<Point>;
  width = 1080;
  height = 320;
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
  private working: boolean;
  private legendSvg: any;

  constructor(private dataService: DataService) {
  }

  ngOnInit(): void {
    this.dataService.ready.subscribe(ready => {
      if (ready) {
        console.log('chart created');
        // @ts-ignore
        this.geometries = this.dataService.geometryData.getValue();
        // @ts-ignore
        this.crashData = this.dataService.crashData.getValue();
        this.createChart();
      }
    });
  }

  private createChart(): void {
    this.working = true;
    d3.select('#mapchart svg').remove();
    const nativeElement = this.chartContainer.nativeElement;
    const data = new Map();
    console.log(this.geometries.features);
    this.geometries.features.forEach(entry => {
      data.set(entry.properties.County, entry.properties.count);
    });
    this.zoom = d3.zoom()
      .scaleExtent([1, 11])
      .on('zoom', this.zoomed.bind(this));
    const color = d3.scaleSequential().domain(d3.extent(Array.from(data.values()))).interpolator(d3.interpolateReds).unknown('#ccc');
    console.log(color.domain());


    this.svg = d3.select(nativeElement).append('svg')
      .on('dblclick', this.reset.bind(this))
      .attr('width', this.width)
      .attr('height', this.height);

    this.projection = d3.geoMercator().fitSize([this.width, this.height], this.geometries);
    this.path = d3.geoPath(this.projection);
    this.g = this.svg.append('g');

    this.brush = d3.brush()
      .extent([[0, 0], [this.width, this.height]])
      .on('end', this.brushEnd.bind(this));
    this.br = this.svg.append('g')
      .attr('class', 'brush')
      .call(this.brush);
    this.counties = this.g.append('g')
      .selectAll('path')
      .data(this.geometries.features)
      .join('path')
      .attr('fill', d => color(data.get(d.properties.County)))
      .attr('d', this.path)
      .attr('data-legend', (d) => d.properties.count)
      .append('title')
      .text(d => `${d.properties.County}
        ${data.has(d.properties.County) ? data.get(d.properties.County) : 'N/A'}`);

    // legend stuff
    d3.select('#map-legend svg').remove();
    const legendElement = this.legendContainer.nativeElement;
    this.legendSvg = d3.select(legendElement);
    const lWidth = 100;
    const lHeight = 300;
    const domain = color.domain();
    const paddedDomain = fc.extentLinear()
      .pad([0.05, 0.05])
      .padUnit('percent')(domain);
    const [min, max] = paddedDomain;
    const expandedDomain = d3.range(min, max, (max - min) / lHeight);

    const xLegScale = d3
      .scaleBand()
      // @ts-ignore
      .domain([0, 1])
      .range([0, lWidth]);

    const yLegScale = d3
      .scaleLinear()
      .domain(paddedDomain)
      .range([lHeight, 0]);

    const svgBar = fc
      .autoBandwidth(fc.seriesSvgBar())
      .xScale(xLegScale)
      .yScale(yLegScale)
      .crossValue(0)
      .baseValue((_, i) => (i > 0 ? expandedDomain[i - 1] : 0))
      .mainValue(d => d)
      .decorate(selection => {
        selection.selectAll('path').style('fill', d => color(d));
      });
    const axisLabel = fc
      .axisRight(yLegScale)
      .tickValues([...domain, (domain[1] + domain[0]) / 2])
      .tickSizeOuter(0);
    const legendSvg = this.legendSvg.append('svg')
      .attr('height', lHeight)
      .attr('width', lWidth);
    const legendBar = legendSvg
      .append('g')
      .datum(expandedDomain)
      .call(svgBar);
    legendSvg.append('g')
      .attr('transform', `translate(25)`)
      .attr('color', 'red')
      .datum(expandedDomain)
      .call(axisLabel)
      .select('.domain')
      .attr('visibility', 'hidden');
    legendSvg.style('margin', '1rem');
  }

  private brushEnd(event): void {
    if (event.selection) {
      const [[x0, y0], [x1, y1]] = event.selection;
      // this.svg.transition().duration(500).call(
      //   this.zoom.transform,
      //   d3.zoomIdentity
      //     .translate(this.width / 3, this.height / 10)
      //     .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / this.width, (y1 - y0) / this.height)))
      //     .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      //   d3.pointer(event, this.svg.node())
      // );
      this.brush.clear(this.br);
      const p0 = this.projection.invert([x0, y0]);
      const p1 = this.projection.invert([x1, y1]);
      this.dataService.setBbox(bbox(lineString([p0, p1])));
      // this.dataService.updateBbox();
      this.dataService.updateCharts();
      this.working = false;

    }
  }

  private zoomed(event): void {
    const {transform} = event;
    this.g.attr('transform', transform);
    this.g.attr('stroke-width', 1 / transform.k);
  }

  private clicked(event, d): void {
    console.log(d);
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
    if (!this.working) {
      this.working = true;
      this.counties.transition().style('fill', null);
      this.svg.transition().duration(750).call(
        this.zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(this.svg.node()).invert([this.width / 2, this.height / 2])
      );
      const p0 = this.projection.invert([0, 0]);
      const p1 = this.projection.invert([this.width, this.height]);
      // this.dataService.setBbox(bbox(lineString([p0, p1])));
      this.dataService.resetBbox();
      // this.dataService.updateBbox();
      this.dataService.updateCharts();
      this.working = false;

    }
  }

  private updateMap(): void {
    this.createChart();
  }
}
