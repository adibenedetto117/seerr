import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import Tag from '@app/components/Common/Tag';
import RequestModal from '@app/components/RequestModal';
import StatusBadge from '@app/components/StatusBadge';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import {
  ArrowDownTrayIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { MediaStatus } from '@server/constants/media';
import type { BookResult } from '@server/models/Book';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.BookDetails', {
  overview: 'Overview',
  overviewunavailable: 'Overview unavailable.',
  author: '{authorCount, plural, one {Author} other {Authors}}',
  pages: '{count} pages',
  isbn: 'ISBN',
  publisher: 'Publisher',
  publishdate: 'Published',
  categories: 'Categories',
  requestbook: 'Request Book',
});

interface BookDetailsProps {
  book?: BookResult;
}

const BookDetails = ({ book }: BookDetailsProps) => {
  const router = useRouter();
  const intl = useIntl();
  const { hasPermission } = useUser();
  const [showRequestModal, setShowRequestModal] = useState(false);

  const { data, error, mutate: revalidate } = useSWR<BookResult>(
    `/api/v1/book/${router.query.bookId}`,
    { fallbackData: book }
  );

  const onRequestComplete = useCallback(
    (newStatus: MediaStatus) => {
      revalidate();
      setShowRequestModal(false);
    },
    [revalidate]
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <LoadingSpinner />;
  }

  const showRequestButton = hasPermission(
    [Permission.REQUEST, Permission.REQUEST_BOOK],
    { type: 'or' }
  );

  return (
    <div
      className="media-page"
      style={{
        height: 493,
      }}
    >
      <RequestModal
        show={showRequestModal}
        type="book"
        externalId={data.id}
        onComplete={onRequestComplete}
        onCancel={() => setShowRequestModal(false)}
      />
      {data.coverPath && (
        <div className="media-page-bg-image">
          <CachedImage
            alt=""
            src={data.coverPath}
            type="external"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            fill
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(180deg, rgba(17, 24, 39, 0.47) 0%, rgba(17, 24, 39, 1) 100%)',
            }}
          />
        </div>
      )}
      <PageTitle title={data.title} />
      <div className="media-header">
        <div className="media-poster">
          <CachedImage
            src={
              data.coverPath ?? '/images/seerr_poster_not_found_logo_top.png'
            }
            alt=""
            type="external"
            className="rounded-lg shadow-md"
            style={{ width: '100%', height: 'auto' }}
            width={300}
            height={450}
          />
        </div>
        <div className="media-title">
          <div className="media-status">
            {data.mediaInfo?.status && data.mediaInfo.status !== MediaStatus.UNKNOWN && (
              <StatusBadge
                status={data.mediaInfo.status}
                inProgress={
                  (data.mediaInfo?.downloadStatus ?? []).length > 0
                }
              />
            )}
          </div>
          <h1 data-testid="media-title">
            {data.title}
            {data.publishedDate && (
              <span className="media-year">
                ({data.publishedDate.slice(0, 4)})
              </span>
            )}
          </h1>
          <span className="media-attributes">
            {data.authors.length > 0 && (
              <span>{data.authors.join(', ')}</span>
            )}
            {data.pageCount && (
              <span>
                {intl.formatMessage(messages.pages, { count: data.pageCount })}
              </span>
            )}
          </span>
        </div>
      </div>
      <div className="media-overview">
        <div className="media-overview-left">
          {showRequestButton &&
            (!data.mediaInfo?.status ||
              data.mediaInfo.status === MediaStatus.UNKNOWN) && (
              <div className="mb-6">
                <Button
                  buttonType="primary"
                  onClick={() => setShowRequestModal(true)}
                >
                  <ArrowDownTrayIcon />
                  <span>{intl.formatMessage(messages.requestbook)}</span>
                </Button>
              </div>
            )}
          <h2>{intl.formatMessage(messages.overview)}</h2>
          <p>
            {data.description
              ? data.description
              : intl.formatMessage(messages.overviewunavailable)}
          </p>
          {data.categories.length > 0 && (
            <div className="mt-6">
              <span className="media-fact-title">
                {intl.formatMessage(messages.categories)}
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {data.categories.map((cat) => (
                  <Tag key={cat}>{cat}</Tag>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="media-overview-right">
          <div className="media-facts">
            {data.isbn && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.isbn)}</span>
                <span className="media-fact-value">{data.isbn}</span>
              </div>
            )}
            {data.publisher && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.publisher)}</span>
                <span className="media-fact-value">{data.publisher}</span>
              </div>
            )}
            {data.publishedDate && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.publishdate)}</span>
                <span className="media-fact-value">{data.publishedDate}</span>
              </div>
            )}
            {data.pageCount && (
              <div className="media-fact">
                <span>
                  <BookOpenIcon className="mr-1 inline h-4 w-4" />
                  {intl.formatMessage(messages.pages, {
                    count: data.pageCount,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
