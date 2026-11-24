/**
 * Illustrative regional photography for YouSee.
 * IMPORTANT: these images are NOT evidence about Bandar Lampung and are not
 * connected to any contribution. Every placement carries a disclosure.
 * Photos: Pexels contributors, used under the Pexels licence.
 */
export type Photo = {
  key: string;
  src: string;
  alt: string;
  caption: string;
  credit: string;
  theme: "city" | "flooding" | "community" | "environment";
  subject: string;
};

const img = (file: string) => `/images/${file.endsWith(".jpg") ? file : `${file}.jpg`}`;

export const PHOTOS: Record<string, Photo> = {
  "city-manila": {
    key: "city-manila",
    src: img("temanggung-village.jpg"),
    alt: "Hillside village in Temanggung, Central Java, Indonesia",
    caption: "A hillside village in Temanggung",
    credit: "Pexels · photo 38539723",
    theme: "city",
    subject: "Indonesia",
  },
  "city-pasig": {
    key: "city-pasig",
    src: img("mountain-village.jpg"),
    alt: "Village rooftops with mountains in the background",
    caption: "Rooftops in a mountain village",
    credit: "Pexels · photo 36832138",
    theme: "city",
    subject: "Regional village",
  },
  "city-night": {
    key: "city-night",
    src: img("city-night"),
    alt: "A dense city illuminated at night seen from above",
    caption: "City lights after dark",
    credit: "Ck Lacandazo / Pexels",
    theme: "city",
    subject: "Regional city imagery",
  },
  "city-baguio": {
    key: "city-baguio",
    src: img("city-baguio"),
    alt: "Colourful homes built across a hillside in Baguio, Philippines",
    caption: "Hillside neighbourhood, Baguio",
    credit: "Harvey Tan Villarino / Pexels",
    theme: "city",
    subject: "Philippines",
  },
  "flood-street": {
    key: "flood-street",
    src: img("flood-street"),
    alt: "People and vehicles moving through a flooded urban street",
    caption: "A flooded street after heavy rain",
    credit: "Faisal Ibne Kalam / Pexels",
    theme: "flooding",
    subject: "Illustrative flooding",
  },
  "flood-village": {
    key: "flood-village",
    src: img("flood-village"),
    alt: "A residential street submerged by floodwater in a tropical community",
    caption: "Water reaching the doorstep",
    credit: "Hussain Naushad / Pexels",
    theme: "flooding",
    subject: "Illustrative flooding",
  },
  "community-dialogue": {
    key: "community-dialogue",
    src: img("community-dialogue"),
    alt: "Residents talking together around a wooden table outdoors",
    caption: "A conversation between neighbours",
    credit: "Jeff Vinluan / Pexels",
    theme: "community",
    subject: "Community engagement",
  },
  "community-volunteers": {
    key: "community-volunteers",
    src: img("community-volunteers"),
    alt: "Volunteers cleaning up a public park together",
    caption: "Residents caring for shared space",
    credit: "Galib Rahman Nadim / Pexels",
    theme: "community",
    subject: "Community engagement",
  },
  "community-tree-planting": {
    key: "community-tree-planting",
    src: img("community-tree-planting"),
    alt: "A group of volunteers planting young trees together",
    caption: "Planting for a cooler city",
    credit: "Tường Chopper / Pexels",
    theme: "community",
    subject: "Environmental action",
  },
  "environment-coast": {
    key: "environment-coast",
    src: img("coastal-mangroves.jpg"),
    alt: "Mangrove trees framing a low-tide coastal shoreline",
    caption: "A mangrove-lined shore",
    credit: "Pexels · photo 28908035",
    theme: "environment",
    subject: "Coastal ecosystem",
  },
  "environment-mangrove": {
    key: "environment-mangrove",
    src: img("tanjong-sepat-mangroves.jpg"),
    alt: "Mangrove roots and trees exposed at low tide in Tanjong Sepat, Malaysia",
    caption: "Mangroves at low tide, Tanjong Sepat",
    credit: "Pexels · photo 30004134",
    theme: "environment",
    subject: "Malaysia",
  },
};

export const PHOTO_KEYS = Object.keys(PHOTOS);
export const PHOTO_DISCLOSURE =
  "Illustrative regional photography. Not Bandar Lampung, not a YouSee report and not evidence about any place or incident.";

export function getPhoto(key: string | null | undefined): Photo | null {
  return key ? PHOTOS[key] ?? null : null;
}
