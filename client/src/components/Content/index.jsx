import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react/dist/iconify.js';

// TODO-FX: Connect to i18n library.
const t = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const Content = ({ content, loading, onAction }) => {
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
              <Button onClick={() => onAction?.('get-started')}>
                <Icon icon="mdi:rocket-launch" className="mr-2 h-4 w-4" />
                {t('content.get_started')}
              </Button>
              <Button variant="outline" onClick={() => onAction?.('learn-more')}>
                {t('content.learn_more')}
              </Button>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {content.features.map((feature) => (
              <Card key={feature.id} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon icon="mdi:star" className="h-6 w-6 text-primary" />
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
                <Button size="lg" onClick={() => onAction?.('sign-up')}>
                  <Icon icon="mdi:account-plus" className="mr-2 h-5 w-5" />
                  {t('content.sign_up_now')}
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
  onAction: PropTypes.func,
};

Content.defaultProps = {
  loading: false,
  onAction: () => {},
};

export default Content;
