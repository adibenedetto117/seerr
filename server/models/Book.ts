import type { GoogleBookVolume } from '@server/api/googlebooks/interfaces';
import type { OpenLibrarySearchDoc } from '@server/api/openlibrary/interfaces';
import { MediaType as MainMediaType } from '@server/constants/media';
import type Media from '@server/entity/Media';

export interface BookResult {
  id: string;
  mediaType: 'book';
  title: string;
  authors: string[];
  description: string;
  publishedDate?: string;
  pageCount?: number;
  categories: string[];
  coverPath?: string;
  isbn?: string;
  publisher?: string;
  averageRating?: number;
  mediaInfo?: Media;
}

export const mapGoogleBookResult = (
  volume: GoogleBookVolume,
  media?: Media
): BookResult => {
  const info = volume.volumeInfo;
  const isbn13 = info.industryIdentifiers?.find(
    (id) => id.type === 'ISBN_13'
  );
  const isbn10 = info.industryIdentifiers?.find(
    (id) => id.type === 'ISBN_10'
  );

  return {
    id: volume.id,
    mediaType: 'book',
    title: info.title,
    authors: info.authors ?? [],
    description: info.description ?? '',
    publishedDate: info.publishedDate,
    pageCount: info.pageCount,
    categories: info.categories ?? [],
    coverPath: info.imageLinks?.thumbnail?.replace('http://', 'https://'),
    isbn: isbn13?.identifier ?? isbn10?.identifier,
    publisher: info.publisher,
    averageRating: info.averageRating,
    mediaInfo: media,
  };
};

export const mapOpenLibraryResult = (
  doc: OpenLibrarySearchDoc,
  media?: Media
): BookResult => {
  const coverUrl = doc.cover_i
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    : undefined;

  return {
    id: doc.key.replace('/works/', ''),
    mediaType: 'book',
    title: doc.title,
    authors: doc.author_name ?? [],
    description: '',
    publishedDate: doc.first_publish_year?.toString(),
    pageCount: doc.number_of_pages_median,
    categories: doc.subject?.slice(0, 5) ?? [],
    coverPath: coverUrl,
    isbn: doc.isbn?.[0],
    publisher: doc.publisher?.[0],
    mediaInfo: media,
  };
};

export const mapBookSearchResults = (
  results: GoogleBookVolume[],
  media?: Media[]
): BookResult[] =>
  results.map((volume) =>
    mapGoogleBookResult(
      volume,
      media?.find(
        (m) =>
          m.googleBooksId === volume.id &&
          m.mediaType === MainMediaType.BOOK
      )
    )
  );
