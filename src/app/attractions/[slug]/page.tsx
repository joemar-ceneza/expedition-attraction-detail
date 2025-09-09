import { notFound } from "next/navigation";

// define revalidation time in seconds (ISR)
export const revalidate = 60;

// define typescript types for attraction data
type Media = {
  id: number;
  url: string;
};

type Attraction = {
  id: number;
  title: string;
  slug: string;
  location?: string;
  rating?: number;
  duration?: string;
  priceSEK?: number;
  description?: any[];
  shortDesc?: string;
  imagePoster?: Media;
  imageCover?: Media;
  images?: Media[];
};

// fetch attraction data from strapi using slug
async function getAttractionBySlug(slug: string): Promise<Attraction | null> {
  const result = await fetch(`https://api.expeditionlapland.com/api/atrakcjes?filters[slug][$eq]=${slug}&populate=*`, {
    next: { revalidate },
  });

  if (result.ok) {
    console.error(`Failed to fetch attraction: ${result.status}`);
  }

  const json = await result.json();

  const attraction = json?.data?.[0].attributes;
  const id = json?.data?.[0]?.id;

  // return null if no record found
  if (!attraction || !id) return null;

  return {
    id,
    slug,
    title: attraction.title,
    location: attraction.location,
    rating: attraction.rating,
    duration: attraction.duration,
    priceSEK: attraction.priceSEK,
    description: attraction.description,
    shortDesc: attraction.shortDesc,
    imagePoster: attraction.imagePoster?.data?.attributes,
    imageCover: attraction.imageCover?.data?.attributes,
    images: attraction.images?.data?.map((img: any) => img.attributes),
  };
}
