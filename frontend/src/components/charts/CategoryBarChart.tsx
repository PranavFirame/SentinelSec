import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CategoryCount } from '../../types';

interface Props {
  data: CategoryCount[];
  width?: number;
  height?: number;
}

export const CategoryBarChart: React.FC<Props> = ({ data, width = 380, height = 220 }) => {
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
        .attr('fill', '#64716A')
        .attr('font-size', '13px')
        .text('No category telemetry recorded');
      return;
    }

    const margin = { top: 10, right: 40, bottom: 20, left: 130 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const y = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, chartHeight])
      .padding(0.28);

    const maxCount = d3.max(data, d => d.count) || 1;
    const x = d3.scaleLinear()
      .domain([0, maxCount * 1.15])
      .range([0, chartWidth]);

    // Bars with Simple Analytics green fill
    const bars = g
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('y', d => y(d.category)!)
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('rx', 4)
      .attr('fill', '#167653')
      .attr('opacity', 0.85)
      .attr('width', 0);

    bars
      .transition()
      .duration(600)
      .attr('width', d => x(d.count));

    // Value Labels
    g.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('y', d => y(d.category)! + y.bandwidth() / 2 + 4)
      .attr('x', d => x(d.count) + 8)
      .attr('fill', '#64716A')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .text(d => `${d.count} (${d.percentage}%)`);

    // Y Axis labels
    g.append('g')
      .call(d3.axisLeft(y).tickSize(0))
      .call(axis => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#17211D')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .style('text-anchor', 'end');

  }, [data, width, height]);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible min-w-[280px]"
      />
    </div>
  );
};
