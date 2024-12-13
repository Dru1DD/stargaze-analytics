"use client";

import React, { useEffect, useState } from "react";
import { getOwnerByCollectionName } from "@/lib/api";
import { Collection, CollectionOwner } from "@/lib/types";
import { BubbleMap } from "@/lib/components/bubble-map";

const HomePage: React.FC = () => {
  const [searchValue, setSearchValue] = useState<string>("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [owners, setOwners] = useState<CollectionOwner[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchCollectionsData = async () => {
      try {
        setCollections([]);
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };

    fetchCollectionsData();
  }, []);

  const handleContractChange = async () => {
    setLoading(true); 

    try {
      const ownersData = await getOwnerByCollectionName(searchValue);
      setOwners(ownersData as CollectionOwner[]);
    } catch (error) {
      console.error("Error fetching owners:", error);
      setOwners([]);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="bg-gradient w-full h-screen overflow-hidden flex">
      <div className="h-full w-full p-10">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-full">
            <span className="animate-ping size-7 rounded-full bg-sky-400 opacity-75"></span>
            <span className="mt-5">Loading...</span>
          </div>
        ) : (
          <BubbleMap collections={collections} owners={owners} />
        )}
      </div>
      <div className="h-full bg-gray-800 px-5 pt-10">
        <div className="bg-gray-800 z-1000 p-5 rounded-lg shadow-lg">
          <h1 className="text-2xl text-white mb-4">Stargaze NFT Collections</h1>
          <input
            type="text"
            placeholder="Input creator address"
            className="border-b border-white text-white px-5 py-2 mb-4 rounded rounded-b-none w-full bg-transparent"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
            onClick={() => handleContractChange()}
          >
            Get Addresses
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
