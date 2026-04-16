import React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';

// Small local copy of formatQuantity to avoid coupling exports
function formatQuantity(q) {
  const n = Math.round(q * 1000) / 1000;
  if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
  const s = n.toFixed(3).replace(/\.?0+$/, '');
  return s;
}

export default function CartList({ items = [], adjustItemQuantity }) {
  const renderLine = ({ item, index }) => {
    const name = item.name;
    const quantity = item.quantity;
    const unitName = item.unitName || '';
    const price = Number(item.price) || 0;

    return (
      <View className="py-3 px-3 border border-gray-200 rounded mb-3 bg-gray-50 flex-row items-center">
        <View className="flex-1">
          <Text className="text-base">{`${name} - ${formatQuantity(quantity)} ${unitName} - ${price.toFixed(2)}`}</Text>
        </View>
        <View className="flex-row items-center ml-2">
          <Pressable onPress={() => adjustItemQuantity(index, -1)} className="w-10 h-9 rounded bg-blue-600 items-center justify-center ml-2">
            <Text className="text-white text-lg font-bold">-</Text>
          </Pressable>
          <Pressable onPress={() => adjustItemQuantity(index, 1)} className="w-10 h-9 rounded bg-blue-600 items-center justify-center ml-2">
            <Text className="text-white text-lg font-bold">+</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(row) => row.id}
      renderItem={renderLine}
      ListFooterComponent={() => <View className="h-3" />}
    />
  );
}
