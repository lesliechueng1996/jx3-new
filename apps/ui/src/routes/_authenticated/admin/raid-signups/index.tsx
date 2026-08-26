import { createFileRoute, useNavigate } from '@tanstack/react-router';
import ErrorAlert from '#/components/ErrorAlert';
import Pagination from '#/components/Pagination';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import {
  type AdminRaidSignupListItem,
  adminListRaidSignups,
} from '@/lib/api/admin/admin-raid-signups-api';
import { RaidSignupFiltersComponent } from './-components/RaidSignupFiltersComponent';
import { RaidSignupTableComponent } from './-components/RaidSignupTableComponent';
import {
  defaultRaidSignupsSearch,
  raidSignupsSearchSchema,
  toListRaidSignupsFilters,
} from './-lib/raid-signups-schema';

export const Route = createFileRoute('/_authenticated/admin/raid-signups/')({
  component: RaidSignupsComponent,
  validateSearch: raidSignupsSearchSchema,
});

const raidSignupsAdminQueryKey = ['admin-raid-signups'];

function RaidSignupsComponent() {
  const navigate = useNavigate();
  const routeNavigate = Route.useNavigate();
  const search = Route.useSearch();

  const {
    items,
    isFetching,
    isError,
    setSearch,
    resetSearch,
    paginationProps,
  } = usePaginatedQuery({
    queryKey: raidSignupsAdminQueryKey,
    search,
    defaults: defaultRaidSignupsSearch,
    navigate: routeNavigate,
    queryFn: (nextSearch) =>
      adminListRaidSignups(toListRaidSignupsFilters(nextSearch)),
  });

  const handleView = (signup: AdminRaidSignupListItem) => {
    navigate({
      to: '/raid-run/$id',
      params: { id: signup.raidRunId },
    });
  };

  return (
    <section className="flex flex-col gap-6">
      <RaidSignupFiltersComponent
        committedFilters={search}
        onSearch={setSearch}
        onReset={resetSearch}
      />

      {isError ? (
        <ErrorAlert title="错误" description="加载报名列表失败，请稍后重试。" />
      ) : null}

      <RaidSignupTableComponent
        items={items}
        isLoading={isFetching}
        onView={handleView}
      />

      <Pagination {...paginationProps} />
    </section>
  );
}
