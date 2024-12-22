/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import Image from "next/image";
import {
  formatIpfsLink,
  getCollectionInfo,
  getCollectionsAddresses,
  getOwnerByCollectionName,
  getOwnersByCollectionAddress,
} from "@/lib/api";
import { Collection, CollectionOwner } from "@/lib/types";
import { BubbleMap } from "@/lib/components/bubble-map";
import { LeftArrow } from "@/lib/components/left-arrow";
import { useRouter } from "next/navigation";

enum SearchType {
  NAME,
  CONTRACT,
}

const HomePage: React.FC = () => {
  const router = useRouter();
  const [isShowContent, setIsShowContent] = useState<boolean>(false);

  const [searchType, setSearchType] = useState<SearchType>(SearchType.NAME);
  const [searchValue, setSearchValue] = useState<string>("");

  const [filteredCollections, setFilteredCollections] = useState<Collection[]>(
    []
  );
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>();
  const [collections, setCollections] = useState<Collection[]>([]);

  const [owners, setOwners] = useState<CollectionOwner[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

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
      let ownersData: CollectionOwner[] = [];
      if (searchType === SearchType.NAME) {
        if (!selectedCollection) {
          ownersData = await getOwnerByCollectionName(searchValue);
        } else {
          console.log("sjaslfna",         selectedCollection)
          ownersData = await getOwnersByCollectionAddress(
            // @ts-ignore
            selectedCollection.contractAddress
          );
        }
      }

      if (searchType === SearchType.CONTRACT) {
        const collectionInfo = await getCollectionInfo(searchValue);

        setSelectedCollection({
          ...collectionInfo,
          contractAddress: searchValue,
        });
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

  const inputHandler = async (e: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);

    if (searchType === SearchType.CONTRACT) {
      if (!e.target.value.startsWith("stars")) {
        setError("Invalid contract address. It must start with 'stars...'.");
      } else if (e.target.value.length < 20) {
        setError("Invalid contract address.");
      } else {
        setError("");
      }
    } else {
      setError("");

      try {
        const collectionsData = await getCollectionsAddresses(e.target.value);

        setFilteredCollections(collectionsData as any);
        setShowSuggestions(true);
      } catch (fetchError) {
        console.error("Error fetching collection suggestions:", fetchError);
        setFilteredCollections([]);
      }
    }
    setSearchValue(e.target.value);
  };

  const handleSuggestionClick = async (collection: Collection) => {
    setSearchValue(collection.name);    
    const collectionInfo = await getCollectionInfo(collection.contractAddress!);

    setSelectedCollection({
      ...collectionInfo,
      contractAddress: collection.contractAddress,
    });
    setShowSuggestions(false);
  };

  const navigateToStargaze = () => {
    router.push(
      `https://www.stargaze.zone/m/${selectedCollection?.contractAddress}/tokens`
    );
  };

  return (
    <div className="bg-gradient w-full h-screen overflow-hidden flex">
      {!isShowContent ? (
        <div className="h-full w-full bg-gray-800 flex justify-center items-center">
          <div className="bg-gray-800 p-5 rounded-lg shadow-2xl w-full lg:w-[400px]">
            <h1 className="text-2xl text-white mb-4">
              Stargaze NFT Collections
            </h1>
            {error && <div className="text-red-500">{error}</div>}
            <select
              className="border-b border-white text-white my-4 py-2 px-4 bg-transparent w-full transition-all duration-300 hover:bg-gray-700"
              value={searchType}
              onChange={(e) => {
                setSearchType(Number(e.target.value));
                setSearchValue("");
                setShowSuggestions(false);
              }}
            >
              <option value={SearchType.NAME}>By collection name</option>
              <option value={SearchType.CONTRACT}>By collection address</option>
            </select>
            <div className="relative">
              <input
                type="text"
                placeholder="Input creator address or collection name"
                className="border-b border-white text-white px-5 py-2 mb-4 rounded rounded-b-none w-full bg-transparent transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchValue}
                onChange={inputHandler}
              />
              {showSuggestions && (
                <>
                  <ul className="absolute z-50 w-full min-w-[335px] lg:max-w-[360px] bg-gray-800 text-white border-gray-300 max-h-52 overflow-y-auto transition-all duration-300">
                    {filteredCollections.length > 0 ? (
                      filteredCollections.map((collection: any) => (
                        <li
                          key={collection.contractAddress}
                          className="px-4 py-2 hover:bg-gray-600 cursor-pointer border-[0.25px]"
                          onClick={() => handleSuggestionClick(collection)}
                        >
                          {collection.name}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-gray-400">
                        No collections found
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full transition-all duration-300"
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
              <div className="absolute top-0 w-full h-20 bg-black flex flex-row justify-between items-center px-10">
                <div
                  className="cursor-pointer hover:underline"
                  onClick={() => setIsShowContent(false)}
                >
                  <div className="flex flex-row justify-center items-center">
                    <LeftArrow className="text-white size-5 mr-3" />
                    Back
                  </div>
                </div>
                <div
                  className="cursor-pointer hover:underline flex flex-row justify-center items-center"
                  onClick={navigateToStargaze}
                >
                  {selectedCollection?.name}
                  {selectedCollection && (
                    <Image
                      src={formatIpfsLink(selectedCollection.image)}
                      alt="collection image "
                      width={50}
                      height={50}
                      className="ml-5 "
                    />
                  )}
                </div>
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
