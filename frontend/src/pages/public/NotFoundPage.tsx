import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageTransition } from '@/components/ui/PageTransition';
import { WatermarkBanner } from '@/components/ui/Watermark';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <PageTransition>
      <section className="relative flex min-h-[60vh] flex-1 items-center justify-center overflow-hidden bg-bg-primary px-4 py-16 dark:bg-slate-950">
        <WatermarkBanner className="text-primary-100/40 dark:text-white/5" icon={<Compass />} />

        <div className="relative z-10 mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-50 shadow-sm dark:bg-primary-900/40">
            <Compass className="h-10 w-10 text-secondary-500" />
          </div>

          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600 dark:text-secondary-400">
            {t('notFound.eyebrow')}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-primary-900 dark:text-white sm:text-5xl">
            {t('notFound.title')}
          </h1>
          <p className="mt-4 text-base text-text-secondary">
            {t('notFound.body')}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full gap-2 sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.goBack')}
            </Button>

            <Button
              onClick={() => navigate('/')}
              className="w-full gap-2 sm:w-auto"
            >
              <Home className="h-4 w-4" />
              {t('common.returnHome')}
            </Button>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
