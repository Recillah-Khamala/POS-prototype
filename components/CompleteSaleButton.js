import React from 'react';
import { View, Button } from 'react-native';

export default function CompleteSaleButton({ completeSale }) {
  return (
    <View className="absolute left-0 right-0 bottom-0 p-3 px-4 bg-white border-t border-gray-200">
      <Button title="Complete Sale" onPress={completeSale} color="#2E7D32" />
    </View>
  );
}
