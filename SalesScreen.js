import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';

const PRODUCTS = [
  {
    id: 'beans',
    name: 'Beans',
    unitName: 'korokoro',
    pricing: {
      0.25: 90,
      0.5: 180,
      1: 350,
      1.5: 520,
    },
  },
  {
    id: 'maize',
    name: 'Maize',
    unitName: 'korokoro',
    pricing: {
      0.25: 85,
      0.5: 170,
      1: 330,
      1.5: 490,
    },
  },
];

const QUANTITY_PRESETS = [0.25, 0.5, 1, 1.5];

function pricingHasQuantity(pricing, quantity) {
  return Object.prototype.hasOwnProperty.call(pricing, quantity);
}

function availableQuantities(pricing) {
  return QUANTITY_PRESETS.filter((q) => pricingHasQuantity(pricing, q));
}

function formatQuantity(q) {
  const n = Math.round(q * 1000) / 1000;
  if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
  const s = n.toFixed(3).replace(/\.?0+$/, '');
  return s;
}

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const SalesScreen = () => {
  const [priceInput, setPriceInput] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [items, setItems] = useState([]);

  const handleAddManualItem = () => {
    const cleaned = priceInput.trim().replace(',', '.');

    if (!/^\d+(\.\d+)?$/.test(cleaned)) {
      return;
    }

    const value = Number(cleaned);
    if (!Number.isFinite(value)) {
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: nextId(),
        kind: 'manual',
        lineTotal: value,
      },
    ]);
    setPriceInput('');
  };

  const handleQuantityPress = useCallback(
    (quantity) => {
      if (!selectedProduct) return;
      const { pricing } = selectedProduct;
      if (!pricingHasQuantity(pricing, quantity)) return;
      const lineTotal = pricing[quantity];
      if (typeof lineTotal !== 'number' || !Number.isFinite(lineTotal)) return;
      setItems((prev) => [
        ...prev,
        {
          id: nextId(),
          kind: 'product',
          productName: selectedProduct.name,
          quantity,
          unitName: selectedProduct.unitName,
          lineTotal,
        },
      ]);
      setSelectedProduct(null);
    },
    [selectedProduct],
  );

  const handleClearSale = () => {
    setItems([]);
    setPriceInput('');
    setSelectedProduct(null);
  };

  const total = useMemo(
    () => items.reduce((sum, row) => sum + row.lineTotal, 0),
    [items],
  );

  const quantityOptionsForSelection = useMemo(() => {
    if (!selectedProduct) return [];
    return availableQuantities(selectedProduct.pricing);
  }, [selectedProduct]);

  const renderLine = ({ item }) => {
    let line;
    if (item.kind === 'product') {
      line = `${item.productName} - ${formatQuantity(item.quantity)} ${item.unitName} - ${item.lineTotal.toFixed(2)}`;
    } else {
      line = `Manual - ${item.lineTotal.toFixed(2)}`;
    }
    return (
      <View style={styles.itemRow}>
        <Text style={styles.itemText}>{line}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>POS Sale</Text>

      <Text style={styles.label}>Products</Text>
      <View style={styles.productRow}>
        {PRODUCTS.map((p) => {
          const isSelected = selectedProduct?.id === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => setSelectedProduct(isSelected ? null : p)}
              style={({ pressed }) => [
                styles.productChip,
                isSelected && styles.productChipSelected,
                pressed && styles.productChipPressed,
              ]}
            >
              <Text style={[styles.productChipText, isSelected && styles.productChipTextSelected]}>
                {p.name}
              </Text>
              <Text style={styles.productChipSub}>
                {p.unitName} · fixed prices
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selectedProduct ? (
        <View style={styles.qtyPanel}>
          <Text style={styles.qtyPanelTitle}>
            {selectedProduct.name} — pick quantity ({selectedProduct.unitName})
          </Text>
          {quantityOptionsForSelection.length === 0 ? (
            <Text style={styles.qtyEmpty}>No prices for standard quantities.</Text>
          ) : (
            <View style={styles.qtyRow}>
              {quantityOptionsForSelection.map((q) => {
                const unitPrice = selectedProduct.pricing[q];
                return (
                  <Pressable
                    key={String(q)}
                    onPress={() => handleQuantityPress(q)}
                    style={({ pressed }) => [styles.qtyBtn, pressed && styles.qtyBtnPressed]}
                  >
                    <Text style={styles.qtyBtnText}>{formatQuantity(q)}</Text>
                    <Text style={styles.qtyBtnSub}>{unitPrice}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      ) : null}

      <Text style={styles.label}>Manual price</Text>
      <TextInput
        style={styles.input}
        value={priceInput}
        onChangeText={setPriceInput}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
      <View style={styles.buttonWrap}>
        <Button title="Add Item" onPress={handleAddManualItem} />
      </View>

      <Text style={styles.label}>Sale items</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>No items yet</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(row) => row.id}
          renderItem={renderLine}
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
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  productRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  productChip: {
    minWidth: '44%',
    flexGrow: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  productChipSelected: {
    borderColor: '#1565C0',
    backgroundColor: '#E3F2FD',
  },
  productChipPressed: {
    opacity: 0.85,
  },
  productChipText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  productChipTextSelected: {
    color: '#0D47A1',
  },
  productChipSub: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  qtyPanel: {
    borderWidth: 1,
    borderColor: '#1565C0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    backgroundColor: '#FAFCFF',
  },
  qtyPanelTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  qtyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  qtyBtn: {
    flexBasis: '22%',
    flexGrow: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1565C0',
  },
  qtyBtnPressed: {
    opacity: 0.88,
  },
  qtyBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  qtyBtnSub: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  qtyEmpty: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 20,
    marginBottom: 10,
  },
  buttonWrap: {
    marginBottom: 12,
  },
  list: {
    flex: 1,
    minHeight: 120,
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
    fontSize: 17,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingTop: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  totalText: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default SalesScreen;
