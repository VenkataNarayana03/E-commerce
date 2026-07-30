import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext.jsx";
import { cartService } from "../services/cartService.js";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartState, setCartState] = useState({
    items: [],
    subtotal: 0,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(false);

  // Sync cart with backend when user is logged in
  const fetchCart = useCallback(async () => {
    if (!user) {
      const localCart = localStorage.getItem("guest_cart");
      const items = localCart ? JSON.parse(localCart) : [];
      const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
      const subtotal = items.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0);
      setCartState({ items, subtotal, totalItems });
      return;
    }

    setLoading(true);
    try {
      const data = await cartService.getCart();
      setCartState({
        items: data.items,
        subtotal: Number(data.subtotal),
        totalItems: data.total_items,
      });
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product, quantity = 1) => {
    if (!user) {
      // Guest role restriction: Guests cannot add items or checkout according to role rules
      // Save item locally so guest can preview cart, but notify them about login requirements
      const localCart = localStorage.getItem("guest_cart");
      let items = localCart ? JSON.parse(localCart) : [];
      const existingIndex = items.findIndex((i) => i.product_id === product.id || i.id === product.id);
      
      if (existingIndex > -1) {
        items[existingIndex].quantity += quantity;
      } else {
        items.push({
          id: `guest_${product.id}`,
          product_id: product.id,
          quantity,
          product: product,
          price: product.price,
        });
      }
      localStorage.setItem("guest_cart", JSON.stringify(items));
      const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
      const subtotal = items.reduce((acc, i) => acc + Number(i.product.price) * i.quantity, 0);
      setCartState({ items, subtotal, totalItems });
      toast.info("Item added to cart! Please log in to complete your order.");
      return;
    }

    setLoading(true);
    try {
      const data = await cartService.addToCart(product.id, quantity);
      setCartState({
        items: data.items,
        subtotal: Number(data.subtotal),
        totalItems: data.total_items,
      });
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      const msg = error.response?.data?.detail || "Failed to add product to cart";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      return removeFromCart(cartItemId);
    }

    if (!user) {
      const localCart = localStorage.getItem("guest_cart");
      let items = localCart ? JSON.parse(localCart) : [];
      items = items.map((i) => (i.id === cartItemId ? { ...i, quantity: newQuantity } : i));
      localStorage.setItem("guest_cart", JSON.stringify(items));
      const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
      const subtotal = items.reduce((acc, i) => acc + Number(i.product.price) * i.quantity, 0);
      setCartState({ items, subtotal, totalItems });
      return;
    }

    setLoading(true);
    try {
      const data = await cartService.updateCartItem(cartItemId, newQuantity);
      setCartState({
        items: data.items,
        subtotal: Number(data.subtotal),
        totalItems: data.total_items,
      });
    } catch (error) {
      const msg = error.response?.data?.detail || "Failed to update quantity";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const increaseQuantity = (cartItem) => {
    const nextQty = cartItem.quantity + 1;
    if (cartItem.product && nextQty > cartItem.product.stock_quantity) {
      toast.warning(`Only ${cartItem.product.stock_quantity} available in stock!`);
      return;
    }
    updateQuantity(cartItem.id, nextQty);
  };

  const decreaseQuantity = (cartItem) => {
    if (cartItem.quantity <= 1) {
      removeFromCart(cartItem.id);
    } else {
      updateQuantity(cartItem.id, cartItem.quantity - 1);
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (!user) {
      const localCart = localStorage.getItem("guest_cart");
      let items = localCart ? JSON.parse(localCart) : [];
      items = items.filter((i) => i.id !== cartItemId);
      localStorage.setItem("guest_cart", JSON.stringify(items));
      const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
      const subtotal = items.reduce((acc, i) => acc + Number(i.product.price) * i.quantity, 0);
      setCartState({ items, subtotal, totalItems });
      toast.info("Item removed from cart");
      return;
    }

    setLoading(true);
    try {
      const data = await cartService.removeCartItem(cartItemId);
      setCartState({
        items: data.items,
        subtotal: Number(data.subtotal),
        totalItems: data.total_items,
      });
      toast.info("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) {
      localStorage.removeItem("guest_cart");
      setCartState({ items: [], subtotal: 0, totalItems: 0 });
      toast.info("Cart cleared");
      return;
    }

    setLoading(true);
    try {
      const data = await cartService.clearCart();
      setCartState({
        items: data.items,
        subtotal: Number(data.subtotal),
        totalItems: data.total_items,
      });
      toast.info("Cart cleared");
    } catch (error) {
      toast.error("Failed to clear cart");
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      items: cartState.items,
      subtotal: cartState.subtotal,
      totalItems: cartState.totalItems,
      loading,
      addToCart,
      updateQuantity,
      increaseQuantity,
      decreaseQuantity,
      removeFromCart,
      clearCart,
      fetchCart,
    }),
    [cartState, loading, fetchCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
