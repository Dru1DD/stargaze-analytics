/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient('https://constellations-api.mainnet.stargaze-apis.com/graphql');

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
    name: {
      name: string;
      ownerAddr: string;
    };
  };
}

interface GetCollectionsParams {
  limit?: number;
  sortBy?: string;
  offset?: number;
  tokenOwnerAddr?: string;
  creatorAddr?: string;
}

interface CollectionsResponse {
  collections: {
    collections: Collection[];
    limit: number;
    offset: number;
    total: number;
  }
}

interface OwnersResponse {
  collections: {
    collections: {
      owners: {
        owners: CollectionOwner[]
      };
    }
  }
}


export const getCollections = async ({
  limit,
  sortBy,
  offset,
  tokenOwnerAddr,
  creatorAddr
}: GetCollectionsParams = {}): Promise<Collection[]> => {
  const query = gql`
    query Collections($limit: Int, $sortBy: CollectionSortBy, $offset: Int, $tokenOwnerAddr: String, $creatorAddr: String) {
      collections(limit: $limit, sortBy: $sortBy, offset: $offset, tokenOwnerAddr: $tokenOwnerAddr, creatorAddr: $creatorAddr) {
        collections {
          image
          description
          tokensCount
          website
          createdAt
          collectionAddr
          name
          mintedAt
          owners {
            totalCount
            owners {
              count
              owner {
                addr
                name {
                  name
                  ownerAddr
                }
              }
            }
          }
        }
        limit
        offset
        total
      }
    }
  `;
  const variables = { limit, sortBy, offset, tokenOwnerAddr, creatorAddr };
  const data = await client.request<CollectionsResponse>(query, variables);
  return data.collections.collections;
};

export const getOwnersByCollection = async (creatorAddr: string) => {
  const owners: any[] = []; // This will store all owners
  let offset = 0; 
  const limit = 100;

  while (true) {
    const query = gql`
      query CollectionOwners($creatorAddr: String, $offset: Int, $limit: Int) {
        collections(creatorAddr: $creatorAddr) {
          collections {
            collectionAddr
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
      }
    `;

    try {
    
      const data = await client.request<OwnersResponse>(query, { creatorAddr, offset, limit });

      const fetchedOwners = (data as any)?.collections?.collections[0]?.owners?.owners || [];
      owners.push(...fetchedOwners);
      if (fetchedOwners.length < limit) break;
      offset += limit;

    } catch (error) {
      console.error("Error fetching owners:", error);
      break;
    }
  }

  console.log("All Owners:", owners);
  return owners;
};





export const formatIpfsLink = (ipfsLink: string): string => {
  if (ipfsLink.startsWith("ipfs://")) {
    return ipfsLink.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return ipfsLink;
};
