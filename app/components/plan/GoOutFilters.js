
'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, Loader2, MapPin, Filter, Star, Users, Wifi, Car, Accessibility, WashingMachine, Coffee } from 'lucide-react';

const FILTER_OPTIONS = {
  dinings: {
    type: ['veg', 'non-veg'],
    cuisines: [] // Will be populated dynamically from API
  },
  events: {
    type: [], // Will be populated dynamically from API
    venue: [] // Will be populated dynamically from API
  },
  activities: {
    type: [], // Will be populated dynamically from API
    venue: [], // Will be populated dynamically from API
    intensity: [] // Will be populated dynamically from API
  },
  plays: {
    type: [], // Will be populated dynamically from API
    venue: [], // Will be populated dynamically from API
    intensity: [] // Will be populated dynamically from API
  },
  movies: {
    genre: [], // Will be populated dynamically from API
    language: ['Hindi', 'English'],
    format: [], // Will be populated dynamically from API
    cast: [] // Will be populated dynamically from API
  }
};

const AMENITY_FILTERS = ['wifi', 'washroom', 'wheelchair', 'parking'];
const CROWD_TOLERANCE = ['low', 'medium', 'high'];

export default function GoOutFilters({ type, filters, onUpdate }) {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters?.filters || {});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dynamicCuisines, setDynamicCuisines] = useState([]);
  const [dynamicMovieMetadata, setDynamicMovieMetadata] = useState({
    genres: [],
    formats: [],
    cast: []
  });
  const [dynamicEventMetadata, setDynamicEventMetadata] = useState({
    types: [],
    venues: []
  });
  const [dynamicActivityMetadata, setDynamicActivityMetadata] = useState({
    types: [],
    venues: [],
    intensities: []
  });
  const [dynamicPlayMetadata, setDynamicPlayMetadata] = useState({
    types: [],
    venues: [],
    intensities: []
  });

  const options = FILTER_OPTIONS[type] || {};
  
  // Fetch cuisines dynamically from API when type is 'dinings'
  useEffect(() => {
    if (type === 'dinings') {
      const fetchCuisines = async () => {
        try {
          const response = await fetch('/api/cuisines');
          const data = await response.json();
          if (data.success && data.cuisines) {
            setDynamicCuisines(data.cuisines);
          }
        } catch (error) {
          console.error('Error fetching cuisines:', error);
        }
      };
      fetchCuisines();
    }
  }, [type]);
  
  // Fetch movie metadata dynamically from API when type is 'movies'
  useEffect(() => {
    if (type === 'movies') {
      const fetchMovieMetadata = async () => {
        try {
          const response = await fetch('/api/movies-metadata');
          const data = await response.json();
          if (data.success) {
            setDynamicMovieMetadata({
              genres: data.genres || [],
              formats: data.formats || [],
              cast: data.cast || []
            });
          }
        } catch (error) {
          console.error('Error fetching movie metadata:', error);
        }
      };
      fetchMovieMetadata();
    }
  }, [type]);
  
  // Fetch event metadata dynamically from API when type is 'events'
  useEffect(() => {
    if (type === 'events') {
      const fetchEventMetadata = async () => {
        try {
          const response = await fetch('/api/events-metadata');
          const data = await response.json();
          if (data.success) {
            setDynamicEventMetadata({
              types: data.types || [],
              venues: data.venues || []
            });
          }
        } catch (error) {
          console.error('Error fetching event metadata:', error);
        }
      };
      fetchEventMetadata();
    }
  }, [type]);
  
  // Fetch activity metadata dynamically from API when type is 'activities'
  useEffect(() => {
    if (type === 'activities') {
      const fetchActivityMetadata = async () => {
        try {
          const response = await fetch('/api/activities-metadata');
          const data = await response.json();
          if (data.success) {
            setDynamicActivityMetadata({
              types: data.types || [],
              venues: data.venues || [],
              intensities: data.intensities || []
            });
          }
        } catch (error) {
          console.error('Error fetching activity metadata:', error);
        }
      };
      fetchActivityMetadata();
    }
  }, [type]);
  
  // Fetch play metadata dynamically from API when type is 'plays'
  useEffect(() => {
    if (type === 'plays') {
      const fetchPlayMetadata = async () => {
        try {
          const response = await fetch('/api/plays-metadata');
          const data = await response.json();
          if (data.success) {
            setDynamicPlayMetadata({
              types: data.types || [],
              venues: data.venues || [],
              intensities: data.intensities || []
            });
          }
        } catch (error) {
          console.error('Error fetching play metadata:', error);
        }
      };
      fetchPlayMetadata();
    }
  }, [type]);
  
  // Use dynamic cuisines if available, otherwise fall back to static options
  if (type === 'dinings' && dynamicCuisines.length > 0) {
    options.cuisines = dynamicCuisines;
  }
  
  // Use dynamic movie metadata if available
  if (type === 'movies') {
    if (dynamicMovieMetadata.genres.length > 0) {
      options.genre = dynamicMovieMetadata.genres;
    }
    if (dynamicMovieMetadata.formats.length > 0) {
      options.format = dynamicMovieMetadata.formats;
    }
    if (dynamicMovieMetadata.cast.length > 0) {
      options.cast = dynamicMovieMetadata.cast;
    }
  }
  
  // Use dynamic event metadata if available
  if (type === 'events') {
    if (dynamicEventMetadata.types.length > 0) {
      options.type = dynamicEventMetadata.types;
    }
    if (dynamicEventMetadata.venues.length > 0) {
      options.venue = dynamicEventMetadata.venues;
    }
  }
  
  // Use dynamic activity metadata if available
  if (type === 'activities') {
    if (dynamicActivityMetadata.types.length > 0) {
      options.type = dynamicActivityMetadata.types;
    }
    if (dynamicActivityMetadata.venues.length > 0) {
      options.venue = dynamicActivityMetadata.venues;
    }
    if (dynamicActivityMetadata.intensities.length > 0) {
      options.intensity = dynamicActivityMetadata.intensities;
    }
  }
  
  // Use dynamic play metadata if available
  if (type === 'plays') {
    if (dynamicPlayMetadata.types.length > 0) {
      options.type = dynamicPlayMetadata.types;
    }
    if (dynamicPlayMetadata.venues.length > 0) {
      options.venue = dynamicPlayMetadata.venues;
    }
    if (dynamicPlayMetadata.intensities.length > 0) {
      options.intensity = dynamicPlayMetadata.intensities;
    }
  }

  // Count active filters (non-empty arrays, defined booleans, and numbers)
  const getActiveFilterCount = () => {
    return Object.entries(localFilters).reduce((count, [key, value]) => {
      if (Array.isArray(value) && value.length > 0) return count + 1;
      if (typeof value === 'boolean') return count + 1;
      if (typeof value === 'number') return count + 1;
      return count;
    }, 0);
  };

  // Debounced search for venues
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch(`/api/search-venues?q=${encodeURIComponent(searchQuery)}&type=${type}&limit=10`);
        const data = await response.json();
        if (data.venues) {
          setSearchResults(data.venues);
        }
      } catch (error) {
        console.error('Venue search error:', error);
      }
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, type]);

  // Check if this is a specific venue object (has _id)
  const hasSpecificVenue = filters && filters._id;

  // Initialize with correct structure if filters is empty or undefined
  useEffect(() => {
    if (!filters || (Object.keys(filters).length === 0)) {
      onUpdate({ filters: {} });
    }
  }, []);

  const handleClearVenue = () => {
    onUpdate({ filters: {} });
    setLocalFilters({});
  };

  const handleVenueSelect = (venue) => {
    onUpdate(venue); // Send venue object directly (not wrapped)
    setSearchQuery('');
    setSearchResults([]);
  };

  // If a specific venue is selected, show only venue info, no filters
  if (hasSpecificVenue) {
    const venue = filters;
    return (
      <div className="space-y-3">
        <div className="p-4 bg-purple-900/30 backdrop-blur-sm border border-purple-500/50 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-purple-200">{venue.name}</h4>
              <p className="text-sm text-gray-300 mt-1">
                Rating: {venue.rating || 'N/A'} ⭐ | Price: ₹{venue.pricePerPerson || 'N/A'}/person
              </p>
              {venue.address && (
                <p className="text-xs text-gray-400 mt-1">{venue.address}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleClearVenue}
              className="ml-4 px-3 py-1 text-sm bg-red-900/50 text-red-300 rounded-lg hover:bg-red-900/70 border border-red-500/30 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleArrayToggle = (key, value) => {
    const current = localFilters[key] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    
    const newFilters = { ...localFilters };
    if (updated.length === 0) {
      delete newFilters[key];
    } else {
      newFilters[key] = updated;
    }
    setLocalFilters(newFilters);
    onUpdate({ filters: newFilters });
  };

  const handleBooleanToggle = (key) => {
    const newFilters = {
      ...localFilters,
      [key]: localFilters[key] === undefined ? true : localFilters[key] === true ? false : undefined
    };
    if (newFilters[key] === undefined) delete newFilters[key];
    setLocalFilters(newFilters);
    onUpdate({ filters: newFilters });
  };

  const handleNumberChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value ? parseFloat(value) : undefined };
    if (!value) delete newFilters[key];
    setLocalFilters(newFilters);
    onUpdate({ filters: newFilters });
  };

  return (
    <div className="space-y-3">
      {/* Search for specific venue */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search for a specific ${type.slice(0, -1)}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-200 placeholder-gray-500"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>

        {/* Autocomplete dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-gray-800/95 backdrop-blur-sm border border-purple-500/30 rounded-lg shadow-lg shadow-purple-500/20 max-h-60 overflow-y-auto">
            {searchResults.map((venue, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleVenueSelect(venue)}
                className="w-full px-4 py-3 text-left hover:bg-purple-900/30 flex items-start gap-2 border-b border-gray-700/50 last:border-b-0 transition-colors"
              >
                <MapPin className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-200">{venue.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {venue.rating && `⭐ ${venue.rating}`} {venue.pricePerPerson && `• ₹${venue.pricePerPerson}/person`}
                  </div>
                  {venue.address && (
                    <div className="text-xs text-gray-500 mt-1">{venue.address}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
        <span className="text-sm font-medium text-purple-300">OR</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
      </div>

      {/* Filters toggle button */}
      <button
        type="button"
        onClick={() => setShowFilters(!showFilters)}
        className="group relative flex items-center justify-between w-full px-5 py-3 bg-gradient-to-r from-gray-800/50 to-gray-800/30 border border-purple-500/30 rounded-xl hover:from-purple-900/40 hover:to-pink-900/30 hover:border-purple-400/50 transition-all duration-300 shadow-lg hover:shadow-purple-500/20"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600/20 rounded-lg group-hover:bg-purple-600/30 transition-colors">
            <Filter className="w-4 h-4 text-purple-400" />
          </div>
          <span className="font-semibold text-purple-200 group-hover:text-purple-100 transition-colors">
            {showFilters ? 'Hide' : 'Show'} Filters
            {getActiveFilterCount() > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </span>
        </div>
        {showFilters ? (
          <ChevronUp className="w-5 h-5 text-purple-300 group-hover:text-purple-200 transition-colors" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-300 group-hover:text-purple-200 transition-colors" />
        )}
      </button>

      {showFilters && (
        <div className="mt-4 space-y-5 p-5 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md border border-purple-500/40 rounded-2xl max-h-96 overflow-y-auto shadow-xl shadow-purple-500/10 animate-in slide-in-from-top-2 duration-300">
          {/* Type-specific filters */}
          {Object.entries(options).map(([key, values]) => (
            <div key={key} className="p-4 bg-gray-900/30 rounded-xl border border-purple-500/20">
              <label className="flex items-center gap-2 text-sm font-semibold text-purple-300 mb-3 capitalize">
                <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"></div>
                {key}
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                {values.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleArrayToggle(key, value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 transform hover:scale-105 ${
                      (localFilters[key] || []).includes(value)
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500 shadow-lg shadow-purple-500/50'
                        : 'bg-gray-800/50 text-gray-300 border-gray-600/50 hover:border-purple-400 hover:bg-purple-900/30 hover:text-purple-200'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Alcohol for dining */}
          {type === 'dinings' && (
            <div className="p-4 bg-gray-900/30 rounded-xl border border-purple-500/20">
              <label className="flex items-center gap-2 text-sm font-semibold text-purple-300 mb-3">
                <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"></div>
                Alcohol
              </label>
              <button
                type="button"
                onClick={() => handleBooleanToggle('alcohol')}
                className={`w-full px-4 py-3 rounded-lg text-sm font-medium border transition-all duration-200 transform hover:scale-[1.02] ${
                  localFilters.alcohol === true
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-500 shadow-lg shadow-green-500/30'
                    : localFilters.alcohol === false
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-500 shadow-lg shadow-red-500/30'
                    : 'bg-gray-800/50 text-gray-300 border-gray-600/50 hover:border-purple-400 hover:bg-purple-900/30'
                }`}
              >
                {localFilters.alcohol === true && '🍷 Required ✓'}
                {localFilters.alcohol === false && '🚫 Not Required ✗'}
                {localFilters.alcohol === undefined && 'No Preference'}
              </button>
            </div>
          )}

          {/* Amenity Filters */}
          <div className="p-4 bg-gray-900/30 rounded-xl border border-purple-500/20">
            <label className="flex items-center gap-2 text-sm font-semibold text-purple-300 mb-3">
              <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"></div>
              Amenities
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AMENITY_FILTERS.map((amenity) => {
                const amenityIcons = {
                  wifi: <Wifi className="w-4 h-4" />,
                  washroom: <WashingMachine className="w-4 h-4" />,
                  wheelchair: <Accessibility className="w-4 h-4" />,
                  parking: <Car className="w-4 h-4" />
                };
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => handleBooleanToggle(amenity)}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 transform hover:scale-[1.02] capitalize ${
                      localFilters[amenity] === true
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-500 shadow-lg shadow-green-500/30'
                        : localFilters[amenity] === false
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-500 shadow-lg shadow-red-500/30'
                        : 'bg-gray-800/50 text-gray-300 border-gray-600/50 hover:border-purple-400 hover:bg-purple-900/30'
                    }`}
                  >
                    {amenityIcons[amenity]}
                    <span>{amenity}</span>
                    {localFilters[amenity] === true && <span>✓</span>}
                    {localFilters[amenity] === false && <span>✗</span>}
                  </button>
                );
              })}
              
              {/* Cafe for plays */}
              {type === 'plays' && (
                <button
                  type="button"
                  onClick={() => handleBooleanToggle('cafe')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 transform hover:scale-[1.02] ${
                    localFilters.cafe === true
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-500 shadow-lg shadow-green-500/30'
                      : localFilters.cafe === false
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-500 shadow-lg shadow-red-500/30'
                      : 'bg-gray-800/50 text-gray-300 border-gray-600/50 hover:border-purple-400 hover:bg-purple-900/30'
                  }`}
                >
                  <Coffee className="w-4 h-4" />
                  <span>cafe</span>
                  {localFilters.cafe === true && <span>✓</span>}
                  {localFilters.cafe === false && <span>✗</span>}
                </button>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="p-4 bg-gray-900/30 rounded-xl border border-purple-500/20">
            <label className="flex items-center gap-2 text-sm font-semibold text-purple-300 mb-3">
              <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"></div>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              Minimum Rating
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                placeholder="e.g., 4.5"
                value={localFilters.rating || ''}
                onChange={(e) => handleNumberChange('rating', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-200 placeholder-gray-500 font-medium transition-all duration-200"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                <Star className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Crowd Tolerance */}
          <div className="p-4 bg-gray-900/30 rounded-xl border border-purple-500/20">
            <label className="flex items-center gap-2 text-sm font-semibold text-purple-300 mb-3">
              <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"></div>
              <Users className="w-4 h-4" />
              Crowd Tolerance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CROWD_TOLERANCE.map((level) => {
                const crowdIcons = {
                  low: '😌',
                  medium: '👥',
                  high: '🎉'
                };
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleArrayToggle('crowdTolerance', level)}
                    className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg text-sm font-medium border transition-all duration-200 transform hover:scale-[1.02] capitalize ${
                      (localFilters.crowdTolerance || []).includes(level)
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500 shadow-lg shadow-purple-500/50'
                        : 'bg-gray-800/50 text-gray-300 border-gray-600/50 hover:border-purple-400 hover:bg-purple-900/30'
                    }`}
                  >
                    <span className="text-xl">{crowdIcons[level]}</span>
                    <span>{level}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
