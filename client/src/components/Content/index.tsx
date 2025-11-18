import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
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

// TODO-FX: Connect to i18n library.
const t = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const Content: React.FC<ContentProps> = ({ content, loading }) => {
  const navigate = useNavigate();
  // TODO-FX: Replace with real API call.
  // API Endpoint: GET /api/content/home
  // Expected Data:
  // type: object
  // properties:
  //   title:
  //     type: string
  //   subtitle:
  //     type: string
  //   description:
  //     type: string
  //   features:
  //     type: array
  //     items:
  //       type: object
  //       properties:
  //         id:
  //           type: string
  //         title:
  //           type: string
  //         description:
  //           type: string

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

  return (
    <main className="flex-1" role="main">
      <div className="container mx-auto py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Hero section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              {content.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              {content.subtitle}
            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {content.description}
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Button onClick={() => navigate('/catalog')}>
                <Icon icon="mdi:magnify" className="mr-2 h-4 w-4" />
                {t('content.find_companies')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/catalog')}>
                {t('content.view_catalog')}
              </Button>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {content.features.map((feature: Feature) => (
              <Card key={feature.id} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon icon={feature.id === '1' ? 'mdi:truck-delivery' : feature.id === '2' ? 'mdi:shield-check' : 'mdi:cash-multiple'} className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
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
                  <Icon icon="mdi:car" className="mr-2 h-5 w-5" />
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
