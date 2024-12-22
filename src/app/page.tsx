"use client";

import React, { useEffect, useState } from "react";
import { getOwnerByCollectionName, getOwnersByCollectionAddress } from "@/lib/api";
import { Collection, CollectionOwner } from "@/lib/types";
import { BubbleMap } from "@/lib/components/bubble-map";

enum SearchType  {
  NAME,
  CONTRACT
}

const HomePage: React.FC = () => {
  const [isShowContent, setIsShowContent] = useState<boolean>(false);
  const [searchType, setSearchType] = useState<SearchType>(SearchType.NAME);
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
    setIsShowContent(true);
    try {
      let ownersData: CollectionOwner[] = []
      if(searchType === SearchType.NAME) {
        ownersData = await getOwnerByCollectionName(searchValue);
      } 

      if(searchType === SearchType.CONTRACT) {
        ownersData = await getOwnersByCollectionAddress(searchValue);
      }

      setOwners(ownersData);
    } catch (error) {
      console.error("Error fetching owners:", error);
      setOwners([]);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="bg-gradient w-full h-screen overflow-hidden flex">
    {!isShowContent ? (
      <div className="h-full w-full bg-gray-800 flex justify-center items-center">
        <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
          <h1 className="text-2xl text-white mb-4">Stargaze NFT Collections</h1>
          <select
            className="border-b border-white text-white my-4 py-2 px-4 bg-transparent w-full"
            value={searchType}
            onChange={(e) => setSearchType(Number(e.target.value))}
          >
            <option value={SearchType.NAME}>By collection name</option>
            <option value={SearchType.CONTRACT}>By collection address</option>
          </select>
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
    ) : (
      <div className="h-full w-full">
        {loading ? (
             <div className="w-full h-full flex justify-center items-center">
               <div id="loaderContainer">
                   <div className="loader" id="loader"></div>
                   <div id="loaderText">Loading...</div>
               </div>
               </div>
        ) : (
          <>
          <div className="absolute top-0 w-full h-20 bg-black flex justify-between items-center px-10">
            <div className="cursor-pointer hover:underline" onClick={() => setIsShowContent(false)}>RETURN BACK</div>
          </div>
          <BubbleMap collections={collections} owners={owners} />
          </>
        )}
      </div>
    )}
    </div>
  );
};

export default HomePage;
