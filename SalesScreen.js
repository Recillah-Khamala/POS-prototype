import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';

const SalesScreen = () => {
  const [priceInput, setPriceInput] = useState('');
  const [items, setItems] = useState([]);

  const handleAddItem = () => {
    const cleaned = priceInput.trim().replace(',', '.');

    // Allow numbers with an optional decimal part only.
    if (!/^\d+(\.\d+)?$/.test(cleaned)) {
      return;
    }

    const value = Number(cleaned);
    if (!Number.isFinite(value)) {
      return;
    }

    setItems((prev) => [...prev, value]);
    setPriceInput('');
  };

  const handleClearSale = () => {
    setItems([]);
    setPriceInput('');
  };

  const total = useMemo(() => items.reduce((sum, item) => sum + item, 0), [items]);

  const renderItem = ({ item, index }) => (
    <View style={styles.itemRow}>
      <Text style={styles.itemText}>
        Item {index + 1}: {item.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>POS Sale</Text>

      <Text style={styles.label}>Enter Price</Text>
      <TextInput
        style={styles.input}
        value={priceInput}
        onChangeText={setPriceInput}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />

      <View style={styles.buttonWrap}>
        <Button title="Add Item" onPress={handleAddItem} />
      </View>

      <Text style={styles.label}>Items</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>No items yet</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(_, index) => `${index}`}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.totalText}>Total: {total.toFixed(2)}</Text>
      </View>

      <View style={styles.buttonWrap}>
        <Button title="Clear Sale" onPress={handleClearSale} color="#B00020" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 20,
    marginBottom: 14,
  },
  buttonWrap: {
    marginBottom: 18,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 12,
  },
  itemRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  itemText: {
    fontSize: 18,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 14,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingTop: 14,
    marginTop: 8,
    marginBottom: 14,
  },
  totalText: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default SalesScreen;
