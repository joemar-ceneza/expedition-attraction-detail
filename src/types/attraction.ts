// define typescript types for attraction data
type Media = {
  id: number;
  url: string;
  alternativeText?: string;
};

type Coordinates = {
  DD?: {
    lat: number;
    lng: number;
  };
};

type DescriptionBlock = {
  type: string;
  children: { type: string; text: string }[];
};

type Attraction = {
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
  imageCover?: Media;
  images?: Media[];
  updatedAt?: string;
};
