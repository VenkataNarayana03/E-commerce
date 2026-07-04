import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  const persist = (nextItems) => {
    setItems(nextItems);
    localStorage.setItem("cart", JSON.stringify(nextItems));
  };

  const addToCart = (product, quantity = 1) => {
    const existing = items.find((item) => item.id === product.id);
    const nextItems = existing
      ? items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      : [...items, { ...product, quantity }];
    persist(nextItems);
  };

  const removeFromCart = (productId) => {
    persist(items.filter((item) => item.id !== productId));
  };

  const clearCart = () => persist([]);

  const value = useMemo(
    () => ({ items, addToCart, removeFromCart, clearCart }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}

