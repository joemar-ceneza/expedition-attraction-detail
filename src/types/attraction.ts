// define typescript types for attraction data
export interface Media {
  id: number;
  attributes: {
    id: number;
    name: string;
    alternativeText: string | null;
    caption: string | null;
    width: number;
    height: number;
    formats: Record<string, unknown>;
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl: string | null;
    provider: string;
    provider_metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };
}

export interface Coordinates {
  DD?: {
    lat: number;
    lng: number;
  };
}

export interface DescriptionBlock {
  type: string;
  children: { type: string; text: string }[];
}

export interface Attraction {
  id: number;
  title: string;
  slug: string;
  location?: string;
  rating?: number;
  duration?: string;
  priceSEK?: number;
  category?: string;
  availableFrom?: string;
  availableTo?: string;
  groupOfPeople?: number;
  kids?: string;
  activity?: string;
  coordinates?: Coordinates;
  description?: DescriptionBlock[];
  shortDesc?: string;
  imageCover?: Media["attributes"];
  images?: Media["attributes"][];
  updatedAt?: string;
}
