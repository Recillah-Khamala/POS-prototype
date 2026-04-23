import React from 'react';
import { View, Text, Pressable, TouchableOpacity } from 'react-native';

// Local formatter (same behavior as in SalesScreen)
function formatQuantity(q) {
  const n = Math.round(q * 1000) / 1000;
  if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
  const s = n.toFixed(3).replace(/\.?0+$/, '');
  return s;
}

export default function ProductSelector({ products = [], selectedProduct, setSelectedProduct, onAddItem, quantityOptions = [] }) {
  return (
    <View className="mb-4">
      <Text className="text-lg font-bold mb-2">Products</Text>

      <View className="flex-row flex-wrap gap-2">
        {products.map(p => (
          <TouchableOpacity
            key={p.id}
            onPress={() => setSelectedProduct(p)}
            className="bg-gray-200 px-4 py-3 rounded-lg"
          >
            <Text className="text-base font-medium">{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedProduct ? (
        <View className="border border-blue-600 rounded-lg p-3 mb-4 bg-blue-50 w-full">
          <Text className="font-semibold mb-2">{selectedProduct.name} — pick quantity ({selectedProduct.unitName})</Text>
          {quantityOptions.length === 0 ? (
            <Text className="text-sm text-gray-600">No prices for standard quantities.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2 w-full">
              {quantityOptions.map((q) => {
                const unitPrice = selectedProduct.pricing[q];
                return (
                  <Pressable
                    key={String(q)}
                    onPress={() => onAddItem(q)}
                    className="flex-basis-[22%] flex-grow min-h-[48px] items-center justify-center rounded-md bg-blue-600 px-2 py-3"
                  >
                    <Text className="text-white text-lg font-bold">{formatQuantity(q)}</Text>
                    <Text className="text-white text-sm font-semibold mt-1">{unitPrice}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}
