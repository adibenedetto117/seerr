import ExternalAPI from '@server/api/externalapi';
import cacheManager from '@server/lib/cache';
import type {
  OpenLibraryEdition,
  OpenLibrarySearchResponse,
  OpenLibraryWork,
} from './interfaces';

class OpenLibraryAPI extends ExternalAPI {
  constructor() {
    super(
      'https://openlibrary.org',
      {},
      {
        nodeCache: cacheManager.getCache('openlibrary').data,
        rateLimit: {
          maxRPS: 5,
          maxRequests: 5,
        },
      }
    );
  }

  public async searchBooks({
    query,
    page = 1,
    limit = 20,
  }: {
    query: string;
    page?: number;
    limit?: number;
  }): Promise<OpenLibrarySearchResponse> {
    return await this.get<OpenLibrarySearchResponse>('/search.json', {
      params: {
        q: query,
        page,
        limit,
      },
    });
  }

  public async getWork(olid: string): Promise<OpenLibraryWork> {
    return await this.get<OpenLibraryWork>(`/works/${olid}.json`);
  }

  public async getEdition(olid: string): Promise<OpenLibraryEdition> {
    return await this.get<OpenLibraryEdition>(`/books/${olid}.json`);
  }

  public async getBookByISBN(isbn: string): Promise<OpenLibraryEdition> {
    return await this.get<OpenLibraryEdition>(`/isbn/${isbn}.json`);
  }
}

export default OpenLibraryAPI;
