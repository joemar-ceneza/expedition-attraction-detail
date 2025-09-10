import { notFound } from "next/navigation";
import Image from "next/image";
import { DescriptionBlock, Attraction } from "@/types/attraction";
import { API_BASE_URL } from "@/constants/urls";

// ISR: revalidate every hour (3600 seconds)
// this enable Increment Static Regeneration - pages are regenerated in the background when request come in
// but only once per hour
export const revalidate = 3600;

// allow dynamic generation for slugs not pre-generated at build time
// if set to false, only slugs from generateStaticParams would be valid
export const dynamicParams = true;

// fetch a single attraction by its slug from the strapi api
// @param slug - the url-friendly identifier for the attraction
// returns attraction object or null if not found
async function getAttractionBySlug(slug: string): Promise<Attraction | null> {
  try {
    // construct api url with filter for the specific slug and populate all related data
    const result = await fetch(`${API_BASE_URL}/api/atrakcjes?filters[slug][$eq]=${slug}&populate=*`, {
      // use the revalidate value defined above for ISR
      next: { revalidate },
    });

    // handle http errors
    if (!result.ok) {
      console.error(`Failed to fetch attraction: ${result.status}`);
      return null;
    }

    const json = await result.json();
    if (!json.data || json.data.length === 0) return null;

    // check if data exists and is not empty
    const record = json.data[0];
    if (!record) return null;

    // handle both strapi v4 nested structure (attributes property) and flat structure
    const attributes = record.attributes || record;

    // transform api response to match our typescript type
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
      // handle nested image data structure in Strapi
      imageCover: attributes.imageCover?.data?.attributes || attributes.imageCover,
      // map through images array and extract attributes
      images: attributes.images?.data?.map((img: any) => img.attributes) || attributes.images,
      updatedAt: attributes.updatedAt,
    };
  } catch (error) {
    return null;
  }
}

// generates static params at build time for all known attraction slugs
// this enables SSG (Static Site Generation) for better performance
// @returns array of params objects for each slug
export async function generateStaticParams() {
  try {
    // fetch only slugs to minimize data transfer
    const result = await fetch(`${API_BASE_URL}/api/atrakcjes?fields[0]=slug`, {
      // revalidate the list of slugs every hour
      next: { revalidate: 3600 },
    });

    if (!result.ok) return [];
    const json = await result.json();

    // extract slugs from api response, handling different response structures
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

// render rich text description blocks from strapi's rich text editor
// @param description - array of description blocks
// @returns jsx elements representing the formatted description
const renderDescription = (description: DescriptionBlock[] | undefined) => {
  if (!description) return null;

  return description.map((block, index) => {
    // currently only handles paragraph blocks
    // could be extended to handle headings, lists, etc
    if (block.type === "paragraph") {
      return (
        <p key={index}>
          {block.children.map((child, childIndex) => (
            <span key={childIndex}>{child.text}</span>
          ))}
        </p>
      );
    }
    // add support for other block types
    return null;
  });
};

// define props type for the page component
type PageProps = {
  params: Promise<{ slug: string }>;
};

// main page component for individual attraction pages
// uses react server components and async/await for data fetching
export default async function AttractionPage(props: PageProps) {
  // extract slug from URL parameters (Next.js 15 requires awaiting params)
  const { slug } = await props.params;

  // fetch attraction data based on slug
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
