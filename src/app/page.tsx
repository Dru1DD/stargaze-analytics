"use client";

import React, { useEffect, useRef, useState, ChangeEvent } from 'react';
import { formatIpfsLink, getCollections, getOwnersByCollection } from '@/lib/api';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';

// Интерфейсы для типизации данных
interface Collection {
  image: string;
  description: string;
  tokensCount: number;
  website: string;
  createdAt: string;
  collectionAddr: string;
  name: string;
  mintedAt: string;
}

interface CollectionOwner {
  count: number;
  owner: {
    addr: string;
    name?: {
      name: string;
      ownerAddr: string;
    };
  };
}

interface BubbleMapProps {
  collections: Collection[];
  owners: CollectionOwner[];
}

const BubbleMap: React.FC<BubbleMapProps> = ({ collections, owners }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear before rendering

    const width = 800;
    const height = 600;

    const zoom = d3.zoom()
      .scaleExtent([0.5, 5])
      .on("zoom", ({ transform }) => svg.attr("transform", transform));

    svg.call(zoom);

    const pack = d3.pack()
      .size([width, height])
      .padding(5);

    // Use owners if they exist, otherwise use collections
    const data = owners && owners.length > 0 ? owners : collections;

    const root = d3.hierarchy<any>({ children: data })
      .sum(d => d.tokensCount || d.count) // Use count for owners
      .sort((a, b) => (b.tokensCount || b.count) - (a.tokensCount || a.count));

    pack(root);

    const tip = d3Tip()
      .attr('class', 'd3-tip')
      .html(d => {
        const isOwner = !!d.data.owner;
        if (isOwner) {
          return `
            <div style="padding: 20px; background: black; color: white; border: 1px solid white; border-radius: 12px;">
              <strong>Owner Address:</strong> ${d.data.owner.addr}<br/>
              <strong>Items Owned:</strong> ${d.data.count}
            </div>
          `;
        } else {
          return `
            <div style="padding: 20px; background: black; color: white; border: 1px solid white; border-radius: 12px;">
              <strong>${d.data.name}</strong><br/>
              <img src="${formatIpfsLink(d.data.image)}" alt="${d.data.name}" width="50" height="50" style="border-radius: 4px;"/><br/>
              <span>${d.data.description || 'No description available'}</span><br/>
              <strong>Tokens:</strong> ${d.data.tokensCount || 0}<br/>
              <a href="${d.data.website || '#'}" target="_blank">Website</a>
            </div>
          `;
        }
      });

    svg.call(tip);

    const node = svg.append('g')
      .selectAll('circle')
      .data(root.leaves())
      .enter()
      .append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.r)
      .style('fill', owners && owners.length > 0 ? 'lightcoral' : 'steelblue') // Change color for owners
      .on('mouseover', function (event, d) {
        d3.select(this).style('fill', 'orange');
        tip.show(d, this);
      })
      .on('mouseout', function () {
        d3.select(this).style('fill', owners.length > 0 ? 'lightcoral' : 'steelblue');
        tip.hide();
      })
      .on('click', (event, d) => {
        if (d.data.owner) { // Check if it is an owner
          navigator.clipboard.writeText(d.data.owner.addr)
            .then(() => {
              console.log("Owner address copied to clipboard:", d.data.owner.addr);
              alert(`Owner address copied: ${d.data.owner.addr}`); // Optional: alert user
            })
            .catch(err => {
              console.error("Error copying address: ", err);
            });
        }
      });

    node.call(d3.drag<SVGCircleElement, any>()
      .on("start", (event, d) => {
        d3.select(event.sourceEvent.target).raise().attr("stroke", "black");
      })
      .on("drag", (event, d) => {
        d3.select(event.sourceEvent.target).attr("cx", d.x = event.x).attr("cy", d.y = event.y);
      })
      .on("end", (event) => {
        d3.select(event.sourceEvent.target).attr("stroke", null);
      })
    );

  }, [collections, owners]);

  return (
    <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 800 600"></svg>
  );
};


const HomePage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [owners, setOwners] = useState<CollectionOwner[]>([]);
  const [contractAddr, setContractAddr] = useState<string>('');

  useEffect(() => {
    const fetchCollectionsData = async () => {
      try {
        const collectionsData = await getCollections({ limit: 10 });
        setCollections(collectionsData);
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };

    fetchCollectionsData();
  }, []);

  const handleContractChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const newAddr = e.target.value;
    console.log("newAddrs", newAddr)
    setContractAddr(newAddr);
      try {
        const ownersData = await getOwnersByCollection(newAddr);
        console.log("OwnersData", ownersData)
        setOwners(ownersData);
      } catch (error) {
        console.error("Error fetching owners:", error);
        setOwners([]);
      }
  };

  return (
    <div className="p-10">
      <div className="bg-black z-1000">
      <h1>Stargaze NFT Collections</h1>
      <input
        type="text"
        placeholder="Enter collection contract address"
        className="bg-black border-b border-white text-white px-5 py-2"
        value={contractAddr}
        onChange={handleContractChange}
      />
      </div>
      <BubbleMap collections={collections} owners={owners} />
    </div>
  );
};

export default HomePage;
