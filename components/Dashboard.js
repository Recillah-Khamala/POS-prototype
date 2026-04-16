import React from 'react';
import { View, Text } from 'react-native';

export default function Dashboard({ transactions = [] }) {
  const today = new Date().toDateString();

  const todaysTx = transactions.filter((tx) => new Date(tx.createdAt).toDateString() === today);

  const todaySales = todaysTx.reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);

  const todayCount = todaysTx.length;

  const counts = {};
  transactions.forEach((tx) => {
    tx.items.forEach((item) => {
      if (!counts[item.name]) counts[item.name] = 0;
      counts[item.name] += 1;
    });
  });

  const topProducts = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <View className="border border-gray-200 p-3 rounded-lg mb-4 bg-gray-50">
      <Text className="text-base font-semibold">Today's Sales: KES {todaySales.toFixed(2)}</Text>
      <Text className="text-base font-semibold mt-1">Transactions Today: {todayCount}</Text>
      <View className="mt-2">
        <Text className="font-semibold">Top Products:</Text>
        {topProducts.length === 0 ? (
          <Text className="text-sm text-gray-600">No products sold yet</Text>
        ) : (
          topProducts.map(([name, count]) => (
            <Text key={name} className="text-sm text-gray-800">{`${name} — ${count}`}</Text>
          ))
        )}
      </View>
    </View>
  );
}
