import { useState, useEffect } from 'react';
import type { FilterState } from '@/components/auction/AuctionFilters';

export interface SearchHistoryItem {
  id: string;
  timestamp: number;
  searchQuery: string;
  filters: Omit<FilterState, 'limit'>;
  resultCount?: number;
  displayText: string;
}

const SEARCH_HISTORY_KEY = 'auction_search_history';
const MAX_HISTORY_ITEMS = 10;

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SearchHistoryItem[];
        // Sort by timestamp (newest first) and limit to MAX_HISTORY_ITEMS
        const sorted = parsed
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MAX_HISTORY_ITEMS);
        setSearchHistory(sorted);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    try {
      if (searchHistory.length > 0) {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
      }
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, [searchHistory]);

  const createDisplayText = (filters: Omit<FilterState, 'limit'>): string => {
    const parts: string[] = [];
    
    if (filters.searchQuery.trim()) {
      parts.push(`"${filters.searchQuery.trim()}"`);
    }
    
    if (filters.selectedMakeId !== 'all') {
      parts.push(`Make: ${filters.selectedMakeId}`);
    }
    
    if (filters.selectedModelId !== 'all') {
      parts.push(`Model: ${filters.selectedModelId}`);
    }
    
    if (filters.auctionFilter !== 'all') {
      parts.push(`Auction: ${filters.auctionFilter}`);
    }
    
    if (filters.fuelType !== 'all') {
      parts.push(`Fuel: ${filters.fuelType}`);
    }
    
    if (filters.category !== 'all') {
      parts.push(`Category: ${filters.category}`);
    }
    
    if (filters.drive !== 'all') {
      parts.push(`Drive: ${filters.drive}`);
    }
    
    if (filters.buyNowOnly) {
      parts.push('Buy Now');
    }
    
    if (filters.priceRange[0] > 0 || filters.priceRange[1] > 0) {
      const from = filters.priceRange[0] || '?';
      const to = filters.priceRange[1] || '?';
      parts.push(`Price: $${from}-${to}`);
    }
    
    if (filters.yearRange[0] > 0 || filters.yearRange[1] > 0) {
      const from = filters.yearRange[0] || '?';
      const to = filters.yearRange[1] || '?';
      parts.push(`Year: ${from}-${to}`);
    }
    
    if (filters.mileageRange[0] > 0 || filters.mileageRange[1] > 0) {
      const from = filters.mileageRange[0] || '?';
      const to = filters.mileageRange[1] || '?';
      parts.push(`Mileage: ${from}-${to}`);
    }
    
    if (filters.exactYear) {
      parts.push(`Year: ${filters.exactYear}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'All vehicles';
  };

  const saveSearch = (
    filters: FilterState,
    resultCount?: number
  ) => {
    // Don't save if search query is too short and no other filters are applied
    const hasContent = filters.searchQuery.trim().length >= 3 || 
                      filters.selectedMakeId !== 'all' ||
                      filters.selectedModelId !== 'all' ||
                      filters.auctionFilter !== 'all' ||
                      filters.fuelType !== 'all' ||
                      filters.category !== 'all' ||
                      filters.drive !== 'all' ||
                      filters.buyNowOnly ||
                      filters.priceRange[0] > 0 ||
                      filters.priceRange[1] > 0 ||
                      filters.yearRange[0] > 0 ||
                      filters.yearRange[1] > 0 ||
                      filters.mileageRange[0] > 0 ||
                      filters.mileageRange[1] > 0 ||
                      filters.exactYear !== '';

    if (!hasContent) return;

    const searchItem: SearchHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      searchQuery: filters.searchQuery,
      filters: {
        ...filters,
        // Omit limit from saved filters as it's UI-specific
      },
      resultCount,
      displayText: createDisplayText(filters)
    };

    setSearchHistory(prev => {
      // Remove any existing searches with the same filters
      const filtered = prev.filter(item => 
        item.searchQuery !== searchItem.searchQuery ||
        JSON.stringify(item.filters) !== JSON.stringify(searchItem.filters)
      );
      
      // Add new search at the beginning and limit to MAX_HISTORY_ITEMS
      const updated = [searchItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      return updated;
    });
  };

  const deleteSearch = (id: string) => {
    setSearchHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearAllSearches = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  };

  const applySearchHistory = (item: SearchHistoryItem) => {
    // This will be used to apply the saved search filters
    return {
      ...item.filters,
      limit: 36 // Restore default limit
    } as FilterState;
  };

  return {
    searchHistory,
    saveSearch,
    deleteSearch,
    clearAllSearches,
    applySearchHistory
  };
};
