import logger from '@server/logger';
import ServarrBase from './base';

export interface ReadarrBookOptions {
  title: string;
  qualityProfileId: number;
  metadataProfileId: number;
  rootFolderPath: string;
  foreignBookId: string;
  monitored?: boolean;
  searchNow?: boolean;
  tags: number[];
}

export interface ReadarrBook {
  id: number;
  title: string;
  authorTitle: string;
  foreignBookId: string;
  titleSlug: string;
  monitored: boolean;
  anyEditionOk: boolean;
  ratings: { votes: number; value: number };
  releaseDate?: string;
  pageCount?: number;
  overview?: string;
  author: {
    id: number;
    authorName: string;
    foreignAuthorId: string;
    titleSlug: string;
  };
  editions?: {
    id: number;
    title: string;
    isbn13?: string;
    asin?: string;
    monitored: boolean;
  }[];
  grabbed: boolean;
  tags: number[];
}

export interface ReadarrAuthor {
  id: number;
  authorName: string;
  foreignAuthorId: string;
  titleSlug: string;
  overview?: string;
  monitored: boolean;
  qualityProfileId: number;
  metadataProfileId: number;
  path: string;
  tags: number[];
}

export interface ReadarrMetadataProfile {
  id: number;
  name: string;
}

class ReadarrAPI extends ServarrBase<{ bookId: number }> {
  constructor({
    url,
    apiKey,
    timeout,
  }: {
    url: string;
    apiKey: string;
    timeout?: number;
  }) {
    super({ url, apiKey, cacheName: 'readarr', apiName: 'Readarr', timeout });
  }

  public getBooks = async (): Promise<ReadarrBook[]> => {
    try {
      const response = await this.axios.get<ReadarrBook[]>('/book');
      return response.data;
    } catch (e) {
      throw new Error(`[Readarr] Failed to retrieve books: ${e.message}`);
    }
  };

  public getBook = async ({ id }: { id: number }): Promise<ReadarrBook> => {
    try {
      const response = await this.axios.get<ReadarrBook>(`/book/${id}`);
      return response.data;
    } catch (e) {
      throw new Error(`[Readarr] Failed to retrieve book: ${e.message}`);
    }
  };

  public async getBookByForeignId(foreignBookId: string): Promise<ReadarrBook> {
    try {
      const response = await this.axios.get<ReadarrBook[]>('/book/lookup', {
        params: { term: `edition:${foreignBookId}` },
      });

      if (!response.data[0]) {
        throw new Error('Book not found');
      }

      return response.data[0];
    } catch (e) {
      logger.error('Error retrieving book by foreign ID', {
        label: 'Readarr API',
        errorMessage: e.message,
        foreignBookId,
      });
      throw new Error('Book not found');
    }
  }

  public addBook = async (options: ReadarrBookOptions): Promise<ReadarrBook> => {
    try {
      const book = await this.getBookByForeignId(options.foreignBookId);

      if (book.grabbed) {
        logger.info(
          'Title already exists and is available. Skipping add and returning success',
          { label: 'Readarr', book }
        );
        return book;
      }

      if (book.id && !book.monitored) {
        const response = await this.axios.put<ReadarrBook>('/book', {
          ...book,
          monitored: options.monitored,
          qualityProfileId: options.qualityProfileId,
          metadataProfileId: options.metadataProfileId,
          rootFolderPath: options.rootFolderPath,
          tags: Array.from(new Set([...book.tags, ...options.tags])),
          addOptions: { searchForNewBook: options.searchNow },
        });

        if (response.data.monitored) {
          logger.info('Found existing title in Readarr and set it to monitored.', {
            label: 'Readarr',
            bookId: response.data.id,
            bookTitle: response.data.title,
          });

          if (options.searchNow) {
            this.searchBook(response.data.id);
          }

          return response.data;
        } else {
          throw new Error('Failed to update existing book in Readarr');
        }
      }

      if (book.id) {
        logger.info('Book is already monitored in Readarr. Skipping add.', {
          label: 'Readarr',
        });
        return book;
      }

      const response = await this.axios.post<ReadarrBook>('/book', {
        title: options.title,
        qualityProfileId: options.qualityProfileId,
        metadataProfileId: options.metadataProfileId,
        rootFolderPath: options.rootFolderPath,
        foreignBookId: options.foreignBookId,
        monitored: options.monitored,
        tags: options.tags,
        addOptions: { searchForNewBook: options.searchNow },
      });

      if (response.data.id) {
        logger.info('Readarr accepted request', { label: 'Readarr' });
      } else {
        throw new Error('Failed to add book to Readarr');
      }

      return response.data;
    } catch (e) {
      logger.error('Failed to add book to Readarr', {
        label: 'Readarr',
        errorMessage: e.message,
        options,
      });
      throw new Error('Failed to add book to Readarr');
    }
  };

  public async searchBook(bookId: number): Promise<void> {
    logger.info('Executing book search command', {
      label: 'Readarr API',
      bookId,
    });

    try {
      await this.runCommand('BookSearch', { bookIds: [bookId] });
    } catch (e) {
      logger.error('Something went wrong while executing Readarr book search.', {
        label: 'Readarr API',
        errorMessage: e.message,
        bookId,
      });
    }
  }

  public removeBook = async (bookId: number): Promise<void> => {
    try {
      await this.axios.delete(`/book/${bookId}`, {
        params: { deleteFiles: true, addImportListExclusion: false },
      });
      logger.info(`[Readarr] Removed book ${bookId}`);
    } catch (e) {
      throw new Error(`[Readarr] Failed to remove book: ${e.message}`);
    }
  };

  public getMetadataProfiles = async (): Promise<ReadarrMetadataProfile[]> => {
    try {
      const data = await this.getRolling<ReadarrMetadataProfile[]>(
        '/metadataprofile',
        undefined,
        3600
      );
      return data;
    } catch (e) {
      throw new Error(
        `[Readarr] Failed to retrieve metadata profiles: ${e.message}`
      );
    }
  };

  public clearCache = ({
    foreignBookId,
    externalId,
  }: {
    foreignBookId?: string | null;
    externalId?: number | null;
  }) => {
    if (foreignBookId) {
      this.removeCache('/book/lookup', { term: `edition:${foreignBookId}` });
    }
    if (externalId) {
      this.removeCache(`/book/${externalId}`);
    }
  };
}

export default ReadarrAPI;
