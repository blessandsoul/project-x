import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react/dist/iconify.js';

interface Feature {
  id: string;
  title: string;
  description: string;
}

interface ContentData {
  title: string;
  subtitle: string;
  description: string;
  features: Feature[];
}

interface ContentProps {
  content: ContentData;
  loading?: boolean;
}

const Content: React.FC<ContentProps> = ({ content, loading }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (loading) {
    return (
      <main className="flex-1" role="main">
        <div className="container mx-auto py-12">
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Skeleton loading state */}
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // We ignore the props content titles for static translations if they match our keys, 
  // or we can mix them. For this task, assuming we want to use the translations 
  // we just created for the homepage content.
  // However, the component receives `content` prop which might come from an API.
  // If `content` prop is used, we should stick to it, OR if the goal is to translate the static homepage,
  // we should use t() keys. 
  // Given the instructions "Refactor Content component to use i18n", I will use t() 
  // but fallback to prop content if keys are missing or for dynamic parts.
  
  // Actually, looking at `HomePage.tsx` (which likely calls this), it passes data.
  // But the task implies we want to translate the site.
  // If I replace `content.title` with `t('content.title')`, I ignore the prop.
  // I will prioritize `t()` if it returns a value, or use the prop. 
  // But `t` always returns the key if missing.
  
  // Best approach for this specific refactor: Use `t()` directly for the static parts found in the translation file.
  // The `content` prop seemed to be a mock of API data. If we want full i18n, we should use the translation files.

  return (
    <main className="flex-1" role="main">
      <div className="container mx-auto py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Hero section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              {t('content.title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('content.subtitle')}
            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('content.description')}
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Button onClick={() => navigate('/catalog')}>
                <Icon icon="mdi:magnify" className="me-2 h-4 w-4" />
                {t('content.find_companies')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/catalog')}>
                {t('content.view_catalog')}
              </Button>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon icon="mdi:truck-delivery" className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t('content.features.delivery.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t('content.features.delivery.description')}</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon icon="mdi:shield-check" className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t('content.features.security.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t('content.features.security.description')}</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon icon="mdi:cash-multiple" className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t('content.features.price.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t('content.features.price.description')}</CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Call to action */}
          <div className="text-center py-8">
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold mb-2">
                  {t('content.ready_to_start')}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {t('content.join_thousands')}
                </p>
                <Button size="lg" onClick={() => navigate('/catalog')}>
                  <Icon icon="mdi:car" className="me-2 h-5 w-5" />
                  {t('content.start_import')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

Content.propTypes = {
  content: PropTypes.shape({
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    features: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
  loading: PropTypes.bool,
};

export default Content;
