/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const CONSTELLATIONS_GRAPH_URL = "https://constellations-api.mainnet.stargaze-apis.com/graphql";

import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { __DEV__ } from '@apollo/client/utilities/globals';

if (__DEV__) {
  // Adds messages only in a dev environment
  loadDevMessages();
  loadErrorMessages();
}



const constellation_client = new ApolloClient({
  uri: CONSTELLATIONS_GRAPH_URL,
  cache: new InMemoryCache()
});



const GET_SALES = gql`
query GETSales($filterByCollectionAddrs: [String!], $offset: Int, $limit: Int) {
  sales(filterByCollectionAddrs: $filterByCollectionAddrs, offset: $offset, limit: $limit) {
    total
    sales {
      seller
      buyer
      salePrice
      saleDenom
      saleDenomSymbol
      saleType
    }
  }
}
  `;


const analyzeTransactions = (owners: any[]) => {
  try {
    const sellerStats = new Map<string, number>();
    const buyerStats = new Map<string, number>();
    const traderStats = new Map<string, {
      totalSales: number;
      totalPurchases: number;
      totalValueATOM: number;
      profitATOM: number;
      transactions: Array<{
        type: string;
        price: number;
        role: 'buyer' | 'seller';
      }>;
    }>();

    // Фильтруем только ATOM транзакции с валидными типами продаж
    const validTransactions = owners.filter(tx => 
      tx.saleDenomSymbol === "ATOM" && 
      ["collection-offer", "auction", "fixed-price"].includes(tx.saleType)
    );

    validTransactions.forEach(transaction => {
      const salePrice = parseFloat(transaction.salePrice) || 0;
      
      if (transaction.seller) {
        sellerStats.set(transaction.seller, (sellerStats.get(transaction.seller) || 0) + 1);
        
        const traderData = traderStats.get(transaction.seller) || {
          totalSales: 0,
          totalPurchases: 0,
          totalValueATOM: 0,
          profitATOM: 0,
          transactions: []
        };

        traderStats.set(transaction.seller, {
          ...traderData,
          totalSales: traderData.totalSales + 1,
          totalValueATOM: traderData.totalValueATOM + salePrice,
          profitATOM: traderData.profitATOM + salePrice, // Продажа увеличивает прибыль
          transactions: [...traderData.transactions, {
            type: transaction.saleType,
            price: salePrice,
            role: 'seller'
          }]
        });
      }
      
      if (transaction.buyer) {
        buyerStats.set(transaction.buyer, (buyerStats.get(transaction.buyer) || 0) + 1);
        
        const traderData = traderStats.get(transaction.buyer) || {
          totalSales: 0,
          totalPurchases: 0,
          totalValueATOM: 0,
          profitATOM: 0,
          transactions: []
        };

        traderStats.set(transaction.buyer, {
          ...traderData,
          totalPurchases: traderData.totalPurchases + 1,
          totalValueATOM: traderData.totalValueATOM + salePrice,
          profitATOM: traderData.profitATOM - salePrice, // Покупка уменьшает прибыль
          transactions: [...traderData.transactions, {
            type: transaction.saleType,
            price: salePrice,
            role: 'buyer'
          }]
        });
      }
    });

    // Фильтруем только активных трейдеров (которые и покупали, и продавали)
    console.log('\nТоп-5 активных трейдеров (покупки + продажи) по прибыли в ATOM:');
    const activeTraders = Array.from(traderStats.entries())
      .filter(([_, stats]) => stats.totalSales > 0 && stats.totalPurchases > 0)
      .sort((a, b) => b[1].profitATOM - a[1].profitATOM)
      .slice(0, 5);
      
    console.table(activeTraders.map(([address, stats]) => ({
      Адрес: address,
      'Всего продаж': stats.totalSales,
      'Всего покупок': stats.totalPurchases,
      'Общий объем (ATOM)': stats.totalValueATOM.toFixed(2),
      'Прибыль (ATOM)': stats.profitATOM.toFixed(2),
      'Средняя цена продажи': (stats.totalValueATOM / stats.totalSales).toFixed(2),
      'Средняя цена покупки': (stats.totalValueATOM / stats.totalPurchases).toFixed(2),
      'Соотношение продажи/покупки': (stats.totalSales / stats.totalPurchases).toFixed(2)
    })));

    console.log('\nВсе продавцы:');
    console.table(Array.from(sellerStats).map(([address, count]) => ({
      Адрес: address,
      'Количество продаж': count
    })));

    console.log('\nВсе покупатели:');
    console.table(Array.from(buyerStats).map(([address, count]) => ({
      Адрес: address,
      'Количество покупок': count
    })));
  } catch (e) {
    console.log('In analytics error', e);
  }
};

export const getOwnersByCollectionAddress = async () => {
  try {
    const owners: any[] = [];
    let offset = 0;
    const limit = 200;
  
    console.log("Start")
    const data = await constellation_client.query({
      query: GET_SALES,
      variables: { filterByCollectionAddrs: ["stars15acld802ke7e2x4ha2gkgsxe32szl3kps2qkr2nfp8nte4gp8ncs9zm3n2"], limit, offset }
    });


    owners.push(...data.data.sales.sales || []);
    // if (owners.length < limit) break;

    offset += limit;
    console.log("Данные получены, всего транзакций:", owners.length);
    analyzeTransactions(owners);
    return owners;
  } catch(e) {
    console.log('Error in getOwners func', e);
  }
};

getOwnersByCollectionAddress();
