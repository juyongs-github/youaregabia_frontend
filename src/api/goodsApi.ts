import api from "./axios";

export interface Goods {
  goodsId: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: "CLOTHING" | "ACCESSORIES" | "ALBUM" | "ETC";
  imageUrl: string | null;
}

export interface CartItem {
  goodsId: number;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  stock: number;
}

export interface CreateOrderRequest {
  items: { goodsId: number; quantity: number }[];
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  totalAmount: number;
}

export interface OrderResult {
  orderId: number;
  tossOrderId: string;
  totalAmount: number;
  createdAt: string;
}

export const goodsApi = {
  getGoodsList: (category?: string) =>
    api.get<Goods[]>("/api/goods", { params: category ? { category } : {} }).then((r) => r.data),

  getGoodsDetail: (goodsId: number) =>
    api.get<Goods>(`/api/goods/${goodsId}`).then((r) => r.data),

  createOrder: (data: CreateOrderRequest) =>
    api.post<OrderResult>("/api/orders", data).then((r) => r.data),

  getMyOrders: () =>
    api.get<OrderResult[]>("/api/orders/me").then((r) => r.data),

  confirmPayment: (data: { paymentKey: string; orderId: string; amount: number }) =>
    api.post<void>("/api/payments/confirm", data).then((r) => r.data),
};

// 장바구니 localStorage 유틸 (유저별 분리)
let _cartKey = "cart_anonymous";

/** 로그인/로그아웃 시 호출 — 유저별 장바구니 키를 설정 */
export const initCart = (email?: string) => {
  _cartKey = email ? `cart_${email}` : "cart_anonymous";
};

export const cartUtils = {
  getCart: (): CartItem[] => {
    try {
      return JSON.parse(localStorage.getItem(_cartKey) || "[]");
    } catch {
      return [];
    }
  },
  saveCart: (cart: CartItem[]) => {
    localStorage.setItem(_cartKey, JSON.stringify(cart));
  },
  addItem: (item: CartItem) => {
    const cart = cartUtils.getCart();
    const existing = cart.find((c) => c.goodsId === item.goodsId);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + item.quantity, item.stock);
    } else {
      cart.push(item);
    }
    cartUtils.saveCart(cart);
  },
  removeItem: (goodsId: number) => {
    cartUtils.saveCart(cartUtils.getCart().filter((c) => c.goodsId !== goodsId));
  },
  updateQuantity: (goodsId: number, quantity: number) => {
    const cart = cartUtils.getCart().map((c) =>
      c.goodsId === goodsId ? { ...c, quantity } : c
    );
    cartUtils.saveCart(cart);
  },
  clear: () => localStorage.removeItem(_cartKey),
  count: () => cartUtils.getCart().reduce((sum, c) => sum + c.quantity, 0),
};
