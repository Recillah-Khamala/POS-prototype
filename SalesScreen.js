import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView } from 'react-native';
import CartList from './components/CartList';
import ProductSelector from './components/ProductSelector';
import Dashboard from './components/Dashboard';
import CompleteSaleButton from './components/CompleteSaleButton';

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

  return (
    <View className="flex-1 bg-white px-4 py-5">
      <ScrollView className="pb-28">
        <Text className="text-3xl font-extrabold mb-4 text-center">POS Sale</Text>

      {/* Simple dashboard */}
      <Dashboard transactions={transactions} />

      <ProductSelector
        products={PRODUCTS}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        onAddItem={handleQuantityPress}
        quantityOptions={quantityOptionsForSelection}
      />

  <Text className="text-base font-semibold mt-1 mb-2">Manual price</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 text-xl mb-3"
        value={priceInput}
        onChangeText={setPriceInput}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
      <View className="mb-3">
        <Button title="Add Item" onPress={handleAddManualItem} />
      </View>

      <Text className="text-base font-semibold mt-1 mb-2">Sale items</Text>
      {items.length === 0 ? (
        <Text className="text-base text-gray-600 mb-3">No items yet</Text>
      ) : (
        <CartList items={items} adjustItemQuantity={adjustItemQuantity} />
      )}
      <View className="border-t border-gray-200 pt-3 mt-2 mb-2">
        <Text className="text-3xl font-extrabold text-center">Total: {total.toFixed(2)}</Text>
      </View>

      <View className="mb-3">
        <Button title="Clear Sale" onPress={handleClearSale} color="#B00020" />
      </View>
      </ScrollView>

      {/* Fixed footer component (Complete Sale) */}
      <CompleteSaleButton completeSale={completeSale} />
    </View>
  );
};

export default SalesScreen;
