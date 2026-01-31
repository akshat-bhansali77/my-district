

'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, IndianRupee, Star, Navigation, Plus, Trash2, RefreshCw, Edit2, X, ArrowRight, Car, Home, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GoOutFilters from '../plan/GoOutFilters';
import RouteMap from '../RouteMap';

const GO_OUT_TYPES = [
  { id: 'dinings', name: 'Dining', icon: '🍽️' },
  { id: 'movies', name: 'Movie', icon: '🎬' },
  { id: 'events', name: 'Event', icon: '🎉' },
  { id: 'activities', name: 'Activity', icon: '🎯' },
  { id: 'plays', name: 'Play', icon: '⚽' }
];

export default function EditableItinerary({
  itinerary,
  index,
  totalItineraries,
  originalData,
  onRegenerate
}) {
  const router = useRouter();
  const [editingIndex, setEditingIndex] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [filters, setFilters] = useState({ filters: {} });
  const [modifiedItinerary, setModifiedItinerary] = useState(itinerary.itinerary || []);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Sync local state with prop changes after regeneration
  useEffect(() => {
    if (itinerary.itinerary) {
      setModifiedItinerary(itinerary.itinerary);
      // Reset editing state when new data arrives
      setEditingIndex(null);
      setIsAdding(false);
      setSelectedType(null);
      setFilters({ filters: {} });
    }
  }, [itinerary]);

  const getTypeIcon = (type) => {
    const typeObj = GO_OUT_TYPES.find(t => t.id === type);
    return typeObj?.icon || '📍';
  };

  const handleRemove = (actIndex) => {
    const newItinerary = modifiedItinerary.filter((_, i) => i !== actIndex);
    setModifiedItinerary(newItinerary);
  };

  const handleReplace = (actIndex) => {
    setEditingIndex(actIndex);
    setIsAdding(false);
    setSelectedType(null);
    setFilters({ filters: {} });
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingIndex(null);
    setSelectedType(null);
    setFilters({ filters: {} });
  };

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
  };

  const handleFilterUpdate = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSaveEdit = () => {
    if (!selectedType) {
      alert('Please select a go-out type');
      return;
    }

    const newItem = { [selectedType]: filters };

    if (editingIndex !== null) {
      // Replace existing item
      const newItinerary = [...modifiedItinerary];
      newItinerary[editingIndex] = newItem;
      setModifiedItinerary(newItinerary);
      setEditingIndex(null);
    } else if (isAdding) {
      // Add new item at the end
      setModifiedItinerary([...modifiedItinerary, newItem]);
      setIsAdding(false);
    }

    setSelectedType(null);
    setFilters({ filters: {} });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setIsAdding(false);
    setSelectedType(null);
    setFilters({ filters: {} });
  };

  const handleRegenerate = async () => {
    if (modifiedItinerary.length === 0) {
      alert('Cannot regenerate with empty itinerary');
      return;
    }

    // Validate that all items have either filters or _id
    const hasInvalidItems = modifiedItinerary.some(item => {
      const typeName = Object.keys(item)[0];
      const value = item[typeName];
      
      // Check if it's completely empty or has neither filters nor _id
      return !value || (Object.keys(value).length === 0) ||
             (value.filters === undefined && value._id === undefined);
    });

    if (hasInvalidItems) {
      alert('Please complete all activity selections before regenerating');
      return;
    }

    // Check if all items are specific venues (all have _id)
    const allSpecific = modifiedItinerary.every(item => {
      const typeName = Object.keys(item)[0];
      const value = item[typeName];
      return value._id !== undefined;
    });

    if (allSpecific) {
      alert('Cannot regenerate: All activities are specific venues. Please add at least one activity with filters to allow variation.');
      return;
    }

    setIsRegenerating(true);

    const payload = {
      ...originalData,
      preferredTypes: modifiedItinerary
    };

    const result = await onRegenerate(payload, index);
    
    // Check if no new permutations are available
    if (result && result.noNewPermutations) {
      alert('No new permutations available');
    }
    
    setIsRegenerating(false);
  };

  const handleCheckout = async () => {
    if (modifiedItinerary.length === 0) {
      alert('Cannot checkout with empty itinerary');
      return;
    }

    // Check if all activities are specific venues (have been fully generated)
    const hasIncompleteActivities = modifiedItinerary.some(item => {
      const typeName = Object.keys(item)[0];
      const value = item[typeName];
      return !value.name; // If no name, it's just filters, not a specific venue
    });

    if (hasIncompleteActivities) {
      alert('Please regenerate to get specific venues before checking out');
      return;
    }

    setIsCheckingOut(true);

    try {
      const orderPayload = {
        numberOfPeople: originalData.numberOfPeople,
        startTime: originalData.startTime,
        startLocation: originalData.startLocation,
        endTime: originalData.endTime,
        endLocation: originalData.endLocation,
        itinerary: modifiedItinerary,
        totalBudget: totalBudget,
        totalDistance: totalDistance,
        totalDuration: totalHours,
        extraInfo: originalData.extraInfo,
        travelTolerance: originalData.travelTolerance,
        score: itinerary.score
      };

      const response = await fetch('/api/order-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Order placed successfully!');
        router.push('/order-history');
      } else {
        alert(`❌ Failed to place order: ${result.error}`);
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('❌ Network error during checkout');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Calculate totals
  const totalBudget = modifiedItinerary.reduce((sum, activity) => {
    const typeName = Object.keys(activity)[0];
    const venue = activity[typeName];
    return sum + (venue.pricePerPerson || 0);
  }, 0);

  const totalDistance = modifiedItinerary.reduce((sum, activity) => {
    const typeName = Object.keys(activity)[0];
    const venue = activity[typeName];
    return sum + (venue.distanceKm || 0);
  }, 0);

  const totalHours = modifiedItinerary.reduce((sum, activity) => {
    const typeName = Object.keys(activity)[0];
    const venue = activity[typeName];
    const durationHours = (venue.duration || 0) / 60;
    const travelHours = (venue.travelTimeMinutes || 0) / 60;
    return sum + durationHours + travelHours;
  }, 0);

  const formatTime = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h} hours ${m} mins` : `${h} hours`;
  };

  // Calculate timeline with times
  // Each activity's travelTimeMinutes is the travel time from previous location to this activity
  const calculateTime = (index) => {
    let currentTime = originalData?.startTime || 18; // Start time
    
    // Add up all the time spent before reaching this activity
    for (let i = 0; i < index; i++) {
      const activity = modifiedItinerary[i];
      const typeName = Object.keys(activity)[0];
      const venue = activity[typeName];
      
      // Add travel time to reach activity i
      if (venue.travelTimeMinutes) {
        currentTime += venue.travelTimeMinutes / 60;
      }
      
      // Add duration spent at activity i
      if (venue.duration) {
        currentTime += venue.duration / 60;
      }
    }
    
    // Finally add travel time to reach the current activity
    if (modifiedItinerary[index]) {
      const currentActivity = modifiedItinerary[index];
      const currentTypeName = Object.keys(currentActivity)[0];
      const currentVenue = currentActivity[currentTypeName];
      if (currentVenue.travelTimeMinutes) {
        currentTime += currentVenue.travelTimeMinutes / 60;
      }
    }
    
    const hours = Math.floor(currentTime);
    const minutes = Math.round((currentTime - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-6">
      {/* Two Column Layout: Itinerary List (Left) + Map (Right) */}
      <div className="flex gap-6">
        {/* Left Column: Itinerary Timeline */}
        <div className="flex-1 space-y-3 relative">
        {/* Continuous vertical purple line from home to last activity - Centered */}
        {modifiedItinerary.length > 0 && (
          <div
            className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-purple-500 z-0"
            style={{
              top: '48px', // Start from bottom of home icon
              bottom: '120px' // Stop before the add/regenerate buttons section
            }}
          ></div>
        )}

        {/* Starting Point - Home - Centered */}
        <div className="flex flex-col items-center relative mb-6 z-10">
          <div className="w-12 h-12 rounded-full bg-purple-600 border-4 border-gray-900 flex items-center justify-center mb-2">
            <Home className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-bold text-purple-400">
            {(() => {
              const startTime = originalData?.startTime || 18;
              const hours = Math.floor(startTime);
              const minutes = Math.round((startTime - hours) * 60);
              return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            })()}
          </span>
        </div>
        
        {modifiedItinerary.map((activity, actIndex) => {
          const typeName = Object.keys(activity)[0];
          const venue = activity[typeName];
          const isEditing = editingIndex === actIndex;

          if (isEditing) {
            return (
              <div key={actIndex} className="p-6 bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-sm border-2 border-purple-500/50 rounded-xl shadow-xl relative z-10 mx-auto max-w-4xl">
                {/* Header with title and close button */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-purple-200 flex items-center gap-2">
                    <Edit2 className="w-5 h-5" />
                    {!selectedType ? 'Select Activity Type' : 'Configure Filters'}
                  </h3>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!selectedType ? (
                  <div>
                    <p className="text-purple-300 text-sm mb-4 text-center">Choose what type of activity you'd like instead</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {GO_OUT_TYPES.map((type, idx) => (
                        <button
                          key={type.id}
                          onClick={() => handleTypeSelect(type.id)}
                          className={`group p-4 border-2 border-purple-500/30 hover:border-purple-400 hover:bg-purple-800/50 bg-gray-800/50 rounded-xl transition-all text-center transform hover:scale-105 ${
                            idx < 3 ? 'w-[calc(33.333%-0.5rem)]' : 'w-[calc(33.333%-0.5rem)] md:w-auto'
                          }`}
                          style={idx >= 3 ? { minWidth: 'calc(33.333% - 0.5rem)' } : {}}
                        >
                          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{type.icon}</div>
                          <div className="font-semibold text-purple-200 text-sm">{type.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-4 p-3 bg-purple-900/30 rounded-lg border border-purple-500/30">
                      <span className="text-3xl">{getTypeIcon(selectedType)}</span>
                      <div>
                        <span className="font-bold text-purple-200 text-lg">
                          {GO_OUT_TYPES.find(t => t.id === selectedType)?.name}
                        </span>
                        <p className="text-purple-300 text-xs mt-1">Configure your preferences below</p>
                      </div>
                    </div>
                    <GoOutFilters
                      type={selectedType}
                      filters={filters}
                      onUpdate={handleFilterUpdate}
                    />
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-[1.02]"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 font-semibold rounded-xl transition-all border border-gray-600 hover:border-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Check if any previous activity has only filters (no specific venue)
          const hasIncompleteActivityBefore = modifiedItinerary.slice(0, actIndex).some(item => {
            const itemTypeName = Object.keys(item)[0];
            const itemVenue = item[itemTypeName];
            return !itemVenue.name; // No name means it's just filters
          });

          // Check if current activity has only filters
          const isIncompleteActivity = !venue.name;

          return (
            <React.Fragment key={actIndex}>
            {/* Travel Info BEFORE this activity - Centered */}
            {/* Only show if this activity has a venue AND no incomplete activities before it */}
            {venue.distanceKm !== undefined && venue.name && !hasIncompleteActivityBefore && (
              <div className="flex justify-center py-3 relative z-10">
                <div className="bg-gray-900 border border-purple-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <Car className="w-4 h-4 text-purple-400" />
                  {venue.distanceKm !== undefined && (
                    <span className="text-gray-300 text-xs">{venue.distanceKm} km</span>
                  )}
                  {venue.travelTimeMinutes !== undefined && (
                    <span className="text-gray-300 text-xs">{venue.travelTimeMinutes} min</span>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex flex-col items-center relative z-10">
              {/* Activity Card */}
              <div
                className="w-full max-w-4xl flex gap-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-purple-500 transition-colors relative overflow-hidden p-4"
              >
              {/* Left Column: Banner Image */}
              {venue.banner_url && (
                <div className="flex-shrink-0">
                  <div className="w-48 h-[250px] rounded-lg overflow-hidden">
                    <img
                      src={venue.banner_url}
                      alt={venue.name || 'Venue banner'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Right Section: All Venue Info */}
              <div className="flex-1 flex flex-col gap-2">
                {/* Top Row: Time Badge/Activity Type (Left) + Action Buttons (Right) */}
                <div className="flex items-center">
                  {/* Time Badge (if specific venue) OR Activity Type Name (if just filters) */}
                  <div className="flex-1">
                    {venue.name && !hasIncompleteActivityBefore ? (
                      <div className="flex items-center gap-2 px-4 py-2 border-2 border-purple-500 rounded-lg inline-flex">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-bold text-purple-400">
                          {calculateTime(actIndex)}
                        </span>
                      </div>
                    ) : !venue.name ? (
                      <h3 className="text-lg font-semibold text-white">
                        {GO_OUT_TYPES.find(t => t.id === typeName)?.name || typeName}
                      </h3>
                    ) : null}
                  </div>
                  
                  {/* Action Buttons - Always on right */}
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => handleReplace(actIndex)}
                      className="w-9 h-9 flex items-center justify-center bg-gray-700 text-purple-400 rounded-full hover:bg-purple-600 hover:text-white transition-colors flex-shrink-0"
                      title="Replace"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(actIndex)}
                      className="w-9 h-9 flex items-center justify-center bg-gray-700 text-gray-300 rounded-full hover:bg-red-600 hover:text-white transition-colors flex-shrink-0"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Venue Name - Only show if we have a specific venue */}
                {venue.name && (
                  <h3 className="text-lg font-semibold text-white">
                    {venue.name}
                  </h3>
                )}

                {/* Description */}
                {venue.description && (
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {venue.description}
                  </p>
                )}

                {/* Price, Duration, and Rating Row - Above Divider */}
                <div className="flex items-center gap-4 text-sm mt-[50px]">
                  {venue.pricePerPerson && (
                    <div className="flex items-center gap-1 text-gray-300">
                      <IndianRupee className="w-4 h-4" />
                      <span className="font-semibold">{venue.pricePerPerson}/person</span>
                    </div>
                  )}
                  
                  {venue.duration && (
                    <div className="flex items-center gap-1 text-gray-300">
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold">{venue.duration} mins</span>
                    </div>
                  )}

                  {/* Rating */}
                  {venue.rating && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded-lg">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-white text-sm">{venue.rating}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Row: Amenities + View on District - Below Divider */}
                <div className="flex items-center justify-between gap-3 mt-auto pt-2 border-t border-gray-700">
                  {/* Amenities (True Values like WiFi, Parking, etc.) - Show 3 random */}
                  <div className="flex gap-2">
                    {(() => {
                      const amenities = [];
                      if (venue.wifi) amenities.push('WiFi');
                      if (venue.washroom) amenities.push('Washroom');
                      if (venue.wheelchair) amenities.push('Wheelchair');
                      if (venue.parking) amenities.push('Parking');
                      if (venue.cafe) amenities.push('Cafe');
                      
                      // Shuffle array and take first 3
                      const shuffled = amenities.sort(() => Math.random() - 0.5);
                      
                      return shuffled.slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full">
                          {amenity}
                        </span>
                      ));
                    })()}
                  </div>

                  {/* View on District Link */}
                  {venue.district_url && (
                    <button
                      onClick={() => window.open(venue.district_url, '_blank')}
                      className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium whitespace-nowrap"
                    >
                      View on District
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            </div>
          </React.Fragment>
          );
        })}
  
          {/* Add New Activity Card */}
          {isAdding && (
          <div className="p-6 bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-sm border-2 border-purple-500/50 rounded-xl shadow-xl relative z-10 mx-auto max-w-4xl">
            {/* Header with title and close button */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-purple-200 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {!selectedType ? 'Add New Activity' : 'Configure New Activity'}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedType ? (
              <div>
                <p className="text-purple-300 text-sm mb-4 text-center">Choose what type of activity you'd like to add</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {GO_OUT_TYPES.map((type, idx) => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelect(type.id)}
                      className={`group p-4 border-2 border-purple-500/30 hover:border-purple-400 hover:bg-purple-800/50 bg-gray-800/50 rounded-xl transition-all text-center transform hover:scale-105 ${
                        idx < 3 ? 'w-[calc(33.333%-0.5rem)]' : 'w-[calc(33.333%-0.5rem)] md:w-auto'
                      }`}
                      style={idx >= 3 ? { minWidth: 'calc(33.333% - 0.5rem)' } : {}}
                    >
                      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{type.icon}</div>
                      <div className="font-semibold text-purple-200 text-sm">{type.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4 p-3 bg-purple-900/30 rounded-lg border border-purple-500/30">
                  <span className="text-3xl">{getTypeIcon(selectedType)}</span>
                  <div>
                    <span className="font-bold text-purple-200 text-lg">
                      {GO_OUT_TYPES.find(t => t.id === selectedType)?.name}
                    </span>
                    <p className="text-purple-300 text-xs mt-1">Configure your preferences below</p>
                  </div>
                </div>
                <GoOutFilters
                  type={selectedType}
                  filters={filters}
                  onUpdate={handleFilterUpdate}
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-[1.02]"
                  >
                    Add Activity
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 font-semibold rounded-xl transition-all border border-gray-600 hover:border-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Right Column: Map (Sticky) */}
        {(() => {
          // Build locations array from start location + all venues that have coordinates
          const locations = [];
          
          // Add start location if available (handle different formats)
          if (originalData?.startLocation) {
            const startLoc = originalData.startLocation;
            let lng, lat;
            
            // Handle coordinates array format
            if (startLoc.coordinates && Array.isArray(startLoc.coordinates)) {
              lng = startLoc.coordinates[0];
              lat = startLoc.coordinates[1];
            }
            // Handle lat/lng object format
            else if (startLoc.lng !== undefined && startLoc.lat !== undefined) {
              lng = startLoc.lng;
              lat = startLoc.lat;
            }
            // Handle location.lat/lng format
            else if (startLoc.location?.lng !== undefined && startLoc.location?.lat !== undefined) {
              lng = startLoc.location.lng;
              lat = startLoc.location.lat;
            }
            
            if (lng !== undefined && lat !== undefined) {
              locations.push({
                lng: lng,
                lat: lat,
                name: "🏠 Start Location"
              });
            }
          }

          // Add all venue locations that have lat/lng
          modifiedItinerary.forEach((activity, idx) => {
            const typeName = Object.keys(activity)[0];
            const venue = activity[typeName];
            
            // Use venue.location.lat and venue.location.lng
            if (venue.name && venue.location?.lat && venue.location?.lng) {
              locations.push({
                lng: venue.location.lng,
                lat: venue.location.lat,
                name: `${getTypeIcon(typeName)} ${venue.name}`
              });
            }
          });

          // Only show map if we have at least 2 locations
          if (locations.length < 2) {
            return null;
          }

          const apiKey = process.env.NEXT_PUBLIC_OPENROUTE_API_KEY;

          return (
            <div className="w-[500px] flex-shrink-0">
              <RouteMap
                locations={locations}
                apiKey={apiKey}
                planNumber={index + 1}
                totalPlans={totalItineraries}
                score={itinerary.score}
                goOutsCount={modifiedItinerary.length}
                budget={totalBudget}
                totalDistance={totalDistance.toFixed(1)}
                totalTime={formatTime(totalHours)}
                activityCount={modifiedItinerary.length}
                numPeople={originalData?.numPeople || 1}
              />
            </div>
          );
        })()}
      </div>

      {/* Bottom Section: Action Buttons - Left (Add & Regenerate) and Right (Checkout) */}
      <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-800">
        {/* Left Side: Add Activity & Regenerate Itinerary */}
        <div className="flex gap-3">
          <button
            onClick={handleAdd}
            disabled={isAdding || editingIndex !== null}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-green-500/30 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <Plus className="w-5 h-5" />
            Add Activity
          </button>
          
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating || isAdding || editingIndex !== null}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {isRegenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Regenerate Itinerary
              </>
            )}
          </button>
        </div>

        {/* Right Side: Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={isCheckingOut || isAdding || editingIndex !== null || isRegenerating}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-orange-500/40 transform hover:scale-[1.02] border-2 border-orange-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {isCheckingOut ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              Checkout
            </>
          )}
        </button>
      </div>
    </div>
  );
}

