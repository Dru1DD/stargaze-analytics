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

export const BubbleMap: React.FC<BubbleMapProps> = ({ collections, owners }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    const initTooltip = useCallback(() => {
        return d3Tip()
            .attr("class", "d3-tip")
            .html((d) => {
                const isOwner = !!d.data.owner;
                return `
                    <div style="padding: 20px; max-width: 400px; background: black; color: white; border: 1px solid white; border-radius: 12px;">
                        ${isOwner 
                            ? `<strong>Owner Address:</strong> ${d.data.owner.addr}<br/>
                               <strong>Items Owned:</strong> ${d.data.count}`
                            : `<strong>${d.data.name}</strong><br/>
                               <img src="${formatIpfsLink(d.data.image)}" alt="${d.data.name}" width="50" height="50" style="border-radius: 4px;"/><br/>
                               <span>${d.data.description || "No description available"}</span><br/>
                               <strong>Tokens:</strong> ${d.data.tokensCount || 0}<br/>
                               <a href="${d.data.website || "#"}" target="_blank">Website</a>`
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
        const baseColor = "rgba(70, 130, 180, 0.5)"; // Semi-transparent blue for background
        const borderColor = "rgba(70, 130, 180, 0.8)"; // Slightly darker blue for border

        const data = owners.length > 0 ? owners : collections;

        const pack = d3.pack()
            .size([width, height])
            .padding(5);

        const root = d3.hierarchy<any>({ children: data })
            .sum((d) => d.tokensCount || d.count)
            .sort((a, b) => (b.tokensCount || b.count) - (a.tokensCount || a.count));

        pack(root);

        const tip = initTooltip();
        svg.call(tip);

        const node = svg
            .append("g")
            .selectAll("circle")
            .data(root.leaves())
            .join("circle")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", (d) => d.r)
            .attr("fill", baseColor)  // Semi-transparent blue fill
            .attr("stroke", borderColor)  // Darker blue border
            .attr("stroke-width", 2)  // Border thickness
            .on("mouseover", function (event, d) {
                d3.select(this).attr("fill", "orange");
                tip.show(d, this);
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", baseColor);
                tip.hide();
            })
            .on("click", (event, d) => {
                if (d.data.owner) {
                    navigator.clipboard.writeText(d.data.owner.addr).then(() => {
                        alert(`Owner address copied: ${d.data.owner.addr}`);
                    }).catch(console.error);
                }
            });

        node.call(
            d3.drag<SVGCircleElement, any>()
                .on("start", (event) => {
                    d3.select(event.sourceEvent.target).raise().attr("stroke", "black");
                })
                .on("drag", (event, d) => {
                    d3.select(event.sourceEvent.target)
                        .attr("cx", (d.x = event.x))
                        .attr("cy", (d.y = event.y));
                })
                .on("end", (event) => {
                    d3.select(event.sourceEvent.target).attr("stroke", null);
                })
        );

        svg.call(
            d3.zoom()
                .scaleExtent([0.5, 5])
                .on("zoom", ({ transform }) => {
                    svg.attr("transform", transform);
                })
        );
    }, [collections, owners, initTooltip]);

    useEffect(() => {
        renderBubbleMap();
    }, [renderBubbleMap]);

    return (
        <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 800 600"></svg>
    );
};
