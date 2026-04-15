import React, { useCallback, useMemo, useState, useEffect } from 'react';
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
      0.25: 30,
      0.5: 60,
      1: 120,
      1.25: 150,
      1.5: 180,
      2: 240,
    },
  },
];

const QUANTITY_PRESETS = [0.25, 0.5, 1, 1.25, 1.5, 2];

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
  // items: cart items array. Each item at minimum has { id, name, quantity, unitName, price }
  const [items, setItems] = useState([]);
  // transactions state: saved completed sales
  const [transactions, setTransactions] = useState([]);

  // Helpers to find product definition by name
  const findProductByName = (name) => PRODUCTS.find((p) => p.name === name);

  // Adjust quantity helper: direction is +1 or -1
  const adjustItemQuantity = (index, direction) => {
    setItems((prev) => {
      const item = prev[index];
      if (!item) return prev;

      const product = findProductByName(item.name);

      // If it's a product with pricing map
      if (product) {
        const pricing = product.pricing;
        // find current preset index
        const curIdx = QUANTITY_PRESETS.findIndex((q) => q === item.quantity);
        if (curIdx === -1) {
          // current quantity not in presets - try to find nearest valid preset
          // fallback: remove item on negative, do nothing on positive
          if (direction < 0) {
            // remove item
            return prev.filter((_, i) => i !== index);
          }
          return prev;
        }

        if (direction > 0) {
          // find next preset that has pricing
          for (let i = curIdx + 1; i < QUANTITY_PRESETS.length; i++) {
            const q = QUANTITY_PRESETS[i];
            if (pricingHasQuantity(pricing, q)) {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                quantity: q,
                price: pricing[q],
              };
              return updated;
            }
          }
          // no next valid preset -> do nothing
          return prev;
        }

        if (direction < 0) {
          // find previous preset that has pricing
          for (let i = curIdx - 1; i >= 0; i--) {
            const q = QUANTITY_PRESETS[i];
            if (pricingHasQuantity(pricing, q)) {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                quantity: q,
                price: pricing[q],
              };
              return updated;
            }
          }
          // no previous valid preset -> remove item
          return prev.filter((_, i) => i !== index);
        }
      }

      // Manual / unknown product: if direction < 0 remove item, if >0 do nothing
      if (direction < 0) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  };

  const handleAddManualItem = () => {
    const cleaned = priceInput.trim().replace(',', '.');

    if (!/^\d+(\.\d+)?$/.test(cleaned)) {
      return;
    }

    const value = Number(cleaned);
    if (!Number.isFinite(value)) {
      return;
    }

    // add as a manual cart item (no pricing map)
    setItems((prev) => [
      ...prev,
      {
        id: nextId(),
        name: 'Manual',
        quantity: 1,
        unitName: 'unit',
        price: value,
      },
    ]);
    setPriceInput('');
  };

  const handleQuantityPress = useCallback(
    (quantity) => {
      if (!selectedProduct) return;
      const { pricing } = selectedProduct;
      if (!pricingHasQuantity(pricing, quantity)) return;
      const price = pricing[quantity];
      if (typeof price !== 'number' || !Number.isFinite(price)) return;

      setItems((prev) => {
        // find existing item with same name AND same unitName (more strict matching)
        const existingIndex = prev.findIndex(
          (it) => it.name === selectedProduct.name && it.unitName === selectedProduct.unitName,
        );

        if (existingIndex !== -1) {
          const existing = prev[existingIndex];
          // normalize to avoid floating-point errors when merging quantities
          const rawQuantity = existing.quantity + quantity;
          const newQuantity = Number(rawQuantity.toFixed(2));

          // debug logging for merge decision
          try {
            console.log({
              existingQuantity: existing.quantity,
              addedQuantity: quantity,
              rawResult: rawQuantity,
              normalizedResult: newQuantity,
              existsInPricing: pricingHasQuantity(pricing, newQuantity),
            });
          } catch (e) {
            // ignore logging errors
          }

          // only merge if pricing exists for the normalized quantity
          if (pricingHasQuantity(pricing, newQuantity)) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...existing,
              quantity: newQuantity,
              price: pricing[newQuantity],
            };
            return updated; // CRITICAL: stop execution here when merged
          }
        }

        // fallback: add as a new separate item
        return [
          ...prev,
          {
            id: nextId(),
            name: selectedProduct.name,
            quantity,
            unitName: selectedProduct.unitName,
            price,
          },
        ];
      });

      setSelectedProduct(null);
    },
    [selectedProduct],
  );

  const handleClearSale = () => {
    setItems([]);
    setPriceInput('');
    setSelectedProduct(null);
  };

  // Complete the current sale: save transaction and clear cart
  const completeSale = () => {
    if (!items || items.length === 0) return;

    const totalAmount = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0);

    const newTransaction = {
      id: Date.now(),
      items: items,
      totalAmount,
      createdAt: Date.now(),
    };

    setTransactions((prev) => [newTransaction, ...prev]);
    // clear cart
    setItems([]);
    setPriceInput('');
    setSelectedProduct(null);
  };

  // Dashboard helpers
  const getTodaySales = () => {
    const today = new Date().toDateString();
    return transactions
      .filter((tx) => new Date(tx.createdAt).toDateString() === today)
      .reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
  };

  const getTodayTransactionCount = () => {
    const today = new Date().toDateString();
    return transactions.filter((tx) => new Date(tx.createdAt).toDateString() === today)
      .length;
  };

  const getProductSalesCount = () => {
    const counts = {};
    transactions.forEach((tx) => {
      tx.items.forEach((item) => {
        if (!counts[item.name]) counts[item.name] = 0;
        counts[item.name] += 1;
      });
    });
    return counts;
  };

  const total = useMemo(() => items.reduce((sum, row) => sum + (Number(row.price) || 0), 0), [items]);

  // Log cart changes for debugging (visible in browser console)
  useEffect(() => {
    try {
      console.log('Cart updated:', items);
      console.log('Total:', total);
    } catch (e) {
      // ignore logging errors
    }
  }, [items, total]);

  const quantityOptionsForSelection = useMemo(() => {
    if (!selectedProduct) return [];
    return availableQuantities(selectedProduct.pricing);
  }, [selectedProduct]);

  const renderLine = ({ item, index }) => {
    const name = item.name;
    const quantity = item.quantity;
    const unitName = item.unitName || '';
    const price = Number(item.price) || 0;

    return (
      <View style={styles.itemRow}>
        <View style={styles.itemMain}>
          <Text style={styles.itemText}>{`${name} - ${formatQuantity(quantity)} ${unitName} - ${price.toFixed(2)}`}</Text>
        </View>
        <View style={styles.itemControls}>
          <Pressable onPress={() => adjustItemQuantity(index, -1)} style={({ pressed }) => [styles.controlBtn, pressed && styles.controlBtnPressed]}>
            <Text style={styles.controlBtnText}>-</Text>
          </Pressable>
          <Pressable onPress={() => adjustItemQuantity(index, +1)} style={({ pressed }) => [styles.controlBtn, pressed && styles.controlBtnPressed]}>
            <Text style={styles.controlBtnText}>+</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>POS Sale</Text>

      {/* Simple dashboard */}
      <View style={styles.dashboard}>
        <Text style={styles.dashboardText}>Today's Sales: KES {getTodaySales().toFixed(2)}</Text>
        <Text style={styles.dashboardText}>Transactions Today: {getTodayTransactionCount()}</Text>
        <View style={styles.topProducts}>
          <Text style={styles.dashboardSub}>Top Products:</Text>
          {Object.entries(getProductSalesCount())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => (
              <Text key={name} style={styles.productRowText}>{`${name} — ${count}`}</Text>
            ))}
        </View>
      </View>

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
        <Button title="Complete Sale" onPress={completeSale} color="#2E7D32" />
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
  itemMain: {
    flex: 1,
  },
  dashboard: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#FBFBFB',
  },
  dashboardText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  dashboardSub: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  topProducts: {
    marginTop: 6,
  },
  productRowText: {
    fontSize: 13,
    color: '#333',
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  controlBtn: {
    width: 40,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#1565C0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  controlBtnPressed: {
    opacity: 0.85,
  },
  controlBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
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
