import ExternalAPI from '@server/api/externalapi';
import logger from '@server/logger';

export interface LazyLibrarianBook {
  BookID: string;
  BookName: string;
  AuthorName: string;
  BookISBN: string;
  BookImg: string;
  BookDesc: string;
  BookAdded: string;
  Status: string;
}

export interface LazyLibrarianStatus {
  install_type: string;
  current_version: string;
  latest_version: string;
}

class LazyLibrarianAPI extends ExternalAPI {
  constructor({
    url,
    apiKey,
  }: {
    url: string;
    apiKey: string;
  }) {
    super(url, { api_key: apiKey, cmd: '' }, { timeout: 10000 });
  }

  public async getStatus(): Promise<LazyLibrarianStatus> {
    try {
      const result = await this.get<LazyLibrarianStatus>('/api', {
        params: { cmd: 'getVersion' },
      });
      return result;
    } catch (e) {
      logger.error('Failed to get LazyLibrarian status', {
        label: 'LazyLibrarian API',
        errorMessage: e.message,
      });
      throw new Error('Failed to connect to LazyLibrarian');
    }
  }

  public async searchBook(query: string): Promise<LazyLibrarianBook[]> {
    try {
      const result = await this.get<{ data: LazyLibrarianBook[] }>('/api', {
        params: { cmd: 'searchBook', query },
      });
      return result.data ?? [];
    } catch (e) {
      logger.error('Failed to search LazyLibrarian', {
        label: 'LazyLibrarian API',
        errorMessage: e.message,
      });
      throw new Error('Failed to search LazyLibrarian');
    }
  }

  public async addBook(bookId: string): Promise<void> {
    try {
      await this.get('/api', {
        params: { cmd: 'addBook', id: bookId },
      });
      logger.info('Book added to LazyLibrarian', {
        label: 'LazyLibrarian API',
        bookId,
      });
    } catch (e) {
      logger.error('Failed to add book to LazyLibrarian', {
        label: 'LazyLibrarian API',
        errorMessage: e.message,
        bookId,
      });
      throw new Error('Failed to add book to LazyLibrarian');
    }
  }

  public async getBook(bookId: string): Promise<LazyLibrarianBook | null> {
    try {
      const result = await this.get<{ data: LazyLibrarianBook[] }>('/api', {
        params: { cmd: 'getBook', id: bookId },
      });
      return result.data?.[0] ?? null;
    } catch (e) {
      logger.error('Failed to get book from LazyLibrarian', {
        label: 'LazyLibrarian API',
        errorMessage: e.message,
        bookId,
      });
      return null;
    }
  }
}

export default LazyLibrarianAPI;
