import MusicBrainzAPI from '@server/api/musicbrainz';
import { MediaType } from '@server/constants/media';
import Media from '@server/entity/Media';
import logger from '@server/logger';
import {
  mapArtistResult,
  mapReleaseGroupResult,
  mapReleaseResult,
} from '@server/models/Music';
import { Router } from 'express';

const musicRoutes = Router();

musicRoutes.get('/release/:id', async (req, res, next) => {
  const mb = new MusicBrainzAPI();

  try {
    const release = await mb.getRelease(req.params.id);

    const media = await Media.getMediaByExternalId(
      req.params.id,
      MediaType.MUSIC
    );

    return res.status(200).json(mapReleaseResult(release, media));
  } catch (e) {
    logger.debug('Something went wrong retrieving music release', {
      label: 'API',
      errorMessage: e.message,
      releaseId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve music release.',
    });
  }
});

musicRoutes.get('/artist/:id', async (req, res, next) => {
  const mb = new MusicBrainzAPI();

  try {
    const artist = await mb.getArtist(req.params.id);
    return res.status(200).json(mapArtistResult(artist));
  } catch (e) {
    logger.debug('Something went wrong retrieving artist', {
      label: 'API',
      errorMessage: e.message,
      artistId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve artist.',
    });
  }
});

musicRoutes.get('/artist/:id/releases', async (req, res, next) => {
  const mb = new MusicBrainzAPI();

  try {
    const artist = await mb.getArtist(req.params.id);
    const releaseGroups = (artist['release-groups'] ?? []).map(
      mapReleaseGroupResult
    );

    return res.status(200).json({
      results: releaseGroups,
      totalResults: releaseGroups.length,
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving artist releases', {
      label: 'API',
      errorMessage: e.message,
      artistId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve artist releases.',
    });
  }
});

musicRoutes.get('/release-group/:id', async (req, res, next) => {
  const mb = new MusicBrainzAPI();

  try {
    const releaseGroup = await mb.getReleaseGroup(req.params.id);
    return res.status(200).json(mapReleaseGroupResult(releaseGroup));
  } catch (e) {
    logger.debug('Something went wrong retrieving release group', {
      label: 'API',
      errorMessage: e.message,
      releaseGroupId: req.params.id,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve release group.',
    });
  }
});

export default musicRoutes;
