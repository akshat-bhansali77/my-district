
'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, MapPin, LocateFixed, Search, Loader2, Clock, DollarSign, Users, Sparkles, ArrowRight, Car, Calendar } from 'lucide-react';

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
  const [loadingEndCurrentLocation, setLoadingEndCurrentLocation] = useState(false);

  // Restore location labels when coming back from step 2
  useEffect(() => {
    if (formData.startLocationLabel) {
      setSelectedStartLocation(formData.startLocationLabel);
    } else if (formData.startLocation?.lat && formData.startLocation?.lng) {
      // If we have coordinates but no label, set a generic label
      setSelectedStartLocation('Selected Location');
    }
    
    if (formData.endLocationLabel) {
      setSelectedEndLocation(formData.endLocationLabel);
    } else if (formData.endLocation?.lat && formData.endLocation?.lng) {
      // If we have coordinates but no label, set a generic label
      setSelectedEndLocation('Selected Location');
    }
  }, [formData.startLocationLabel, formData.endLocationLabel, formData.startLocation, formData.endLocation]);

  const validate = () => {
    const newErrors = {};
    
    if (!localData.date) newErrors.date = 'Date is required';
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
      },
      startLocationLabel: suggestion.label
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
      },
      endLocationLabel: suggestion.label
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
          },
          startLocationLabel: 'Current Location'
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

  // Use current location for end
  const handleUseEndCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoadingEndCurrentLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocalData(prev => ({
          ...prev,
          endLocation: {
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6)
          },
          endLocationLabel: 'Current Location'
        }));
        setSelectedEndLocation('Current Location');
        setLoadingEndCurrentLocation(false);
      },
      (error) => {
        setLoadingEndCurrentLocation(false);
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
        {/* Enhanced Header with Icon */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-lg shadow-purple-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Basic Information
            </h2>
            <p className="text-sm text-gray-400 mt-1">Let's plan your perfect day out!</p>
          </div>
        </div>
        
        {/* Mandatory Fields - Enhanced Grid Layout */}
        <div className="space-y-5">
          {/* Date - With Icon */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-3">
              <Calendar className="w-4 h-4 text-purple-400" />
              Date <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={localData.date || ''}
                onChange={(e) => setLocalData(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full pl-4 pr-4 py-4 bg-gray-800/50 border-2 rounded-xl
                  focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                  text-white font-semibold text-lg placeholder-gray-500
                  transition-all duration-200 hover:bg-gray-800/70
                  [&::-webkit-calendar-picker-indicator]:cursor-pointer
                  [&::-webkit-calendar-picker-indicator]:filter
                  [&::-webkit-calendar-picker-indicator]:invert
                  [&::-webkit-calendar-picker-indicator]:sepia
                  [&::-webkit-calendar-picker-indicator]:saturate-[3]
                  [&::-webkit-calendar-picker-indicator]:hue-rotate-[230deg]
                  [&::-webkit-calendar-picker-indicator]:brightness-[0.9]
                  ${errors.date ? 'border-red-500 bg-red-900/10' : 'border-gray-700 focus:bg-gray-800'}`}
              />
            </div>
            {errors.date && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <span>⚠️</span> {errors.date}
              </p>
            )}
          </div>

          {/* Start Time - With Icon */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-3">
              <Clock className="w-4 h-4 text-purple-400" />
              Start Time <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="time"
                value={localData.startTimeDisplay || ''}
                onChange={(e) => {
                  const timeValue = e.target.value; // HH:MM format
                  if (timeValue) {
                    const [hours, minutes] = timeValue.split(':');
                    const decimalTime = parseInt(hours) + parseInt(minutes) / 60;
                    setLocalData(prev => ({
                      ...prev,
                      startTime: decimalTime,
                      startTimeDisplay: timeValue
                    }));
                  } else {
                    setLocalData(prev => ({
                      ...prev,
                      startTime: '',
                      startTimeDisplay: ''
                    }));
                  }
                }}
                className={`w-full pl-4 pr-4 py-4 bg-gray-800/50 border-2 rounded-xl
                  focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                  text-white font-semibold text-lg placeholder-gray-500
                  transition-all duration-200 hover:bg-gray-800/70
                  [&::-webkit-calendar-picker-indicator]:cursor-pointer
                  [&::-webkit-calendar-picker-indicator]:filter
                  [&::-webkit-calendar-picker-indicator]:invert
                  [&::-webkit-calendar-picker-indicator]:sepia
                  [&::-webkit-calendar-picker-indicator]:saturate-[3]
                  [&::-webkit-calendar-picker-indicator]:hue-rotate-[230deg]
                  [&::-webkit-calendar-picker-indicator]:brightness-[0.9]
                  ${errors.startTime ? 'border-red-500 bg-red-900/10' : 'border-gray-700 focus:bg-gray-800'}`}
              />
            </div>
            {errors.startTime && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <span>⚠️</span> {errors.startTime}
              </p>
            )}
          </div>

          {/* Budget - With Icon */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-3">
              <DollarSign className="w-4 h-4 text-purple-400" />
              Total Budget (₹) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                placeholder="5000"
                value={localData.budget}
                onChange={(e) => setLocalData(prev => ({ ...prev, budget: e.target.value }))}
                className={`w-full pl-4 pr-4 py-4 bg-gray-800/50 border-2 rounded-xl
                  focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                  text-white font-semibold text-lg placeholder-gray-500
                  transition-all duration-200 hover:bg-gray-800/70
                  ${errors.budget ? 'border-red-500 bg-red-900/10' : 'border-gray-700 focus:bg-gray-800'}`}
              />
            </div>
            {errors.budget && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <span>⚠️</span> {errors.budget}
              </p>
            )}
          </div>

          {/* Number of People - With Icon */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-3">
              <Users className="w-4 h-4 text-purple-400" />
              Number of People <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="2"
                value={localData.numberOfPeople}
                onChange={(e) => setLocalData(prev => ({ ...prev, numberOfPeople: e.target.value }))}
                className={`w-full pl-4 pr-4 py-4 bg-gray-800/50 border-2 rounded-xl
                  focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                  text-white font-semibold text-lg placeholder-gray-500
                  transition-all duration-200 hover:bg-gray-800/70
                  ${errors.numberOfPeople ? 'border-red-500 bg-red-900/10' : 'border-gray-700 focus:bg-gray-800'}`}
              />
            </div>
            {errors.numberOfPeople && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <span>⚠️</span> {errors.numberOfPeople}
              </p>
            )}
          </div>

          {/* Start Location - With Icon */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-3">
              <MapPin className="w-4 h-4 text-purple-400" />
              Start Location <span className="text-red-400">*</span>
            </label>
            
            {/* Selected location display - Enhanced */}
            {selectedStartLocation && (
              <div className="mb-3 p-4 bg-gradient-to-r from-purple-900/30 to-purple-800/30 border-2 border-purple-600/50 rounded-xl flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <MapPin className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-purple-200">{selectedStartLocation}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStartLocation('');
                    setLocalData(prev => ({
                      ...prev,
                      startLocation: { lat: '', lng: '' },
                      startLocationLabel: ''
                    }));
                  }}
                  className="px-3 py-1 text-xs font-medium text-red-300 hover:text-red-200 bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-colors"
                >
                  Change
                </button>
              </div>
            )}

            {/* Search input - Enhanced */}
            {!selectedStartLocation && (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for a location (e.g., Juhu Beach, Mumbai)"
                    value={startLocationQuery}
                    onChange={(e) => setStartLocationQuery(e.target.value)}
                    className={`w-full pl-12 pr-14 py-4 bg-gray-800/50 border-2 rounded-xl
                      focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                      text-white placeholder-gray-500
                      transition-all duration-200 hover:bg-gray-800/70
                      ${errors.startLocation ? 'border-red-500 bg-red-900/10' : 'border-gray-700 focus:bg-gray-800'}`}
                  />
                  {/* Current Location Icon or Loading Spinner */}
                  {loadingCurrentLocation ? (
                    <Loader2 className="absolute right-4 top-4 w-5 h-5 text-purple-400 animate-spin" />
                  ) : (
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="absolute right-4 top-4 text-purple-400 hover:text-purple-300 transition-all hover:scale-110"
                      title="Use current location"
                    >
                      <LocateFixed className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Autocomplete dropdown - Enhanced */}
                {startLocationSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-gray-800 border-2 border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto backdrop-blur-lg">
                    {startLocationSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleStartLocationSelect(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-purple-900/30 flex items-start gap-3 border-b border-gray-700 last:border-b-0 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-white">{suggestion.name}</div>
                          <div className="text-xs text-gray-400">{suggestion.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {errors.startLocation && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <span>⚠️</span> {errors.startLocation}
              </p>
            )}
          </div>
        </div>

        {/* Configure More Dropdown */}
        <div className="mt-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/30 hover:bg-gray-800/50 text-purple-200 hover:text-purple-100 rounded-lg transition-all border border-gray-700"
            >
              <span className="text-sm font-medium">Configure More Options</span>
              {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showOptional && (
            <div className="mt-4 space-y-5 p-6 bg-gray-800/40 backdrop-blur-sm rounded-xl border-2 border-gray-700/50">
              {/* End Time */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-3">
                  <Clock className="w-4 h-4 text-purple-400" />
                  End Time (Optional)
                </label>
                <input
                  type="time"
                  value={localData.endTimeDisplay || ''}
                  onChange={(e) => {
                    const timeValue = e.target.value; // HH:MM format
                    if (timeValue) {
                      const [hours, minutes] = timeValue.split(':');
                      const decimalTime = parseInt(hours) + parseInt(minutes) / 60;
                      setLocalData(prev => ({
                        ...prev,
                        endTime: decimalTime,
                        endTimeDisplay: timeValue
                      }));
                    } else {
                      setLocalData(prev => ({
                        ...prev,
                        endTime: '',
                        endTimeDisplay: ''
                      }));
                    }
                  }}
                  className="w-full pl-4 pr-4 py-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white font-semibold text-lg placeholder-gray-500 transition-all duration-200 hover:bg-gray-800/70 focus:bg-gray-800
                  [&::-webkit-calendar-picker-indicator]:cursor-pointer
                  [&::-webkit-calendar-picker-indicator]:filter
                  [&::-webkit-calendar-picker-indicator]:invert
                  [&::-webkit-calendar-picker-indicator]:sepia
                  [&::-webkit-calendar-picker-indicator]:saturate-[3]
                  [&::-webkit-calendar-picker-indicator]:hue-rotate-[230deg]
                  [&::-webkit-calendar-picker-indicator]:brightness-[0.9]"
                />
              </div>

              {/* End Location */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-3">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  End Location (Optional)
                </label>
                
                {/* Selected location display - Enhanced */}
                {selectedEndLocation && (
                  <div className="mb-3 p-4 bg-gradient-to-r from-purple-900/30 to-purple-800/30 border-2 border-purple-600/50 rounded-xl flex items-center justify-between backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        <MapPin className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-sm font-medium text-purple-200">{selectedEndLocation}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEndLocation('');
                        setLocalData(prev => ({
                          ...prev,
                          endLocation: { lat: '', lng: '' },
                          endLocationLabel: ''
                        }));
                      }}
                      className="px-3 py-1 text-xs font-medium text-red-300 hover:text-red-200 bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-colors"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Search input - Enhanced */}
                {!selectedEndLocation && (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search for end location (optional)"
                        value={endLocationQuery}
                        onChange={(e) => setEndLocationQuery(e.target.value)}
                        className="w-full pl-12 pr-14 py-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-500 transition-all duration-200 hover:bg-gray-800/70 focus:bg-gray-800"
                      />
                      {/* Current Location Icon or Loading Spinner */}
                      {loadingEndCurrentLocation ? (
                        <Loader2 className="absolute right-4 top-4 w-5 h-5 text-purple-400 animate-spin" />
                      ) : (
                        <button
                          type="button"
                          onClick={handleUseEndCurrentLocation}
                          className="absolute right-4 top-4 text-purple-400 hover:text-purple-300 transition-all hover:scale-110"
                          title="Use current location"
                        >
                          <LocateFixed className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Autocomplete dropdown - Enhanced */}
                    {endLocationSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-gray-800 border-2 border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto backdrop-blur-lg">
                        {endLocationSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleEndLocationSelect(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-purple-900/30 flex items-start gap-3 border-b border-gray-700 last:border-b-0 transition-colors"
                          >
                            <MapPin className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-white">{suggestion.name}</div>
                              <div className="text-xs text-gray-400">{suggestion.label}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mode of Transport */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-3">
                  <Car className="w-4 h-4 text-purple-400" />
                  Mode of Transport (Optional)
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'driving-car', label: '🚗 Car' },
                    { value: 'cycling-electric', label: '🚴 Bike' },
                    { value: 'foot-walking', label: '🚶 Walking' }
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setLocalData(prev => ({ ...prev, transportMode: mode.value }))}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 font-semibold ${
                        localData.transportMode === mode.value
                          ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/30 scale-105'
                          : 'bg-gray-800/50 text-gray-300 border-gray-700 hover:border-purple-500 hover:bg-gray-800/70'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Select your preferred mode of transport for route calculations</p>
              </div>

              {/* Extra Info */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Additional Preferences (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="E.g., romantic evening, good ambience, live music..."
                  value={localData.extraInfo}
                  onChange={(e) => setLocalData(prev => ({ ...prev, extraInfo: e.target.value }))}
                  className="w-full px-4 py-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-500 resize-none transition-all duration-200 hover:bg-gray-800/70 focus:bg-gray-800"
                />
              </div>

              {/* Travel Tolerance */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-3">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  Travel Tolerance (Optional)
                </label>
                <div className="flex gap-3">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleTravelToleranceToggle(level)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 capitalize font-semibold ${
                        (localData.travelTolerance || []).includes(level)
                          ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/30 scale-105'
                          : 'bg-gray-800/50 text-gray-300 border-gray-700 hover:border-purple-500 hover:bg-gray-800/70'
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

      {/* Enhanced Next Button */}
      <button
        type="submit"
        className="group relative w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-5 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-[1.02] overflow-hidden"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
        <span className="relative flex items-center justify-center gap-3 text-lg">
          <span>Next: Choose Go-Out Types</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </button>
    </form>
  );
}
