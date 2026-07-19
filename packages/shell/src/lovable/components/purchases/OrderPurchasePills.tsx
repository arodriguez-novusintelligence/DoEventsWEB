interface OrderPurchasePill {
  orderId: string;
  orderNumber: string;
  orderDate: string;
}

interface OrderPurchasePillsProps {
  orders: OrderPurchasePill[];
  selectedOrderId: string;
  onSelect: (orderId: string) => void;
}

export function OrderPurchasePills({ orders, selectedOrderId, onSelect }: OrderPurchasePillsProps) {
  if (orders.length <= 1) return null;

  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-semibold text-muted-foreground">Orden de compra</p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
        {orders.map((order) => {
          const active = order.orderId === selectedOrderId;
          return (
            <button
              key={order.orderId}
              type="button"
              onClick={() => onSelect(order.orderId)}
              className={`min-w-[108px] shrink-0 rounded-2xl px-3 py-2.5 text-left transition-all ${
                active
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'border border-border bg-card text-foreground'
              }`}
            >
              <p className={`text-xs font-bold leading-tight ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                N°{order.orderNumber}
              </p>
              <p className={`mt-0.5 text-[10px] ${active ? 'text-primary-foreground/85' : 'text-muted-foreground'}`}>
                {order.orderDate}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default OrderPurchasePills;
