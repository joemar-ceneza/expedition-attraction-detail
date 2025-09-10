import { notFound } from "next/navigation";
import Image from "next/image";

// ISR: revalidate every hour (3600 seconds)
export const revalidate = 3600;
// allow dynamic generation for slugs not pre-generated at build time
export const dynamicParams = true;

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

// fetch attraction data from strapi using slug
async function getAttractionBySlug(slug: string): Promise<Attraction | null> {
  const result = await fetch(`https://api.expeditionlapland.com/api/atrakcjes?filters[slug][$eq]=${slug}&populate=*`, {
    next: { revalidate },
  });

  if (!result.ok) {
    console.error(`Failed to fetch attraction: ${result.status}`);
    return null;
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

// page component
export default async function AttractionPage({ params }: { params: { slug: string } }) {
  const attraction = await getAttractionBySlug(params.slug);

  // return 404 page if attraction not found
  if (!attraction) return notFound();

  return (
    <main>
      <h1>{attraction.title}</h1>
      <p>{attraction.shortDesc}</p>

      {attraction.imageCover?.url && (
        <img
          src={`https://api.expeditionlapland.com${attraction.imageCover.url}`}
          alt={attraction.title}
          style={{ maxWidth: "100%", height: "auto" }}
        />
      )}

      <ul>
        {attraction.rating && <li>Rating: {attraction.rating}</li>}
        {attraction.duration && <li>Duration: {attraction.duration}</li>}
        {attraction.priceSEK && <li>Price: {attraction.priceSEK} SEK</li>}
        {attraction.location && <li>Location: {attraction.location}</li>}
      </ul>
    </main>
  );
}
