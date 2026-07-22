import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Can } from '@/components/auth/Can';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useAllSiteContent,
  useCreateSiteContent,
  useUpdateSiteContent,
  useDeleteSiteContent,
  useSiteContact,
  useUpdateSiteContact,
  type SiteContentItem,
  type SiteContentType,
  type SiteContact,
} from '@/hooks/useSiteContent';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Eye, EyeOff, LayoutTemplate } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Website Content — the marketing site's CMS.
 *
 * Every list here starts empty on a fresh install and the public pages hide the
 * matching section until something is published, so nothing on the marketing
 * site is claimed until a real person has entered it.
 */

/** Which fields matter per content type, in the order the form shows them. */
const FIELDS: Record<SiteContentType, (keyof SiteContentItem)[]> = {
  testimonial: ['name', 'role', 'company', 'body', 'avatar_url'],
  case_study: ['company', 'metric', 'metric_label', 'body', 'name'],
  team_member: ['name', 'role', 'avatar_url'],
  milestone: ['year', 'title', 'body'],
  job_opening: ['title', 'department', 'location', 'apply_url'],
  blog_post: ['title', 'name', 'category', 'read_time', 'excerpt', 'body'],
};

/** Long-form fields render as a textarea rather than a single-line input. */
const MULTILINE = new Set<keyof SiteContentItem>(['body', 'excerpt']);

const TABS: { type: SiteContentType; i18n: string }[] = [
  { type: 'testimonial', i18n: 'testimonials' },
  { type: 'case_study', i18n: 'caseStudies' },
  { type: 'team_member', i18n: 'team' },
  { type: 'milestone', i18n: 'milestones' },
  { type: 'job_opening', i18n: 'jobs' },
  { type: 'blog_post', i18n: 'blog' },
];

const CONTACT_FIELDS: (keyof SiteContact)[] = [
  'email',
  'phone',
  'careers_email',
  'address_line',
  'address_city',
  'hours_weekdays',
  'hours_saturday',
  'hours_sunday',
  'legal_entity',
  'privacy_email',
  'legal_email',
];

function blankDraft(type: SiteContentType): Partial<SiteContentItem> {
  const draft: Partial<SiteContentItem> = { type, is_published: false, order: 0 };
  for (const field of FIELDS[type]) (draft as Record<string, unknown>)[field] = '';
  return draft;
}

