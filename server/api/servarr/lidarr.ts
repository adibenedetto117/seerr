import logger from '@server/logger';
import ServarrBase from './base';

export interface LidarrAlbumOptions {
  title: string;
  qualityProfileId: number;
  metadataProfileId: number;
  rootFolderPath: string;
  foreignAlbumId: string;
  monitored?: boolean;
  searchNow?: boolean;
  tags: number[];
  artistName: string;
  foreignArtistId: string;
}

export interface LidarrAlbum {
  id: number;
  title: string;
  foreignAlbumId: string;
  monitored: boolean;
  albumType?: string;
  releaseDate?: string;
  ratings: { votes: number; value: number };
  artist: {
    id: number;
    artistName: string;
    foreignArtistId: string;
    overview?: string;
  };
  grabbed: boolean;
  tags: number[];
  statistics?: {
    trackFileCount: number;
    trackCount: number;
    percentOfTracks: number;
    sizeOnDisk: number;
  };
}

export interface LidarrArtist {
  id: number;
  artistName: string;
  foreignArtistId: string;
  overview?: string;
  monitored: boolean;
  qualityProfileId: number;
  metadataProfileId: number;
  path: string;
  tags: number[];
  statistics?: {
    albumCount: number;
    trackFileCount: number;
    trackCount: number;
    sizeOnDisk: number;
    percentOfTracks: number;
  };
}

export interface LidarrMetadataProfile {
  id: number;
  name: string;
}

class LidarrAPI extends ServarrBase<{ albumId: number }> {
  constructor({
    url,
    apiKey,
    timeout,
  }: {
    url: string;
    apiKey: string;
    timeout?: number;
  }) {
    super({ url, apiKey, cacheName: 'lidarr', apiName: 'Lidarr', timeout });
  }

  public getAlbums = async (): Promise<LidarrAlbum[]> => {
    try {
      const response = await this.axios.get<LidarrAlbum[]>('/album');
      return response.data;
    } catch (e) {
      throw new Error(`[Lidarr] Failed to retrieve albums: ${e.message}`);
    }
  };

  public getAlbum = async ({ id }: { id: number }): Promise<LidarrAlbum> => {
    try {
      const response = await this.axios.get<LidarrAlbum>(`/album/${id}`);
      return response.data;
    } catch (e) {
      throw new Error(`[Lidarr] Failed to retrieve album: ${e.message}`);
    }
  };

  public async getAlbumByMusicBrainzId(mbid: string): Promise<LidarrAlbum> {
    try {
      const response = await this.axios.get<LidarrAlbum[]>('/album/lookup', {
        params: { term: `mbid:${mbid}` },
      });

      if (!response.data[0]) {
        throw new Error('Album not found');
      }

      return response.data[0];
    } catch (e) {
      logger.error('Error retrieving album by MusicBrainz ID', {
        label: 'Lidarr API',
        errorMessage: e.message,
        mbid,
      });
      throw new Error('Album not found');
    }
  }

  public async getArtistByMusicBrainzId(mbid: string): Promise<LidarrArtist> {
    try {
      const response = await this.axios.get<LidarrArtist[]>('/artist/lookup', {
        params: { term: `mbid:${mbid}` },
      });

      if (!response.data[0]) {
        throw new Error('Artist not found');
      }

      return response.data[0];
    } catch (e) {
      logger.error('Error retrieving artist by MusicBrainz ID', {
        label: 'Lidarr API',
        errorMessage: e.message,
        mbid,
      });
      throw new Error('Artist not found');
    }
  }

  public addAlbum = async (options: LidarrAlbumOptions): Promise<LidarrAlbum> => {
    try {
      let album: LidarrAlbum;
      try {
        album = await this.getAlbumByMusicBrainzId(options.foreignAlbumId);
      } catch {
        const artistResponse = await this.axios.post<LidarrArtist>('/artist', {
          artistName: options.artistName,
          foreignArtistId: options.foreignArtistId,
          qualityProfileId: options.qualityProfileId,
          metadataProfileId: options.metadataProfileId,
          rootFolderPath: options.rootFolderPath,
          monitored: true,
          tags: options.tags,
          addOptions: {
            monitor: 'none',
            searchForMissingAlbums: false,
          },
        });

        logger.info('Added artist to Lidarr', {
          label: 'Lidarr',
          artistId: artistResponse.data.id,
          artistName: artistResponse.data.artistName,
        });

        album = await this.getAlbumByMusicBrainzId(options.foreignAlbumId);
      }

      if (album.grabbed) {
        logger.info('Album already available. Skipping add.', {
          label: 'Lidarr',
          album,
        });
        return album;
      }

      if (album.id && !album.monitored) {
        const response = await this.axios.put<LidarrAlbum>(
          `/album/${album.id}`,
          {
            ...album,
            monitored: true,
          }
        );

        if (response.data.monitored) {
          logger.info('Set album to monitored in Lidarr.', {
            label: 'Lidarr',
            albumId: response.data.id,
            albumTitle: response.data.title,
          });

          if (options.searchNow) {
            this.searchAlbum(response.data.id);
          }

          return response.data;
        } else {
          throw new Error('Failed to update existing album in Lidarr');
        }
      }

      if (album.id) {
        logger.info('Album is already monitored in Lidarr. Skipping add.', {
          label: 'Lidarr',
        });
        return album;
      }

      throw new Error('Failed to add album to Lidarr');
    } catch (e) {
      logger.error('Failed to add album to Lidarr', {
        label: 'Lidarr',
        errorMessage: e.message,
        options,
      });
      throw new Error('Failed to add album to Lidarr');
    }
  };

  public async searchAlbum(albumId: number): Promise<void> {
    logger.info('Executing album search command', {
      label: 'Lidarr API',
      albumId,
    });

    try {
      await this.runCommand('AlbumSearch', { albumIds: [albumId] });
    } catch (e) {
      logger.error('Something went wrong while executing Lidarr album search.', {
        label: 'Lidarr API',
        errorMessage: e.message,
        albumId,
      });
    }
  }

  public removeAlbum = async (albumId: number): Promise<void> => {
    try {
      await this.axios.delete(`/album/${albumId}`, {
        params: { deleteFiles: true },
      });
      logger.info(`[Lidarr] Removed album ${albumId}`);
    } catch (e) {
      throw new Error(`[Lidarr] Failed to remove album: ${e.message}`);
    }
  };

  public getMetadataProfiles = async (): Promise<LidarrMetadataProfile[]> => {
    try {
      const data = await this.getRolling<LidarrMetadataProfile[]>(
        '/metadataprofile',
        undefined,
        3600
      );
      return data;
    } catch (e) {
      throw new Error(
        `[Lidarr] Failed to retrieve metadata profiles: ${e.message}`
      );
    }
  };

  public clearCache = ({
    foreignAlbumId,
    externalId,
  }: {
    foreignAlbumId?: string | null;
    externalId?: number | null;
  }) => {
    if (foreignAlbumId) {
      this.removeCache('/album/lookup', { term: `mbid:${foreignAlbumId}` });
    }
    if (externalId) {
      this.removeCache(`/album/${externalId}`);
    }
  };
}

export default LidarrAPI;
