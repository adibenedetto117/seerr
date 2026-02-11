import ExternalAPI from '@server/api/externalapi';
import cacheManager from '@server/lib/cache';
import type {
  GoogleBookVolume,
  GoogleBooksSearchResponse,
} from './interfaces';

class GoogleBooksAPI extends ExternalAPI {
  constructor() {
    super(
      'https://www.googleapis.com/books/v1',
      {},
      {
        nodeCache: cacheManager.getCache('googlebooks').data,
      }
    );
  }

  public async searchBooks({
    query,
    page = 1,
    maxResults = 20,
  }: {
    query: string;
    page?: number;
    maxResults?: number;
  }): Promise<GoogleBooksSearchResponse> {
    const startIndex = (page - 1) * maxResults;

    return await this.get<GoogleBooksSearchResponse>('/volumes', {
      params: {
        q: query,
        startIndex,
        maxResults,
        printType: 'books',
      },
    });
  }

  public async getBook(volumeId: string): Promise<GoogleBookVolume> {
    return await this.get<GoogleBookVolume>(`/volumes/${volumeId}`);
  }
}

export default GoogleBooksAPI;
