/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const STARGAZE_GRAPH_URL = "https://graphql.mainnet.stargaze-apis.com/graphql";
const CONSTELLATIONS_GRAPH_URL = "https://constellations-api.mainnet.stargaze-apis.com/graphql";

import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { __DEV__ } from '@apollo/client/utilities/globals';

if (__DEV__) {
  // Adds messages only in a dev environment
  loadDevMessages();
  loadErrorMessages();
}


const client = new ApolloClient({
  uri: STARGAZE_GRAPH_URL,
  cache: new InMemoryCache(),
});

const constellation_client = new ApolloClient({
  uri: CONSTELLATIONS_GRAPH_URL,
  cache: new InMemoryCache()
});


type Collection = {
  name: string;
  description: string;
  contractAddress: string;
  floor: {
    amountUsd: number;
  };
  tokenCounts: {
    total: number;
  };
  creator: {
    address: string;
  }
};


type CollectionsData = {
  collections: {
    collections: Collection[]
  };
};


const GET_COLLECTION_OWNER = gql`
  query Collections($searchQuery: String, $limit: Int) {
    collections(searchQuery: $searchQuery, limit: $limit) {
      collections {
        name
        description
        contractAddress
        floor {
          amountUsd
        }
        creator {
          address
        }
        tokenCounts {
          total
        }
      }
    }
  }
`;

const GET_TOKENS_BY_COLLECTION_ADDRESS = gql`
query CollectionOwners($collectionAddr: String, $offset: Int, $limit: Int) {
    collection(collectionAddr: $collectionAddr) {
      owners (offset: $offset, limit: $limit) {
        owners {
          owner {
            addr
            name {
              name
            }
          }
          count
        }
      }
  }
}
`;

const GET_COLLECTION_INFO = gql`
query CollectionInfo($collectionAddr: String!) {
    collection(collectionAddr: $collectionAddr) {
      image
      name
      description
    }
}
`;

export const getCollectionInfo = async (collectionAddr: string) => {
  const data = await constellation_client.query({
    query: GET_COLLECTION_INFO,
    variables: { collectionAddr }
  });
  return data.data.collection;
}
export const getCollectionsAddresses = async(collectionName: string) => {
  const { data: collectionsData } = await client.query<CollectionsData>({
    query: GET_COLLECTION_OWNER,
    variables: {
      searchQuery: collectionName,
      limit: 100,
    }
  })

  return collectionsData.collections.collections;
}

export const getOwnerByCollectionName = async (collectionName: string) => {
  const { data: collectionsData } = await client.query<CollectionsData>({
    query: GET_COLLECTION_OWNER,
    variables: {
      searchQuery: collectionName,
      limit: 100,
    }
  })

  const collection = collectionsData.collections.collections[0];

  if (!collection) {
    console.error('Collection not found');
    return [];
  }

  const contract_address = collection.contractAddress;

  console.log("contract_address", contract_address);
  const owners = getOwnersByCollectionAddress(contract_address)
  return owners;
}


export const getOwnersByCollectionAddress = async (collectionAddr: string) => {
  const owners: any[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    try {
      const data = await constellation_client.query({
        query: GET_TOKENS_BY_COLLECTION_ADDRESS,
        variables: { collectionAddr, offset, limit }
      });

      const fetchedOwners = (data as any)?.data.collection.owners.owners || [];
      owners.push(...fetchedOwners);

      if (fetchedOwners.length < limit) break;
      offset += limit;
    } catch (error) {
      console.error("Error fetching owners:", error);
      break;
    }
  }
  return owners;
};

export const formatIpfsLink = (ipfsLink: string): string => {
  if (ipfsLink.startsWith("ipfs://")) {
    return ipfsLink.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return ipfsLink;
};
