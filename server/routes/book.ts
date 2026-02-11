import GoogleBooksAPI from '@server/api/googlebooks';
import { MediaType } from '@server/constants/media';
import Media from '@server/entity/Media';
import logger from '@server/logger';
import { mapBookSearchResults, mapGoogleBookResult } from '@server/models/Book';
import { Router } from 'express';

const bookRoutes = Router();

bookRoutes.get('/:id', async (req, res, next) => {
  const googleBooks = new GoogleBooksAPI();

  try {
    const volume = await googleBooks.getBook(req.params.id);

    const media = await Media.getMediaByExternalId(
      req.params.id,
      MediaType.BOOK
    );

    return res.status(200).json(mapGoogleBookResult(volume, media));
  } catch (e) {
    logger.debug('Something went wrong retrieving book', {
      label: 'API',
      errorMessage: e.message,
      bookId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve book.',
    });
  }
});

bookRoutes.get('/:id/similar', async (req, res, next) => {
  const googleBooks = new GoogleBooksAPI();

  try {
    const volume = await googleBooks.getBook(req.params.id);
    const info = volume.volumeInfo;

    const query = info.authors?.[0]
      ? `inauthor:${info.authors[0]}`
      : info.categories?.[0]
        ? `subject:${info.categories[0]}`
        : info.title;

    const results = await googleBooks.searchBooks({
      query,
      page: Number(req.query.page) || 1,
    });

    const volumes = (results.items ?? []).filter((v) => v.id !== req.params.id);

    return res.status(200).json({
      page: Number(req.query.page) || 1,
      totalResults: results.totalItems,
      results: mapBookSearchResults(volumes),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving similar books', {
      label: 'API',
      errorMessage: e.message,
      bookId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve similar books.',
    });
  }
});

bookRoutes.get('/:id/recommendations', async (req, res, next) => {
  const googleBooks = new GoogleBooksAPI();

  try {
    const volume = await googleBooks.getBook(req.params.id);
    const info = volume.volumeInfo;

    const query = info.categories?.[0]
      ? `subject:${info.categories[0]}`
      : info.title;

    const results = await googleBooks.searchBooks({
      query,
      page: Number(req.query.page) || 1,
    });

    const volumes = (results.items ?? []).filter((v) => v.id !== req.params.id);

    return res.status(200).json({
      page: Number(req.query.page) || 1,
      totalResults: results.totalItems,
      results: mapBookSearchResults(volumes),
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving book recommendations', {
      label: 'API',
      errorMessage: e.message,
      bookId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve book recommendations.',
    });
  }
});

export default bookRoutes;
