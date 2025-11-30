import { Icon } from '@iconify/react';

export function CompanyListMock() {
  const companies = [
    { id: 1, name: 'Caucasus Auto', rating: 4.9, reviews: 124, logo: 'bg-blue-500', verified: true },
    { id: 2, name: 'Global Trans', rating: 4.8, reviews: 89, logo: 'bg-green-500', verified: true },
    { id: 3, name: 'Auto Import GE', rating: 4.7, reviews: 256, logo: 'bg-orange-500', verified: true },
    { id: 4, name: 'Lion Motors', rating: 5.0, reviews: 42, logo: 'bg-red-500', verified: true },
  ];

  return (
    <div className="h-full w-full bg-slate-950 text-white overflow-hidden flex flex-col">
      {/* App Header */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Companies</h2>
            <p className="text-xs text-slate-400">Find your trusted partner</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
            <Icon icon="mdi:bell-outline" className="h-4 w-4" />
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <div className="w-full h-9 bg-white/10 rounded-lg pl-9 pr-3 flex items-center text-xs text-slate-400">
            Search companies...
          </div>
        </div>
      </div>

      {/* Company List */}
      <div className="flex-1 overflow-hidden px-4 space-y-3">
        {companies.map((company) => (
          <div key={company.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer group">
            <div className={`h-10 w-10 rounded-lg ${company.logo} flex items-center justify-center shadow-lg`}>
              <span className="font-bold text-white text-xs">{company.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{company.name}</h3>
                {company.verified && (
                  <Icon icon="mdi:check-decagram" className="h-3.5 w-3.5 text-blue-400" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-0.5 text-amber-400">
                  <Icon icon="mdi:star" className="h-3 w-3" />
                  <span className="font-medium">{company.rating}</span>
                </div>
                <span>•</span>
                <span>{company.reviews} reviews</span>
              </div>
            </div>
            <Icon icon="mdi:chevron-right" className="h-5 w-5 text-slate-600 group-hover:text-slate-400" />
          </div>
        ))}
        
        {/* Fade out at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
