import ExternalAPI from '@server/api/externalapi';
import cacheManager from '@server/lib/cache';
import type {
  MusicBrainzArtist,
  MusicBrainzRelease,
  MusicBrainzReleaseGroup,
  MusicBrainzSearchResponse,
} from './interfaces';

class MusicBrainzAPI extends ExternalAPI {
  constructor() {
    super(
      'https://musicbrainz.org/ws/2',
      { fmt: 'json' },
      {
        nodeCache: cacheManager.getCache('musicbrainz').data,
        headers: {
          'User-Agent': 'Seerr/1.0 (https://github.com/fallenbagel/jellyseerr)',
        },
        rateLimit: {
          maxRPS: 1,
          maxRequests: 1,
        },
      }
    );
  }

  public async searchArtist({
    query,
    limit = 20,
    offset = 0,
  }: {
    query: string;
    limit?: number;
    offset?: number;
  }): Promise<MusicBrainzSearchResponse<MusicBrainzArtist>> {
    return await this.get<MusicBrainzSearchResponse<MusicBrainzArtist>>(
      '/artist',
      {
        params: { query, limit, offset },
      }
    );
  }

  public async searchRelease({
    query,
    limit = 20,
    offset = 0,
  }: {
    query: string;
    limit?: number;
    offset?: number;
  }): Promise<MusicBrainzSearchResponse<MusicBrainzRelease>> {
    return await this.get<MusicBrainzSearchResponse<MusicBrainzRelease>>(
      '/release',
      {
        params: { query, limit, offset },
      }
    );
  }

  public async searchReleaseGroup({
    query,
    limit = 20,
    offset = 0,
  }: {
    query: string;
    limit?: number;
    offset?: number;
  }): Promise<MusicBrainzSearchResponse<MusicBrainzReleaseGroup>> {
    return await this.get<MusicBrainzSearchResponse<MusicBrainzReleaseGroup>>(
      '/release-group',
      {
        params: { query, limit, offset },
      }
    );
  }

  public async getRelease(mbid: string): Promise<MusicBrainzRelease> {
    return await this.get<MusicBrainzRelease>(`/release/${mbid}`, {
      params: {
        inc: 'artist-credits+labels+recordings+release-groups',
      },
    });
  }

  public async getArtist(mbid: string): Promise<MusicBrainzArtist> {
    return await this.get<MusicBrainzArtist>(`/artist/${mbid}`, {
      params: {
        inc: 'release-groups',
      },
    });
  }

  public async getReleaseGroup(
    mbid: string
  ): Promise<MusicBrainzReleaseGroup> {
    return await this.get<MusicBrainzReleaseGroup>(
      `/release-group/${mbid}`,
      {
        params: {
          inc: 'artist-credits+releases',
        },
      }
    );
  }
}

export default MusicBrainzAPI;
