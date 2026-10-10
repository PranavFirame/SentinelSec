import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TrendDataPoint } from '../../types';

interface Props {
  data: TrendDataPoint[];
  width?: number;
  height?: number;
}

export const ScoreTrendChart: React.FC<Props> = ({ data, width = 500, height = 220 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (!data || data.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '13px')
        .text('No historical score trend points');
      return;
    }

    const margin = { top: 15, right: 25, bottom: 30, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Gradient definitions
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'score-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.4);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

    const x = d3.scalePoint()
      .domain(data.map(d => d.date))
      .range([0, chartWidth])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);

    // Gridlines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(y)
          .ticks(5)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
      )
      .call(axis => axis.select('.domain').remove())
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3 3');

    // Area
    const area = d3.area<TrendDataPoint>()
      .x(d => x(d.date)!)
      .y0(chartHeight)
      .y1(d => y(d.average_score ?? 100))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#score-gradient)')
      .attr('d', area);

    // Line
    const line = d3.line<TrendDataPoint>()
      .x(d => x(d.date)!)
      .y(d => y(d.average_score ?? 100))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Circles
    g.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.date)!)
      .attr('cy', d => y(d.average_score ?? 100))
      .attr('r', 4.5)
      .attr('fill', '#090d16')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2);

    // X Axis
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).tickSize(4))
      .call(axis => axis.select('.domain').attr('stroke', '#334155'))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call(axis => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px');

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} className="overflow-visible" />;
};
