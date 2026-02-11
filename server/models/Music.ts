import type {
  MusicBrainzArtist,
  MusicBrainzRelease,
  MusicBrainzReleaseGroup,
} from '@server/api/musicbrainz/interfaces';
import { MediaType as MainMediaType } from '@server/constants/media';
import type Media from '@server/entity/Media';

export interface MusicReleaseResult {
  id: string;
  mediaType: 'music';
  title: string;
  artistName: string;
  artistId?: string;
  releaseDate?: string;
  releaseType?: string;
  status?: string;
  country?: string;
  coverUrl?: string;
  trackCount?: number;
  labels: string[];
  mediaInfo?: Media;
}

export interface MusicArtistResult {
  id: string;
  mediaType: 'music';
  name: string;
  sortName: string;
  type?: string;
  disambiguation?: string;
  country?: string;
  beginDate?: string;
  endDate?: string;
  ended: boolean;
  releaseGroups: MusicReleaseGroupResult[];
}

export interface MusicReleaseGroupResult {
  id: string;
  mediaType: 'music';
  title: string;
  primaryType?: string;
  secondaryTypes: string[];
  firstReleaseDate?: string;
  artistName?: string;
  artistId?: string;
  coverUrl?: string;
}

export const mapReleaseResult = (
  release: MusicBrainzRelease,
  media?: Media
): MusicReleaseResult => {
  const artistCredit = release['artist-credit']?.[0];
  const labels =
    release['label-info']
      ?.map((li) => li.label?.name)
      .filter((n): n is string => !!n) ?? [];

  const trackCount = release.media?.reduce(
    (sum, m) => sum + m['track-count'],
    0
  );

  const releaseGroupId = release['release-group']?.id;
  const coverUrl = releaseGroupId
    ? `https://coverartarchive.org/release-group/${releaseGroupId}/front-250`
    : undefined;

  return {
    id: release.id,
    mediaType: 'music',
    title: release.title,
    artistName: artistCredit?.name ?? '',
    artistId: artistCredit?.artist.id,
    releaseDate: release.date,
    releaseType: release['release-group']?.['primary-type'],
    status: release.status,
    country: release.country,
    coverUrl,
    trackCount,
    labels,
    mediaInfo: media,
  };
};

export const mapReleaseGroupResult = (
  rg: MusicBrainzReleaseGroup
): MusicReleaseGroupResult => {
  const artistCredit = rg['artist-credit']?.[0];

  return {
    id: rg.id,
    mediaType: 'music',
    title: rg.title,
    primaryType: rg['primary-type'],
    secondaryTypes: rg['secondary-types'] ?? [],
    firstReleaseDate: rg['first-release-date'],
    artistName: artistCredit?.name,
    artistId: artistCredit?.artist.id,
    coverUrl: `https://coverartarchive.org/release-group/${rg.id}/front-250`,
  };
};

export const mapArtistResult = (
  artist: MusicBrainzArtist
): MusicArtistResult => ({
  id: artist.id,
  mediaType: 'music',
  name: artist.name,
  sortName: artist['sort-name'],
  type: artist.type,
  disambiguation: artist.disambiguation,
  country: artist.country,
  beginDate: artist['life-span']?.begin,
  endDate: artist['life-span']?.end,
  ended: artist['life-span']?.ended ?? false,
  releaseGroups: (artist['release-groups'] ?? []).map(mapReleaseGroupResult),
});

export const mapReleaseSearchResults = (
  results: MusicBrainzRelease[],
  media?: Media[]
): MusicReleaseResult[] =>
  results.map((release) =>
    mapReleaseResult(
      release,
      media?.find(
        (m) =>
          m.musicBrainzId === release.id &&
          m.mediaType === MainMediaType.MUSIC
      )
    )
  );
