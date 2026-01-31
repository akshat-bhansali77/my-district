
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EditableItinerary from '@/app/components/results/EditableItinerary';

export default function ResultsPage() {
  const router = useRouter();
  const [itineraries, setItineraries] = useState([]);
  const [totalCombinations, setTotalCombinations] = useState(0);
  const [originalRequestData, setOriginalRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Get day of the week from the selected date
  const getDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (originalRequestData?.date) {
      return days[new Date(originalRequestData.date).getDay()];
    }
    return days[new Date().getDay()];
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % itineraries.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + itineraries.length) % itineraries.length);
  };

  useEffect(() => {
    // Read from sessionStorage
    const storedData = sessionStorage.getItem('itineraryResults');
    const storedRequest = sessionStorage.getItem('originalRequest');
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setItineraries(parsed.itineraries || []);
        setTotalCombinations(parsed.totalCombinations || 0);
      } catch (error) {
        console.error('Error parsing itinerary data:', error);
      }
    }
    
    if (storedRequest) {
      try {
        setOriginalRequestData(JSON.parse(storedRequest));
      } catch (error) {
        console.error('Error parsing request data:', error);
      }
    }
    
    setLoading(false);
  }, []);

  const handleRegenerate = async (payload, itineraryIndex) => {
    try {
      const response = await fetch('/api/plan-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Replace ALL itineraries with new top 4
        if (result.itineraries && result.itineraries.length > 0) {
          setItineraries(result.itineraries);
          setTotalCombinations(result.totalCombinations);
          
          // Update sessionStorage
          sessionStorage.setItem('itineraryResults', JSON.stringify({
            itineraries: result.itineraries,
            totalCombinations: result.totalCombinations
          }));
          
        }
        return result;
      } else {
        // Check for no new permutations
        if (result.noNewPermutations) {
          return result;
        }
        // Show detailed error message
        const errorMsg = result.details || result.error || 'Failed to regenerate itinerary';
        alert(`❌ ${errorMsg}`);
        return result;
      }
    } catch (error) {
      console.error('Error regenerating:', error);
      alert(`Network error: ${error.message}`);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-700 relative overflow-hidden flex items-center justify-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-purple-300 font-medium">Loading your itineraries...</p>
        </div>
      </div>
    );
  }

  if (itineraries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-700 relative overflow-hidden flex items-center justify-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="text-center relative z-10">
          <p className="text-xl text-purple-300 font-semibold">No itineraries found</p>
          <a href="/plan" className="mt-4 inline-block text-purple-400 hover:text-purple-300 font-medium">
            ← Back to Planning
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-700 py-12 px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating Shapes */}
        <div className="absolute top-32 right-1/4 w-4 h-4 bg-purple-400/40 rounded-full animate-float"></div>
        <div className="absolute top-48 left-1/4 w-3 h-3 bg-blue-400/40 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-40 right-1/3 w-5 h-5 bg-indigo-400/40 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 left-1/2 w-2 h-2 bg-purple-300/40 rounded-full animate-float" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Geometric Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="url(#line-gradient)" strokeWidth="1" className="animate-pulse" />
          <line x1="20%" y1="0" x2="20%" y2="100%" stroke="url(#line-gradient)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
          <line x1="80%" y1="0" x2="80%" y2="100%" stroke="url(#line-gradient)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '1s' }} />
          <circle cx="10%" cy="30%" r="50" stroke="url(#line-gradient)" strokeWidth="1" fill="none" className="animate-spin-slow" />
          <circle cx="90%" cy="70%" r="70" stroke="url(#line-gradient)" strokeWidth="1" fill="none" className="animate-spin-slow" style={{ animationDelay: '1s' }} />
        </svg>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-3">
              <span className="bg-gradient-to-r from-purple-300 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Your {getDayOfWeek()}
              </span>
              <br />
              <span className="text-white text-4xl md:text-5xl">in the District</span>
            </h1>
            <p className="text-purple-200 text-lg mb-4 max-w-2xl mx-auto">
              Here are your personalized itineraries crafted just for you
            </p>
            <a
              href="/plan"
              className="inline-flex items-center gap-2 mt-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-[1.02]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Plan Another Itinerary
            </a>
        </div>

        {/* Itinerary Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrev}
              disabled={itineraries.length <= 1}
              className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Previous</span>
            </button>
            
            {/* Current Page Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg">
              <span className="text-purple-300 font-semibold">{currentIndex + 1}</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-300 font-semibold">{itineraries.length}</span>
            </div>
            
            <button
              onClick={handleNext}
              disabled={itineraries.length <= 1}
              className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
            >
              <span>Next</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Current Itinerary with Animation */}
          <div className="overflow-hidden">
            <div
              className="transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)`, display: 'flex' }}
            >
              {itineraries.map((item, index) => (
                <div key={index} className="w-full flex-shrink-0">
                  <EditableItinerary
                    itinerary={item}
                    index={index}
                    totalItineraries={itineraries.length}
                    originalData={originalRequestData}
                    onRegenerate={handleRegenerate}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
