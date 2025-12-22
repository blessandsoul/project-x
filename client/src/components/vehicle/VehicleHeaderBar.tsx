import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface VehicleHeaderBarProps {
  year?: number | null;
  make?: string | null;
  model?: string | null;
}

const VehicleHeaderBar = ({
  year,
  make,
  model,
}: VehicleHeaderBarProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <header className="vehicle-header space-y-2 mb-4">
      <div className="vehicle-header-row flex items-center justify-between mb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 px-0 h-auto text-primary text-[13px] font-medium hover:underline"
        >
          <Icon icon="mdi:arrow-left" className="w-4 h-4" />
          {t('vehicle.back_to_results')}
        </Button>
      </div>
      <div className="vehicle-header-title-row">
        <h1 className="vehicle-header-title text-2xl sm:text-3xl font-bold text-primary uppercase">
          {year} {make} {model}
        </h1>
      </div>
    </header>
  );
};

export default VehicleHeaderBar;
