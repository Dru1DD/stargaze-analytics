
export interface Collection {
    image: string;
    description: string;
    tokensCount: number;
    website: string;
    createdAt: string;
    collectionAddr: string;
    contractAddress?: string;
    name: string;
    mintedAt: string;
}

export interface CollectionOwner {
    count: number;
    owner: {
        addr: string;
        name?: {
            name: string;
            ownerAddr: string;
        };
    };
}

