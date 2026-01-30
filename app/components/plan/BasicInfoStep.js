
'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, MapPin, Navigation, Search, Loader2 } from 'lucide-react';

export default function BasicInfoStep({ formData, onNext }) {
  const [localData, setLocalData] = useState(formData);
  const [showOptional, setShowOptional] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Start location autocomplete state
  const [startLocationQuery, setStartLocationQuery] = useState('');
  const [startLocationSuggestions, setStartLocationSuggestions] = useState([]);
  const [startLocationLoading, setStartLocationLoading] = useState(false);
  const [selectedStartLocation, setSelectedStartLocation] = useState('');
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  
  // End location autocomplete state
  const [endLocationQuery, setEndLocationQuery] = useState('');
  const [endLocationSuggestions, setEndLocationSuggestions] = useState([]);
  const [endLocationLoading, setEndLocationLoading] = useState(false);
  const [selectedEndLocation, setSelectedEndLocation] = useState('');

  const validate = () => {
    const newErrors = {};
    
    if (!localData.startTime) newErrors.startTime = 'Start time is required';
    if (!localData.budget) newErrors.budget = 'Budget is required';
    if (!localData.numberOfPeople) newErrors.numberOfPeople = 'Number of people is required';
    if (!localData.startLocation.lat || !localData.startLocation.lng) {
      newErrors.startLocation = 'Start location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onNext(localData);
    }
  };

  const handleTravelToleranceToggle = (value) => {
    const current = localData.travelTolerance || [];
    const newTolerance = current.includes(value)
      ? current.filter(t => t !== value)
      : [...current, value];
    
    setLocalData(prev => ({ ...prev, travelTolerance: newTolerance }));
  };

  // Debounced autocomplete for start location
  useEffect(() => {
    if (startLocationQuery.length < 2) {
      setStartLocationSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setStartLocationLoading(true);
      try {
        const response = await fetch(`/api/geocode/autocomplete?text=${encodeURIComponent(startLocationQuery)}`);
        const data = await response.json();
        if (data.success) {
          setStartLocationSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error('Start location autocomplete error:', error);
      }
      setStartLocationLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [startLocationQuery]);

  // Debounced autocomplete for end location
  useEffect(() => {
    if (endLocationQuery.length < 2) {
      setEndLocationSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setEndLocationLoading(true);
      try {
        const response = await fetch(`/api/geocode/autocomplete?text=${encodeURIComponent(endLocationQuery)}`);
        const data = await response.json();
        if (data.success) {
          setEndLocationSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error('End location autocomplete error:', error);
      }
      setEndLocationLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [endLocationQuery]);

  // Handle start location selection
  const handleStartLocationSelect = (suggestion) => {
    setLocalData(prev => ({
      ...prev,
      startLocation: {
        lat: suggestion.lat.toString(),
        lng: suggestion.lng.toString()
      }
    }));
    setSelectedStartLocation(suggestion.label);
    setStartLocationQuery('');
    setStartLocationSuggestions([]);
    // Clear error
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.startLocation;
      return newErrors;
    });
  };

  // Handle end location selection
  const handleEndLocationSelect = (suggestion) => {
    setLocalData(prev => ({
      ...prev,
      endLocation: {
        lat: suggestion.lat.toString(),
        lng: suggestion.lng.toString()
      }
    }));
    setSelectedEndLocation(suggestion.label);
    setEndLocationQuery('');
    setEndLocationSuggestions([]);
  };

  // Use current location for start
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoadingCurrentLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocalData(prev => ({
          ...prev,
          startLocation: {
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6)
          }
        }));
        setSelectedStartLocation('Current Location');
        setLoadingCurrentLocation(false);
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.startLocation;
          return newErrors;
        });
      },
      (error) => {
        setLoadingCurrentLocation(false);
        let errorMsg = 'Unable to retrieve your location';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out.';
            break;
        }
        alert(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-yellow-300 mb-6">Basic Information</h2>
        
        {/* Mandatory Fields */}
        <div className="space-y-4">
          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-yellow-300 mb-2">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="23"
              placeholder="18 (6 PM in 24-hour format)"
              value={localData.startTime}
              onChange={(e) => setLocalData(prev => ({ ...prev, startTime: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-purple-300 font-semibold ${
                errors.startTime ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-yellow-300 mb-2">
              Total Budget (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="5000"
              value={localData.budget}
              onChange={(e) => setLocalData(prev => ({ ...prev, budget: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-purple-300 font-semibold ${
                errors.budget ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
          </div>

          {/* Number of People */}
          <div>
            <label className="block text-sm font-medium text-yellow-300 mb-2">
              Number of People <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="2"
              value={localData.numberOfPeople}
              onChange={(e) => setLocalData(prev => ({ ...prev, numberOfPeople: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-purple-300 font-semibold ${
                errors.numberOfPeople ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.numberOfPeople && <p className="text-red-500 text-sm mt-1">{errors.numberOfPeople}</p>}
          </div>

          {/* Start Location */}
          <div>
            <label className="block text-sm font-medium text-yellow-300 mb-2">
              Start Location <span className="text-red-500">*</span>
            </label>
            
            {/* Selected location display */}
            {selectedStartLocation && (
              <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">{selectedStartLocation}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStartLocation('');
                    setLocalData(prev => ({
                      ...prev,
                      startLocation: { lat: '', lng: '' }
                    }));
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Change
                </button>
              </div>
            )}

            {/* Search input */}
            {!selectedStartLocation && (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for a location (e.g., Juhu Beach, Mumbai)"
                    value={startLocationQuery}
                    onChange={(e) => setStartLocationQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 ${
                      errors.startLocation ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {startLocationLoading && (
                    <Loader2 className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 animate-spin" />
                  )}
                </div>

                {/* Autocomplete dropdown */}
                {startLocationSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {startLocationSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleStartLocationSelect(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-2 border-b last:border-b-0"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{suggestion.name}</div>
                          <div className="text-xs text-gray-500">{suggestion.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Use Current Location button */}
            {!selectedStartLocation && (
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={loadingCurrentLocation}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingCurrentLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Getting location...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span className="text-sm font-medium">Use Current Location</span>
                  </>
                )}
              </button>
            )}

            {errors.startLocation && <p className="text-red-500 text-sm mt-1">{errors.startLocation}</p>}
          </div>
        </div>

        {/* Configure More Dropdown */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="font-medium text-gray-700">Configure More Options</span>
            {showOptional ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showOptional && (
            <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  placeholder="22 (10 PM in 24-hour format)"
                  value={localData.endTime}
                  onChange={(e) => setLocalData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>

              {/* End Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Location (Optional)
                </label>
                
                {/* Selected location display */}
                {selectedEndLocation && (
                  <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">{selectedEndLocation}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEndLocation('');
                        setLocalData(prev => ({
                          ...prev,
                          endLocation: { lat: '', lng: '' }
                        }));
                      }}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Search input */}
                {!selectedEndLocation && (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search for end location (optional)"
                        value={endLocationQuery}
                        onChange={(e) => setEndLocationQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      />
                      {endLocationLoading && (
                        <Loader2 className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 animate-spin" />
                      )}
                    </div>

                    {/* Autocomplete dropdown */}
                    {endLocationSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {endLocationSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleEndLocationSelect(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-2 border-b last:border-b-0"
                          >
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{suggestion.name}</div>
                              <div className="text-xs text-gray-500">{suggestion.label}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Extra Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Preferences (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="E.g., romantic evening, good ambience, live music..."
                  value={localData.extraInfo}
                  onChange={(e) => setLocalData(prev => ({ ...prev, extraInfo: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900"
                />
              </div>

              {/* Travel Tolerance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel Tolerance (Optional)
                </label>
                <div className="flex gap-3">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleTravelToleranceToggle(level)}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors capitalize ${
                        (localData.travelTolerance || []).includes(level)
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Next Button */}
      <button
        type="submit"
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
      >
        Next: Choose Go-Out Types
      </button>
    </form>
  );
}
