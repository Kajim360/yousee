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

// Local source files in src/assets/images (importable in VS Code via @/assets/images).
import {
  cityManila,
  cityPasig,
  cityNight,
  cityBaguio,
  floodStreet,
  floodVillage,
  communityDialogue,
  communityVolunteers,
  communityTreePlanting,
  environmentCoast,
  environmentMangrove,
} from "@/assets/images";

export const PHOTOS: Record<string, Photo> = {
  "city-manila": {
    key: "city-manila",
    src: cityManila.src,
    alt: "Manila skyline at sunset with warm light across the city",
    caption: "Manila at sunset",
    credit: "Kenneth Surillo / Pexels",
    theme: "city",
    subject: "Philippines",
  },
  "city-pasig": {
    key: "city-pasig",
    src: cityPasig.src,
    alt: "High-rise buildings in Pasig City glowing at sunset",
    caption: "Pasig City at sunset",
    credit: "Jurell Celario / Pexels",
    theme: "city",
    subject: "Philippines",
  },
  "city-night": {
    key: "city-night",
    src: cityNight.src,
    alt: "A dense city illuminated at night seen from above",
    caption: "City lights after dark",
    credit: "Ck Lacandazo / Pexels",
    theme: "city",
    subject: "Regional city imagery",
  },
  "city-baguio": {
    key: "city-baguio",
    src: cityBaguio.src,
    alt: "Colourful homes built across a hillside in Baguio, Philippines",
    caption: "Hillside neighbourhood, Baguio",
    credit: "Harvey Tan Villarino / Pexels",
    theme: "city",
    subject: "Philippines",
  },
  "flood-street": {
    key: "flood-street",
    src: floodStreet.src,
    alt: "People and vehicles moving through a flooded urban street",
    caption: "A flooded street after heavy rain",
    credit: "Faisal Ibne Kalam / Pexels",
    theme: "flooding",
    subject: "Illustrative flooding",
  },
  "flood-village": {
    key: "flood-village",
    src: floodVillage.src,
    alt: "A residential street submerged by floodwater in a tropical community",
    caption: "Water reaching the doorstep",
    credit: "Hussain Naushad / Pexels",
    theme: "flooding",
    subject: "Illustrative flooding",
  },
  "community-dialogue": {
    key: "community-dialogue",
    src: communityDialogue.src,
    alt: "Residents talking together around a wooden table outdoors",
    caption: "A conversation between neighbours",
    credit: "Jeff Vinluan / Pexels",
    theme: "community",
    subject: "Community engagement",
  },
  "community-volunteers": {
    key: "community-volunteers",
    src: communityVolunteers.src,
    alt: "Volunteers cleaning up a public park together",
    caption: "Residents caring for shared space",
    credit: "Galib Rahman Nadim / Pexels",
    theme: "community",
    subject: "Community engagement",
  },
  "community-tree-planting": {
    key: "community-tree-planting",
    src: communityTreePlanting.src,
    alt: "A group of volunteers planting young trees together",
    caption: "Planting for a cooler city",
    credit: "Tường Chopper / Pexels",
    theme: "community",
    subject: "Environmental action",
  },
  "environment-coast": {
    key: "environment-coast",
    src: environmentCoast.src,
    alt: "Green mountains meeting a coastline in Candijay, Philippines",
    caption: "Coast and hills, Candijay",
    credit: "Rodelou Tuyor / Pexels",
    theme: "environment",
    subject: "Philippines",
  },
  "environment-mangrove": {
    key: "environment-mangrove",
    src: environmentMangrove.src,
    alt: "Mangrove roots exposed at low tide",
    caption: "Mangroves at low tide",
    credit: "Ihsan Adityawarman / Pexels",
    theme: "environment",
    subject: "Coastal environment",
  },
};

export const PHOTO_KEYS = Object.keys(PHOTOS);
export const PHOTO_DISCLOSURE =
  "Illustrative regional photography. Not Bandar Lampung, not a YouSee report and not evidence about any place or incident.";

export function getPhoto(key: string | null | undefined): Photo | null {
  return key ? PHOTOS[key] ?? null : null;
}
