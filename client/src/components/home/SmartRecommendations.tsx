import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';

// Mock data for "Smart Defaults"
const RECOMMENDATIONS = [
  {
    id: 'fastest',
    badge: 'Fastest Delivery',
    icon: 'mdi:speedometer',
    badgeColor: 'bg-blue-100 text-blue-700',
    company: 'FastTrack Logistics',
    logo: '/avatars/company-1.png', // Mock path, will fallback
    price: '$1,550',
    time: '30-35 days',
    rating: '4.9'
  },
  {
    id: 'cheapest',
    badge: 'Best Price',
    icon: 'mdi:cash-multiple',
    badgeColor: 'bg-green-100 text-green-700',
    company: 'Budget Import',
    logo: '/avatars/company-2.png',
    price: '$1,150',
    time: '45-60 days',
    rating: '4.6'
  },
  {
    id: 'trusted',
    badge: 'Top Rated',
    icon: 'mdi:star-circle',
    badgeColor: 'bg-purple-100 text-purple-700',
    company: 'Premium Auto',
    logo: '/avatars/company-3.png',
    price: '$1,350',
    time: '40 days',
    rating: '5.0'
  }
];

export function SmartRecommendations() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
      {RECOMMENDATIONS.map((item) => (
        <Card 
          key={item.id} 
          className="relative overflow-hidden border-slate-200 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
          onClick={() => navigate('/catalog')}
        >
          <div className={`absolute top-0 left-0 right-0 h-1 ${item.badgeColor.replace('text', 'bg').split(' ')[0]}`} />
          
          <CardContent className="p-6 pt-8 flex flex-col items-center text-center space-y-4">
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mb-2 ${item.badgeColor}`}>
              <Icon icon={item.icon} className="w-3 h-3" />
              {item.badge}
            </div>
            
            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
               <Icon icon="mdi:domain" className="h-8 w-8 text-slate-400" />
            </div>

            <div>
               <h3 className="font-bold text-slate-900 text-lg">{item.company}</h3>
               <div className="flex items-center justify-center gap-1 text-sm text-amber-500 font-medium">
                  <Icon icon="mdi:star" /> {item.rating}
               </div>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 space-y-1">
               <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Service Cost</span>
                  <span className="font-bold text-slate-900">{item.price}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Timeline</span>
                  <span className="font-medium text-slate-700">{item.time}</span>
               </div>
            </div>

            <Button className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white">
               View Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

