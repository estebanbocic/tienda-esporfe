import { medusa } from "./medusa";

const CART_ID_KEY = "esporfe_cart_id";
const CART_QUERY = {
	fields: "+items.thumbnail,+items.total,+items.subtotal,+items.original_total,+items.tax_total,*items.variant,*shipping_methods,*payment_collection,*payment_collection.payment_sessions",
};

export type StoreCart = Awaited<ReturnType<typeof medusa.store.cart.retrieve>>["cart"];

export const getCartId = () => localStorage.getItem(CART_ID_KEY);

export const clearCartId = () => localStorage.removeItem(CART_ID_KEY);

export const formatMoney = (amount: number | null | undefined) =>
	new Intl.NumberFormat("es-CL", {
		style: "currency",
		currency: "CLP",
		maximumFractionDigits: 0,
	}).format(amount ?? 0);

export const lineItemTotal = (item: {
	total?: number | null;
	unit_price?: number | null;
	quantity: number;
}) => item.total ?? (item.unit_price ?? 0) * item.quantity;

export async function getCart(): Promise<StoreCart | null> {
	const cartId = getCartId();

	if (!cartId) return null;

	try {
		return (await medusa.store.cart.retrieve(cartId, CART_QUERY)).cart;
	} catch {
		clearCartId();
		return null;
	}
}

async function createCart() {
	const { regions } = await medusa.store.region.list({ limit: 20 });
	const chile = regions.find((region) => region.currency_code === "clp");

	if (!chile) {
		throw new Error("La región de Chile no está configurada en la tienda.");
	}

	const { cart } = await medusa.store.cart.create({ region_id: chile.id });
	localStorage.setItem(CART_ID_KEY, cart.id);
	return cart;
}

export async function getOrCreateCart() {
	return (await getCart()) ?? createCart();
}

export async function addSkuToCart(sku: string, quantity = 1) {
	const cart = await getOrCreateCart();
	const { products } = await medusa.store.product.list({
		limit: 100,
		fields: "id,*variants",
	});
	const variant = products
		.flatMap((product) => product.variants ?? [])
		.find((candidate) => candidate.sku === sku);

	if (!variant) {
		throw new Error("No encontramos esta variante en el catálogo de Medusa.");
	}

	const result = await medusa.store.cart.createLineItem(
		cart.id,
		{
			variant_id: variant.id,
			quantity,
		},
		CART_QUERY,
	);

	document.dispatchEvent(new CustomEvent("esporfe:cart-updated", { detail: result.cart }));
	return result.cart;
}

export async function updateCartLineItem(cartId: string, lineItemId: string, quantity: number) {
	const { cart } = await medusa.store.cart.updateLineItem(
		cartId,
		lineItemId,
		{ quantity },
		CART_QUERY,
	);

	document.dispatchEvent(new CustomEvent("esporfe:cart-updated", { detail: cart }));
	return cart;
}

export async function removeCartLineItem(cartId: string, lineItemId: string) {
	const { parent: cart } = await medusa.store.cart.deleteLineItem(
		cartId,
		lineItemId,
		CART_QUERY,
	);

	document.dispatchEvent(new CustomEvent("esporfe:cart-updated", { detail: cart }));
	return cart;
}

export const cartItemCount = (cart: StoreCart | null) =>
	(cart?.items ?? []).reduce((total, item) => total + item.quantity, 0);

export async function refreshCartCount() {
	const cart = await getCart();
	const count = cartItemCount(cart);

	document.querySelectorAll<HTMLElement>("[data-cart-count]").forEach((element) => {
		element.textContent = String(count);
	});

	document.querySelectorAll<HTMLElement>("[data-cart-link]").forEach((element) => {
		element.setAttribute("aria-label", `Abrir carro, ${count} productos`);
	});
}

export function initializeCartCount() {
	void refreshCartCount();
	document.addEventListener("esporfe:cart-updated", () => void refreshCartCount());
}
