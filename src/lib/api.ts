/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const STARGAZE_GRAPH_URL = "https://graphql.mainnet.stargaze-apis.com/graphql";
const client = new ApolloClient({
  uri: STARGAZE_GRAPH_URL,
  cache: new InMemoryCache(),
});

type TokenOwner = {
  owner: {
    address: string;
  };
};

type TokensData = {
  tokens: {
    tokens: TokenOwner[];
  };
};

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
query Tokens($collectionAddr: String!, $limit: Int, $offset: Int) {
  tokens(collectionAddr: $collectionAddr, limit: $limit, offset: $offset) {
    tokens {
      owner {
        address
      }
    }
  }
}
`;

export const getOwnerByCollectionName = async (collectionName: string) => {
  const { data: collectionsData } = await client.query<CollectionsData>({
    query: GET_COLLECTION_OWNER,
    variables: {
      searchQuery: collectionName,
      limit: 1,
    }
  })

  const collection = collectionsData.collections.collections[0];

  if (!collection) {
    console.error('Collection not found');
    return [];
  }

  const contract_address = collection.contractAddress;
  const total_count = collection.tokenCounts.total;

  let allTokens: any[] = [];
  let fetchedTokens: any[] | null = null;
  let offset: number = 0;
  const limit = 100;


  while (allTokens.length < total_count && (fetchedTokens === null || fetchedTokens.length > 0)) {
    const { data: tokensData } = await client.query<TokensData>({
      query: GET_TOKENS_BY_COLLECTION_ADDRESS,
      variables: {
        collectionAddr: contract_address,
        limit: limit,
        offset: offset 
      }
    });
    fetchedTokens = tokensData.tokens.tokens;

    if (!fetchedTokens || fetchedTokens.length === 0) {
      console.warn("No more tokens to fetch. Exiting loop.");
      break;
    }

    allTokens = allTokens.concat(fetchedTokens);
    offset += limit; 
  }

  const ownerMap = allTokens.reduce((acc, token) => {
    const ownerAddr = token.owner.address;
    if (!acc[ownerAddr]) {
      acc[ownerAddr] = 0;
    }
    acc[ownerAddr]++;
    return acc;
  }, {} as Record<string, number>);


  return Object.entries(ownerMap).map(([addr, count]) => ({
    count,
    owner: {
      addr,
    },
  }));
}


export const formatIpfsLink = (ipfsLink: string): string => {
  if (ipfsLink.startsWith("ipfs://")) {
    return ipfsLink.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return ipfsLink;
};
