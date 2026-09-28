export type CatalogProduct = {
	sku: string;
	title: string;
	price: number;
	stock: number;
	category: "Biblias letra grande" | "Biblias infantiles" | "Biblias económicas";
	image: string;
};

// Fuente: data-files/Stock es por fe.xlsx. La planilla sigue siendo la fuente
// original hasta que estos registros se importen a Medusa.
export const products: CatalogProduct[] = [
	{
		sku: "103763-2",
		title: "Biblia Reina Valera 1960 letra grande, tapa semiflexible León",
		price: 15990,
		stock: 1,
		category: "Biblias letra grande",
		image: "/products/image16.png",
	},
	{
		sku: "103763-5",
		title: "Biblia Reina Valera 1960 letra grande, tapa semiflexible Flores",
		price: 15990,
		stock: 1,
		category: "Biblias letra grande",
		image: "/products/image11.png",
	},
	{
		sku: "103243",
		title: "Biblia para niños Amigos por Siempre RVR 1960",
		price: 15990,
		stock: 1,
		category: "Biblias infantiles",
		image: "/products/image15.png",
	},
	{
		sku: "102099",
		title: "Biblia económica NTV Edición Semilla",
		price: 7990,
		stock: 2,
		category: "Biblias económicas",
		image: "/products/image7.jpg",
	},
	{
		sku: "117123",
		title: "Biblia RVR 1960 letra grande León de Judá arcoíris",
		price: 23990,
		stock: 1,
		category: "Biblias letra grande",
		image: "/products/image19.png",
	},
	{
		sku: "112043",
		title: "Biblia RVR 1960 letra gigante Azul Claro Ancla",
		price: 15990,
		stock: 1,
		category: "Biblias letra grande",
		image: "/products/image3.png",
	},
	{
		sku: "103921-4",
		title: "Biblia RVC Misionera Rústica Flores",
		price: 7990,
		stock: 18,
		category: "Biblias económicas",
		image: "/products/image4.png",
	},
	{
		sku: "104990-1",
		title: "Biblia TLA Misionera Mujer Rosado",
		price: 7990,
		stock: 1,
		category: "Biblias económicas",
		image: "/products/image9.png",
	},
	{
		sku: "104991",
		title: "Biblia TLA Misionera Lila",
		price: 7990,
		stock: 1,
		category: "Biblias económicas",
		image: "/products/image6.png",
	},
	{
		sku: "104990",
		title: "Biblia TLA Misionera Color",
		price: 7990,
		stock: 2,
		category: "Biblias económicas",
		image: "/products/image13.png",
	},
	{
		sku: "198567",
		title: "Biblia RVR 1960 letra grande con cierre Marrón",
		price: 18990,
		stock: 1,
		category: "Biblias letra grande",
		image: "/products/image10.png",
	},
	{
		sku: "198566",
		title: "Biblia RVR 1960 letra grande con cierre e índice",
		price: 18990,
		stock: 1,
		category: "Biblias letra grande",
		image: "/products/image12.png",
	},
	{
		sku: "187655",
		title: "Biblia Dios Habla Hoy ultra económica Flores",
		price: 7990,
		stock: 19,
		category: "Biblias económicas",
		image: "/products/image5.png",
	},
	{
		sku: "103603-2",
		title: "Biblia Misionera Azul Blanca",
		price: 7990,
		stock: 20,
		category: "Biblias económicas",
		image: "/products/image18.png",
	},
	{
		sku: "103603-10",
		title: "Biblia Misionera Reina Valera 1960",
		price: 7990,
		stock: 24,
		category: "Biblias económicas",
		image: "/products/image8.jpg",
	},
	{
		sku: "101234-9",
		title: "Biblia Misionera RVR 1960 Blanco con Flores",
		price: 7990,
		stock: 19,
		category: "Biblias económicas",
		image: "/products/image17.png",
	},
	{
		sku: "134568",
		title: "Biblia Reina Valera 1960 tapa dura letra grande",
		price: 23990,
		stock: 1,
		category: "Biblias letra grande",
		image: "/products/image2.jpg",
	},
	{
		sku: "123452",
		title: "Biblia RVR 1960 Flores blanco y verde, Nombres de Dios",
		price: 23990,
		stock: 1,
		category: "Biblias letra grande",
		image: "/products/image1.jpg",
	},
	{
		sku: "133154",
		title: "Biblia RVR 1960 Crea en mí un corazón",
		price: 23990,
		stock: 1,
		category: "Biblias letra grande",
		image: "/products/image14.jpg",
	},
];

export const formatCLP = (amount: number) =>
	new Intl.NumberFormat("es-CL", {
		style: "currency",
		currency: "CLP",
		maximumFractionDigits: 0,
	}).format(amount);
