/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useCallback } from "react";
import { Collection, CollectionOwner } from "../types";
import * as d3 from "d3";
import d3Tip from "d3-tip";
import { formatIpfsLink } from "../api";

interface BubbleMapProps {
  collections: Collection[];
  owners: CollectionOwner[];
}

export const BubbleMap: React.FC<BubbleMapProps> = ({
  collections,
  owners,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const initTooltip = useCallback(() => {
    return (d3Tip as any)()
      .attr("class", "d3-tip")
      .html((d: any) => {
        const isOwner = !!d.data.owner;
        return `
                    <div style="padding: 20px; max-width: 400px; background: black; color: white; border: 1px solid white; border-radius: 12px;">
                        ${
                          isOwner
                            ? `<strong>Owner Address:</strong> ${d.data.owner.addr}<br/>
                               <strong>Items Owned:</strong> ${d.data.count}`
                            : `<strong>${d.data.name}</strong><br/>
                               <img src="${formatIpfsLink(
                                 d.data.image
                               )}" alt="${
                                d.data.name
                              }" width="50" height="50" style="border-radius: 4px;"/><br/>
                               <span>${
                                 d.data.description ||
                                 "No description available"
                               }</span><br/>
                               <strong>Tokens:</strong> ${
                                 d.data.tokensCount || 0
                               }<br/>
                               <a href="${
                                 d.data.website || "#"
                               }" target="_blank">Website</a>`
                        }
                    </div>
                `;
      });
  }, []);
  const renderBubbleMap = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear SVG

    const width = 800;
    const height = 600;
    const baseColor = "rgba(70, 130, 180, 0.5)";
    const borderColor = "rgba(70, 130, 180, 0.8)";

    const data = owners.length > 0 ? owners : collections;

    const pack = d3.pack().size([width, height]).padding(5);

    const root = d3
      .hierarchy<any>({ children: data })
      .sum((d) => d.tokensCount || d.count)
      .sort(
        (a: any, b: any) =>
          (b.tokensCount || b.count) - (a.tokensCount || a.count)
      );

    pack(root);

    const tip = initTooltip();
    svg.call(tip);

    // Создаём контейнерную группу для зума
    const container = svg.append("g");

    const node = container
      .selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
      .on("mouseover", function (event, d) {
        d3.select(this).select("circle").attr("fill", "orange");
        tip.show(d, this);
      })
      .on("mouseout", function () {
        d3.select(this).select("circle").attr("fill", baseColor);
        tip.hide();
      })
      .on("click", (event, d) => {
        if (d.data.owner) {
          navigator.clipboard
            .writeText(d.data.owner.addr)
            .then(() => {
              alert(`Owner address copied: ${d.data.owner.addr}`);
            })
            .catch(console.error);
        }
      });

    node
      .append("circle")
      .attr("r", (d: any) => d.r)
      .attr("fill", baseColor)
      .attr("stroke", borderColor)
      .attr("stroke-width", 2);

    node
      .append("text")
      .attr("dy", ".3em")
      .attr("text-anchor", "middle")
      .style("font-size", (d: any) => `${Math.min(d.r / 2, 20)}px`)
      .style("fill", "white")
      .text((d: any) => d.data.count || "");

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 5]) // Ограничиваем масштабирование
      .on("zoom", (event) => {
        container.attr("transform", event.transform); // Применяем трансформацию к контейнерной группе
      });

    svg.call(zoom as any);
  }, [collections, owners, initTooltip]);

  useEffect(() => {
    renderBubbleMap();
  }, [renderBubbleMap]);

  return (
    <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 800 600"></svg>
  );
};
