import LazyLibrarianAPI from '@server/api/lazylibrarian';
import type { LazyLibrarianSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';

const lazyLibrarianRoutes = Router();

lazyLibrarianRoutes.get('/', (_req, res) => {
  const settings = getSettings();
  res.status(200).json(settings.lazyLibrarian);
});

lazyLibrarianRoutes.post('/', async (req, res) => {
  const settings = getSettings();

  const newLL = req.body as LazyLibrarianSettings;
  const lastItem =
    settings.lazyLibrarian[settings.lazyLibrarian.length - 1];
  newLL.id = lastItem ? lastItem.id + 1 : 0;

  if (req.body.isDefault) {
    settings.lazyLibrarian.forEach((ll) => {
      ll.isDefault = false;
    });
  }

  settings.lazyLibrarian = [...settings.lazyLibrarian, newLL];
  await settings.save();

  return res.status(201).json(newLL);
});

lazyLibrarianRoutes.post<
  undefined,
  Record<string, unknown>,
  LazyLibrarianSettings
>('/test', async (req, res, next) => {
  try {
    const protocol = req.body.useSsl ? 'https' : 'http';
    const baseUrl = req.body.baseUrl ?? '';
    const url = `${protocol}://${req.body.hostname}:${req.body.port}${baseUrl}`;

    const ll = new LazyLibrarianAPI({
      url,
      apiKey: req.body.apiKey,
    });

    const status = await ll.getStatus();

    return res.status(200).json({
      version: status.current_version,
      latestVersion: status.latest_version,
    });
  } catch (e) {
    logger.error('Failed to test LazyLibrarian', {
      label: 'LazyLibrarian',
      message: e.message,
    });

    next({ status: 500, message: 'Failed to connect to LazyLibrarian' });
  }
});

lazyLibrarianRoutes.put<
  { id: string },
  LazyLibrarianSettings,
  LazyLibrarianSettings
>('/:id', async (req, res, next) => {
  const settings = getSettings();

  const llIndex = settings.lazyLibrarian.findIndex(
    (ll) => ll.id === Number(req.params.id)
  );

  if (llIndex === -1) {
    return next({ status: '404', message: 'Settings instance not found' });
  }

  if (req.body.isDefault) {
    settings.lazyLibrarian.forEach((ll) => {
      ll.isDefault = false;
    });
  }

  settings.lazyLibrarian[llIndex] = {
    ...req.body,
    id: Number(req.params.id),
  } as LazyLibrarianSettings;
  await settings.save();

  return res.status(200).json(settings.lazyLibrarian[llIndex]);
});

lazyLibrarianRoutes.delete<{ id: string }>(
  '/:id',
  async (req, res, next) => {
    const settings = getSettings();

    const llIndex = settings.lazyLibrarian.findIndex(
      (ll) => ll.id === Number(req.params.id)
    );

    if (llIndex === -1) {
      return next({ status: '404', message: 'Settings instance not found' });
    }

    const removed = settings.lazyLibrarian.splice(llIndex, 1);
    await settings.save();

    return res.status(200).json(removed[0]);
  }
);

export default lazyLibrarianRoutes;
