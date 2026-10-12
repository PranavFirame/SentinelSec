import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TrendDataPoint } from '../../types';

interface Props {
  data: TrendDataPoint[];
  width?: number;
  height?: number;
}

export const ScoreTrendChart: React.FC<Props> = ({ data, width = 640, height = 240 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [metric, setMetric] = useState<'score' | 'findings'>('score');

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
        .attr('font-size', '12px')
        .text('No historical assessments recorded');
      return;
    }

    const margin = { top: 20, right: 20, bottom: 30, left: 35 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Define Gradients
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'sa-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#167653').attr('stop-opacity', 0.25);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#167653').attr('stop-opacity', 0.0);

    const x = d3.scalePoint()
      .domain(data.map(d => d.date))
      .range([0, chartWidth])
      .padding(0.1);

    const getValue = (d: TrendDataPoint) => {
      if (metric === 'score') return d.average_score ?? 100;
      return (d.critical || 0) + (d.high || 0) + (d.medium || 0) + (d.low || 0);
    };

    const yMax = metric === 'score' ? 100 : Math.max(5, (d3.max(data, d => getValue(d)) || 5) * 1.25);
    const y = d3.scaleLinear()
      .domain([0, yMax])
      .range([chartHeight, 0]);

    // Gridlines (Simple Analytics style faint lines)
    g.append('g')
      .call(
        d3.axisLeft(y)
          .ticks(4)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
      )
      .call(axis => axis.select('.domain').remove())
      .selectAll('line')
      .attr('stroke', '#E5EAE6')
      .attr('stroke-dasharray', '2 3')
      .attr('stroke-opacity', 1);

    // Area Fill
    const area = d3.area<TrendDataPoint>()
      .x(d => x(d.date)!)
      .y0(chartHeight)
      .y1(d => y(getValue(d)))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#sa-gradient)')
      .attr('d', area);

    // Line Path
    const lineColor = '#167653';
    const line = d3.line<TrendDataPoint>()
      .x(d => x(d.date)!)
      .y(d => y(getValue(d)))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', lineColor)
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Interactive Hover Circles
    const dots = g.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.date)!)
      .attr('cy', d => y(getValue(d)))
      .attr('r', 4)
      .attr('fill', '#FFFFFF')
      .attr('stroke', lineColor)
      .attr('stroke-width', 2)
      .attr('class', 'cursor-pointer transition-all duration-150');

    dots
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('r', 6).attr('fill', lineColor);
        if (tooltipRef.current) {
          const val = getValue(d);
          tooltipRef.current.innerHTML = `
            <div class="text-[11px] font-semibold text-[#64716A] font-mono">${d.date}</div>
            <div class="text-sm font-bold font-mono text-[#17211D] mt-0.5">
              ${metric === 'score' ? `${val} / 100 Posture` : `${val} Findings`}
            </div>
          `;
          tooltipRef.current.style.opacity = '1';
        }
      })
      .on('mousemove', function (event) {
        if (tooltipRef.current && svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          tooltipRef.current.style.left = `${event.clientX - rect.left + 10}px`;
          tooltipRef.current.style.top = `${event.clientY - rect.top - 20}px`;
        }
      })
      .on('mouseleave', function () {
        d3.select(this).attr('r', 4).attr('fill', '#FFFFFF');
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '0';
        }
      });

    // X Axis
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(axis => axis.select('.domain').remove())
      .selectAll('text')
      .attr('dy', '1em')
      .attr('fill', '#64716A')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .call(axis => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#64716A')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

  }, [data, width, height, metric]);

  return (
    <div className="relative">
      {/* Metric Toggle Buttons (Simple Analytics Style) */}
      <div className="flex flex-wrap items-center justify-start sm:justify-end gap-1.5 sm:gap-2 mb-3">
        <button
          onClick={() => setMetric('score')}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
            metric === 'score'
              ? 'bg-[#EAF5EE] text-[#167653] border border-[#C6E6D5]'
              : 'text-[#64716A] hover:text-[#17211D]'
          }`}
        >
          Security Posture Score
        </button>
        <button
          onClick={() => setMetric('findings')}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
            metric === 'findings'
              ? 'bg-[#EAF5EE] text-[#167653] border border-[#C6E6D5]'
              : 'text-[#64716A] hover:text-[#17211D]'
          }`}
        >
          Exposures Discovered
        </button>
      </div>

      <div className="w-full overflow-x-auto pb-2">
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible min-w-[460px] sm:min-w-full"
        />
      </div>
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 transition-opacity duration-150 z-20 bg-white border border-[#E5EAE6] rounded-xl px-3 py-2 shadow-lg text-left"
        style={{ minWidth: '100px' }}
      />
    </div>
  );
};
