import GoogleBooksAPI from '@server/api/googlebooks';
import MusicBrainzAPI from '@server/api/musicbrainz';
import TheMovieDb from '@server/api/themoviedb';
import type { TmdbSearchMultiResponse } from '@server/api/themoviedb/interfaces';
import Media from '@server/entity/Media';
import { findSearchProvider } from '@server/lib/search';
import logger from '@server/logger';
import { mapBookSearchResults } from '@server/models/Book';
import { mapReleaseSearchResults } from '@server/models/Music';
import { mapSearchResults } from '@server/models/Search';
import { Router } from 'express';

const searchRoutes = Router();

searchRoutes.get('/', async (req, res, next) => {
  const queryString = req.query.query as string;
  const typeFilter = req.query.type as string | undefined;
  const searchProvider = findSearchProvider(queryString.toLowerCase());
  const page = Number(req.query.page) || 1;

  try {
    const allResults: unknown[] = [];
    let totalResults = 0;

    const includeTmdb =
      !typeFilter || typeFilter === 'movie' || typeFilter === 'tv';
    const includeBooks = !typeFilter || typeFilter === 'book';
    const includeMusic = !typeFilter || typeFilter === 'music';

    const promises: Promise<void>[] = [];

    if (includeTmdb) {
      promises.push(
        (async () => {
          let results: TmdbSearchMultiResponse;

          if (searchProvider) {
            const [id] = queryString
              .toLowerCase()
              .match(searchProvider.pattern) as RegExpMatchArray;
            results = await searchProvider.search({
              id,
              language: (req.query.language as string) ?? req.locale,
              query: queryString,
            });
          } else {
            const tmdb = new TheMovieDb();
            results = await tmdb.searchMulti({
              query: queryString,
              page,
              language: (req.query.language as string) ?? req.locale,
            });
          }

          const media = await Media.getRelatedMedia(
            req.user,
            results.results.map((result) => result.id)
          );

          allResults.push(...mapSearchResults(results.results, media));
          totalResults += results.total_results;
        })()
      );
    }

    if (includeBooks) {
      promises.push(
        (async () => {
          try {
            const googleBooks = new GoogleBooksAPI();
            const bookResults = await googleBooks.searchBooks({
              query: queryString,
              page,
            });

            if (bookResults.items) {
              allResults.push(...mapBookSearchResults(bookResults.items));
              totalResults += bookResults.totalItems;
            }
          } catch (e) {
            logger.debug('Failed to fetch book search results', {
              label: 'API',
              errorMessage: e.message,
            });
          }
        })()
      );
    }

    if (includeMusic) {
      promises.push(
        (async () => {
          try {
            const mb = new MusicBrainzAPI();
            const releaseResults = await mb.searchRelease({
              query: queryString,
              limit: 20,
              offset: (page - 1) * 20,
            });

            if (releaseResults.releases) {
              allResults.push(
                ...mapReleaseSearchResults(releaseResults.releases)
              );
              totalResults += releaseResults.count;
            }
          } catch (e) {
            logger.debug('Failed to fetch music search results', {
              label: 'API',
              errorMessage: e.message,
            });
          }
        })()
      );
    }

    await Promise.all(promises);

    return res.status(200).json({
      page,
      totalPages: Math.ceil(totalResults / 20),
      totalResults,
      results: allResults,
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving search results', {
      label: 'API',
      errorMessage: e.message,
      query: req.query.query,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve search results.',
    });
  }
});

searchRoutes.get('/keyword', async (req, res, next) => {
  const tmdb = new TheMovieDb();

  try {
    const results = await tmdb.searchKeyword({
      query: req.query.query as string,
      page: Number(req.query.page),
    });

    return res.status(200).json(results);
  } catch (e) {
    logger.debug('Something went wrong retrieving keyword search results', {
      label: 'API',
      errorMessage: e.message,
      query: req.query.query,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve keyword search results.',
    });
  }
});

searchRoutes.get('/company', async (req, res, next) => {
  const tmdb = new TheMovieDb();

  try {
    const results = await tmdb.searchCompany({
      query: req.query.query as string,
      page: Number(req.query.page),
    });

    return res.status(200).json(results);
  } catch (e) {
    logger.debug('Something went wrong retrieving company search results', {
      label: 'API',
      errorMessage: e.message,
      query: req.query.query,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve company search results.',
    });
  }
});

export default searchRoutes;
