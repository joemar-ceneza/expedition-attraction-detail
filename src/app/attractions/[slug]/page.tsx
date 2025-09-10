import { notFound } from "next/navigation";
import Image from "next/image";
import { DescriptionBlock, Attraction } from "@/types/attraction";
import { API_BASE_URL } from "@/constants/urls";

// ISR: revalidate every hour (3600 seconds)
export const revalidate = 3600;
// allow dynamic generation for slugs not pre-generated at build time
export const dynamicParams = true;

// fetch attraction data from strapi using slug
async function getAttractionBySlug(slug: string): Promise<Attraction | null> {
  const result = await fetch(`${API_BASE_URL}/api/atrakcjes?filters[slug][$eq]=${slug}&populate=*`, {
    next: { revalidate },
  });

  if (!result.ok) {
    console.error(`Failed to fetch attraction: ${result.status}`);
    return null;
  }

  const json = await result.json();
  if (!json.data || json.data.length === 0) return null;

  const record = json.data[0];
  if (!record) return null;

  // handle both strapi v4 nested structure and flat structure
  const attributes = record.attributes || record;

  return {
    id: record.id,
    title: attributes.title,
    slug: attributes.slug,
    location: attributes.location,
    rating: attributes.rating,
    duration: attributes.duration,
    priceSEK: attributes.priceSEK,
    category: attributes.category,
    availableFrom: attributes.availableFrom,
    availableTo: attributes.availableTo,
    groupOfPeople: attributes.groupOfPeople,
    kids: attributes.kids,
    activity: attributes.activity,
    coordinates: attributes.coordinates,
    description: attributes.description,
    shortDesc: attributes.shortDesc,
    imageCover: attributes.imageCover?.data?.attributes || attributes.imageCover,
    images: attributes.images?.data?.map((img: any) => img.attributes) || attributes.images,
    updatedAt: attributes.updatedAt,
  };
}

// pre-generate static paths for all known slugs at build time (ISR)
export async function generateStaticParams() {
  try {
    const result = await fetch(`${API_BASE_URL}/api/atrakcjes?fields[0]=slug`, {
      next: { revalidate: 3600 }, // revalidate slugs every hour
    });

    if (!result.ok) return [];
    const json = await result.json();

    return json.data
      .map((item: any) => {
        const slug = item.attributes?.slug || item.slug;
        return slug ? { slug } : null;
      })
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

// render rich text description blocks
const renderDescription = (description: DescriptionBlock[] | undefined) => {
  if (!description) return null;

  return description.map((block, index) => {
    if (block.type === "paragraph") {
      return (
        <p key={index}>
          {block.children.map((child, childIndex) => (
            <span key={childIndex}>{child.text}</span>
          ))}
        </p>
      );
    }
    return null;
  });
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

// page component
export default async function AttractionPage(props: PageProps) {
  // await params (next.js 15 requirement)
  const { slug } = await props.params;

  const attraction = await getAttractionBySlug(slug);

  // return 404 page if attraction not found
  if (!attraction) return notFound();

  return (
    <main>
      <nav>
        <a href="/attractions">Attractions</a>
        <span>/</span>
        <span>{attraction.title}</span>
      </nav>

      <h1>{attraction.title}</h1>

      {attraction.category && <span>{attraction.category}</span>}
      {attraction.shortDesc && <p>{attraction.shortDesc}</p>}

      {attraction.imageCover?.url && (
        <Image
          src={`${API_BASE_URL}${attraction.imageCover.url}`}
          alt={attraction.imageCover.alternativeText || attraction.title}
          width={800}
          height={400}
        />
      )}

      <div>
        <div>
          <h2>Activity Details</h2>
          <ul>
            {attraction.rating && <li>Rating: {attraction.rating}/5</li>}
            {attraction.duration && <li>Duration: {attraction.duration}</li>}
            {attraction.priceSEK && <li>Price: {attraction.priceSEK} SEK</li>}
            {attraction.location && <li>Location: {attraction.location}</li>}
            {attraction.groupOfPeople && <li>Group Size: Up to {attraction.groupOfPeople} people</li>}
            {attraction.activity && <li>Activity Level: {attraction.activity}</li>}
            {attraction.kids && <li>Age Recommendation: {attraction.kids}</li>}
          </ul>
        </div>

        <div>
          <h2>Availability</h2>
          {attraction.availableFrom && attraction.availableTo && (
            <p>
              Available from {new Date(attraction.availableFrom).toLocaleDateString()} to{" "}
              {new Date(attraction.availableTo).toLocaleDateString()}
            </p>
          )}
          {attraction.coordinates?.DD && (
            <div>
              <p>Coordinates:</p>
              <p>Latitude: {attraction.coordinates.DD.lat}</p>
              <p>Longitude: {attraction.coordinates.DD.lng}</p>
            </div>
          )}
        </div>
      </div>

      {attraction.description && attraction.description.length > 0 && (
        <div>
          <h2>Description</h2>
          <div>{renderDescription(attraction.description)}</div>
        </div>
      )}

      {attraction.images && attraction.images.length > 0 && (
        <div>
          <h2>Gallery</h2>
          <div>
            {attraction.images.map((image) => (
              <Image
                key={image.id}
                src={`${API_BASE_URL}${image.url}`}
                alt={image.alternativeText || attraction.title}
                width={300}
                height={200}
              />
            ))}
          </div>
        </div>
      )}

      {attraction.updatedAt && <p>Last updated: {new Date(attraction.updatedAt).toLocaleDateString()}</p>}
    </main>
  );
}
