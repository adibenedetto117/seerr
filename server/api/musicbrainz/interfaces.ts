export interface MusicBrainzArtistCredit {
  name: string;
  artist: {
    id: string;
    name: string;
    'sort-name': string;
    disambiguation?: string;
  };
}

export interface MusicBrainzReleaseGroup {
  id: string;
  title: string;
  'primary-type'?: string;
  'secondary-types'?: string[];
  'first-release-date'?: string;
  'artist-credit'?: MusicBrainzArtistCredit[];
}

export interface MusicBrainzRelease {
  id: string;
  title: string;
  status?: string;
  date?: string;
  country?: string;
  barcode?: string;
  'release-group'?: MusicBrainzReleaseGroup;
  'artist-credit'?: MusicBrainzArtistCredit[];
  'label-info'?: {
    'catalog-number'?: string;
    label?: {
      id: string;
      name: string;
    };
  }[];
  media?: MusicBrainzMedia[];
  'text-representation'?: {
    language?: string;
    script?: string;
  };
}

export interface MusicBrainzMedia {
  position: number;
  format?: string;
  'track-count': number;
  tracks?: MusicBrainzTrack[];
}

export interface MusicBrainzTrack {
  id: string;
  number: string;
  title: string;
  length?: number;
  position: number;
  recording: {
    id: string;
    title: string;
    length?: number;
    disambiguation?: string;
  };
}

export interface MusicBrainzArtist {
  id: string;
  name: string;
  'sort-name': string;
  type?: string;
  disambiguation?: string;
  country?: string;
  'life-span'?: {
    begin?: string;
    end?: string;
    ended: boolean;
  };
  'release-groups'?: MusicBrainzReleaseGroup[];
}

export interface MusicBrainzSearchResponse<T> {
  created: string;
  count: number;
  offset: number;
  artists?: T[];
  releases?: T[];
  'release-groups'?: T[];
}
