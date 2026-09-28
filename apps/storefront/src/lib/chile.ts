import { data as territorialDivisions } from "chilean-territorial-divisions";

export const SANTIAGO_SHIPPING_RATE = 3_500;
export const REGIONS_SHIPPING_RATE = 7_000;

export const chileRegions = territorialDivisions.map((region) => ({
	code: region.region_iso_3166_2,
	name: region.region,
	communes: region.provincias
		.flatMap((province) => province.comunas)
		.map((commune) => ({
			code: commune.code,
			name: commune.name,
		}))
		.sort((first, second) => first.name.localeCompare(second.name, "es-CL")),
}));

export const getShippingRate = (regionCode: string) =>
	regionCode.toUpperCase() === "CL-RM"
		? SANTIAGO_SHIPPING_RATE
		: REGIONS_SHIPPING_RATE;

export const isValidChileAddressDivision = (
	regionCode: string,
	communeCode: string,
) =>
	chileRegions
		.find((region) => region.code === regionCode.toUpperCase())
		?.communes.some((commune) => commune.code === communeCode) ?? false;
