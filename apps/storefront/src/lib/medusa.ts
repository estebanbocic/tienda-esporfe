import Medusa from "@medusajs/js-sdk";

const baseUrl = import.meta.env.PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const publishableKey = import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY;

export const medusa = new Medusa({
	baseUrl,
	debug: import.meta.env.DEV,
	publishableKey,
});
