import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Props {
  data: Record<string, number>;
  width?: number;
  height?: number;
}

export const SeverityDonutChart: React.FC<Props> = ({ data, width = 280, height = 220 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const chartData = [
      { label: 'Critical', key: 'critical', value: data.critical || 0, color: '#f43f5e' },
      { label: 'High', key: 'high', value: data.high || 0, color: '#fb923c' },
      { label: 'Medium', key: 'medium', value: data.medium || 0, color: '#fbbf24' },
      { label: 'Low', key: 'low', value: data.low || 0, color: '#38bdf8' },
      { label: 'Info', key: 'informational', value: data.informational || 0, color: '#94a3b8' },
    ].filter(d => d.value > 0);

    const total = d3.sum(chartData, d => d.value);

    const margin = 10;
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.65;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    if (total === 0) {
      // Empty state
      g.append('circle')
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', '#334155')
        .attr('stroke-width', 16)
        .attr('stroke-dasharray', '4 4');

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('fill', '#64748b')
        .attr('font-size', '13px')
        .text('No Findings');
      return;
    }

    const pie = d3.pie<any>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .padAngle(0.04)
      .cornerRadius(4);

    const arcHover = d3.arc<any>()
      .innerRadius(innerRadius - 2)
      .outerRadius(radius + 6)
      .padAngle(0.04)
      .cornerRadius(4);

    const paths = g
      .selectAll('path')
      .data(pie(chartData))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('class', 'transition-all duration-200 cursor-pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))');

    // Hover interactions
    paths
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', arcHover as any);

        if (tooltipRef.current) {
          const pct = Math.round((d.data.value / total) * 100);
          tooltipRef.current.innerHTML = `
            <div class="font-bold text-xs" style="color: ${d.data.color}">${d.data.label}</div>
            <div class="text-sm font-mono text-white">${d.data.value} findings (${pct}%)</div>
          `;
          tooltipRef.current.style.opacity = '1';
        }
      })
      .on('mousemove', function (event) {
        if (tooltipRef.current) {
          const rect = svgRef.current?.getBoundingClientRect();
          if (rect) {
            tooltipRef.current.style.left = `${event.clientX - rect.left + 10}px`;
            tooltipRef.current.style.top = `${event.clientY - rect.top - 20}px`;
          }
        }
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', arc as any);

        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '0';
        }
      });

    // Center Label
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('fill', '#f8fafc')
      .attr('font-size', '24px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .text(total);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.3em')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .text('Total Issues');

  }, [data, width, height]);

  return (
    <div className="relative flex flex-col items-center">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 transition-opacity duration-150 z-20 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 shadow-xl text-left"
        style={{ minWidth: '90px' }}
      />
    </div>
  );
};