export function SiteContentPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<SiteContentType>('testimonial');
  const [draft, setDraft] = useState<Partial<SiteContentItem> | null>(null);

  const { data: items = [], isLoading } = useAllSiteContent(tab);
  const createItem = useCreateSiteContent();
  const updateItem = useUpdateSiteContent();
  const deleteItem = useDeleteSiteContent();

  const label = (key: string) => t(`dashboard.siteContent.fields.${key}`);
  const rows = useMemo(() => items.filter((i) => i.type === tab), [items, tab]);

  const saveDraft = async () => {
    if (!draft) return;
    const { _id, ...values } = draft as SiteContentItem;
    try {
      if (_id) {
        await updateItem.mutateAsync({ id: _id, ...values });
      } else {
        await createItem.mutateAsync({ ...values, type: tab });
      }
      toast.success(t('dashboard.siteContent.saved'));
      setDraft(null);
    } catch {
      toast.error(t('dashboard.siteContent.saveFailed'));
    }
  };

  const togglePublished = async (item: SiteContentItem) => {
    try {
      await updateItem.mutateAsync({ id: item._id, is_published: !item.is_published });
    } catch {
      toast.error(t('dashboard.siteContent.saveFailed'));
    }
  };

  const removeItem = async (item: SiteContentItem) => {
    try {
      await deleteItem.mutateAsync(item._id);
      toast.success(t('dashboard.siteContent.removed'));
      if (draft?._id === item._id) setDraft(null);
    } catch {
      toast.error(t('dashboard.siteContent.removeFailed'));
    }
  };

  /** One line summarising a row in the list, whatever its type. */
  const summarise = (item: SiteContentItem) =>
    item.name || item.title || item.company || item.year || t('dashboard.siteContent.untitled');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('dashboard.siteContent.title')}</h1>
        <p className="text-sm text-text-secondary mt-1">{t('dashboard.siteContent.intro')}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((entry) => (
          <button
            key={entry.type}
            onClick={() => {
              setTab(entry.type);
              setDraft(null);
            }}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              tab === entry.type
                ? 'bg-primary-600 text-white'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary dark:bg-slate-800'
            )}
          >
            {t(`dashboard.siteContent.tabs.${entry.i18n}`)}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          title={t(`dashboard.siteContent.tabs.${TABS.find((e) => e.type === tab)!.i18n}`)}
          subtitle={t(`dashboard.siteContent.hints.${TABS.find((e) => e.type === tab)!.i18n}`)}
          action={
            <Can resource="site_content" action="create">
              <Button size="sm" onClick={() => setDraft(blankDraft(tab))}>
                <Plus className="h-4 w-4 mr-1.5" /> {t('dashboard.siteContent.add')}
              </Button>
            </Can>
          }
        />

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : rows.length === 0 && !draft ? (
          <EmptyState
            variant="plain"
            icon={<LayoutTemplate />}
            title={t('dashboard.siteContent.emptyTitle')}
            description={t('dashboard.siteContent.emptyDesc')}
          />
        ) : (
          <ul className="divide-y divide-border-color dark:divide-slate-800">
            {rows.map((item) => (
              <li key={item._id} className="flex items-center gap-3 py-3">
                <button
                  onClick={() => togglePublished(item)}
                  title={
                    item.is_published
                      ? t('dashboard.siteContent.unpublish')
                      : t('dashboard.siteContent.publish')
                  }
                  className={cn(
                    'shrink-0 rounded-lg p-1.5 transition-colors',
                    item.is_published
                      ? 'text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20'
                      : 'text-text-muted hover:bg-bg-secondary dark:hover:bg-slate-800'
                  )}
                >
                  {item.is_published ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>

                <button onClick={() => setDraft(item)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {summarise(item)}
                  </p>
                  <p className="truncate text-xs text-text-secondary">
                    {item.is_published
                      ? t('dashboard.siteContent.live')
                      : t('dashboard.siteContent.hidden')}
                    {item.body ? ` · ${item.body}` : ''}
                  </p>
                </button>

                <Can resource="site_content" action="delete">
                  <button
                    onClick={() => removeItem(item)}
                    className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/20"
                    title={t('dashboard.common.remove')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Can>
              </li>
            ))}
          </ul>
        )}

        {draft && (
          <div className="mt-5 border-t border-border-color pt-5 dark:border-slate-800">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {FIELDS[tab].map((field) =>
                MULTILINE.has(field) ? (
                  <div key={field} className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-text-secondary">
                      {label(field)}
                    </label>
                    <textarea
                      rows={3}
                      value={(draft[field] as string) ?? ''}
                      onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
                      className="block w-full rounded-md border border-border-color bg-card-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                ) : (
                  <Input
                    key={field}
                    label={label(field)}
                    value={(draft[field] as string) ?? ''}
                    onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
                  />
                )
              )}
              <Input
                label={t('dashboard.siteContent.fields.order')}
                type="number"
                value={draft.order ?? 0}
                onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })}
                hint={t('dashboard.siteContent.fields.orderHint')}
              />
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={!!draft.is_published}
                onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })}
                className="rounded border-border-color text-primary-600 focus:ring-primary-500"
              />
              {t('dashboard.siteContent.publishNow')}
            </label>

            <div className="mt-4 flex items-center gap-2">
              <Button onClick={saveDraft} loading={createItem.isPending || updateItem.isPending}>
                {t('dashboard.common.save')}
              </Button>
              <Button variant="ghost" onClick={() => setDraft(null)}>
                {t('dashboard.common.cancel')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ContactCard />
    </div>
  );
}

/** Contact details shown on the public Contact page and in the footer. */
function ContactCard() {
  const { t } = useTranslation();
  const { data, isLoading } = useSiteContact();
  const updateContact = useUpdateSiteContact();
  const [form, setForm] = useState<SiteContact | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = async () => {
    if (!form) return;
    try {
      await updateContact.mutateAsync(form);
      toast.success(t('dashboard.siteContent.saved'));
    } catch {
      toast.error(t('dashboard.siteContent.saveFailed'));
    }
  };

  return (
    <Card>
      <CardHeader
        title={t('dashboard.siteContent.contactTitle')}
        subtitle={t('dashboard.siteContent.contactSubtitle')}
      />
      {isLoading || !form ? (
        <p className="py-8 text-center text-sm text-text-muted">{t('dashboard.common.loading')}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CONTACT_FIELDS.map((field) => (
              <Input
                key={field}
                label={t(`dashboard.siteContent.contact.${field}`)}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-text-muted">{t('dashboard.siteContent.contactHint')}</p>
          <div className="mt-4">
            <Button onClick={save} loading={updateContact.isPending}>
              {t('dashboard.common.save')}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
