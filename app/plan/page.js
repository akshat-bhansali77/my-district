
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Steps, FloatButton, Drawer } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';
import BasicInfoStep from '@/app/components/plan/BasicInfoStep';
import GoOutTypesStep from '@/app/components/plan/GoOutTypesStep';
import Chatbot from '@/app/components/plan/Chatbot';

export default function PlanItinerary() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    // Mandatory fields
    date: '',
    startTime: '',
    budget: '',
    numberOfPeople: '',
    startLocation: { lat: '', lng: '' },
    
    // Optional fields
    endTime: '',
    endLocation: { lat: '', lng: '' },
    extraInfo: '',
    travelTolerance: [],
    transportMode: '',
    
    // Preferred types with filters
    preferredTypes: []
  });

  // Check if mandatory fields are filled
  const isStep1Valid = () => {
    return formData.date &&
           formData.startTime &&
           formData.budget &&
           formData.numberOfPeople &&
           formData.startLocation.lat &&
           formData.startLocation.lng;
  };

  const handleStepComplete = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    setStep(2);
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    try {
      // Transform formData to API format
      const apiPayload = {
        date: formData.date,
        startTime: parseInt(formData.startTime),
        budget: parseFloat(formData.budget),
        numberOfPeople: parseInt(formData.numberOfPeople),
        startLocation: {
          lat: parseFloat(formData.startLocation.lat),
          lng: parseFloat(formData.startLocation.lng)
        },
        preferredTypes: formData.preferredTypes
      };

      // Add optional fields if present
      if (formData.endTime) apiPayload.endTime = parseInt(formData.endTime);
      if (formData.endLocation.lat && formData.endLocation.lng) {
        apiPayload.endLocation = {
          lat: parseFloat(formData.endLocation.lat),
          lng: parseFloat(formData.endLocation.lng)
        };
      }
      if (formData.extraInfo) apiPayload.extraInfo = formData.extraInfo;
      if (formData.travelTolerance.length > 0) {
        apiPayload.travelTolerance = formData.travelTolerance;
      }
      if (formData.transportMode) apiPayload.transportMode = formData.transportMode;

      // preferredTypes now contains the new structure with filters or specific venues
      // No need to merge - send as-is

      console.log('📤 Sending payload:', JSON.stringify(apiPayload, null, 2));

      const response = await fetch('/api/plan-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
      });

      const result = await response.json();
      console.log('Result:', result);
      
      if (response.ok && result.success) {
        // Store results and original request in sessionStorage for clean URL
        sessionStorage.setItem('itineraryResults', JSON.stringify(result));
        sessionStorage.setItem('originalRequest', JSON.stringify(apiPayload));
        router.push('/results');
      } else {
        // Show detailed error message
        const errorMsg = result.details || result.error || 'Failed to generate itinerary';
        alert(`❌ ${errorMsg}`);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Network error: ${error.message}`);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-700 py-12 px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating Shapes */}
        <div className="absolute top-32 right-1/4 w-4 h-4 bg-purple-400/40 rounded-full animate-float"></div>
        <div className="absolute top-48 left-1/4 w-3 h-3 bg-pink-400/40 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-40 right-1/3 w-5 h-5 bg-blue-400/40 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 left-1/2 w-2 h-2 bg-purple-300/40 rounded-full animate-float" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Geometric Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
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

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Hero - Enhanced District Branding */}
        <div className="mb-8">
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-purple-400/20">
            <div className="bg-gradient-to-br from-purple-800 via-purple-600 to-pink-600 text-white p-12 md:p-16 flex flex-col items-center relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"></div>
              
              <div className="mb-6 relative z-10">
                <svg width="280" height="100" viewBox="0 0 560 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect width="560" height="200" rx="20" fill="transparent" />
                  {/* Main District text with capital D */}
                  <text x="50%" y="42%" dominantBaseline="middle" textAnchor="middle" fill="#FFF" fontFamily="Helvetica, Arial, sans-serif" fontWeight="900" fontSize="72" letterSpacing="2">District</text>
                  {/* Enlarged BY ZOMATO text */}
                  <text x="50%" y="72%" dominantBaseline="middle" textAnchor="middle" fill="#F3E8FF" fontFamily="Helvetica, Arial, sans-serif" fontSize="20" fontWeight="600" letterSpacing="4">BY ZOMATO</text>
                </svg>
              </div>
              
              {/* Enhanced Subtitle */}
              <p className="text-lg md:text-xl text-purple-50 text-center max-w-3xl font-light leading-relaxed relative z-10">
                Enter your starting details and preferences to generate a great day out — dining, movies, activities and events.
              </p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <Steps
            type="panel"
            current={step - 1}
            onChange={(current) => {
              // Allow going back to Step 1 or forward to Step 2 if validated
              if (current === 0) {
                setStep(1);
              } else if (current === 1 && isStep1Valid()) {
                setStep(2);
              }
            }}
            items={[
              {
                title: 'Step 1',
                subTitle: 'Basic Information',
              },
              {
                title: 'Step 2',
                subTitle: 'Go-Out Preferences',
                disabled: !isStep1Valid(),
              },
            ]}
            styles={{
              root: {
                '--ant-color-primary': '#9333ea',
                '--ant-color-primary-hover': '#a855f7',
                '--ant-color-primary-bg': 'rgba(147, 51, 234, 0.1)',
              },
              itemTitle: {
                fontWeight: 'bold',
                color: 'white',
              },
              itemSubtitle: {
                fontWeight: 'bold',
                color: 'white',
              }
            }}
          />
        </div>

        {/* Form Steps */}
        <div className="bg-gradient-to-br from-gray-800 to-black rounded-2xl shadow-xl p-8 form-purple">
          {step === 1 && (
            <BasicInfoStep
              formData={formData}
              onNext={handleStepComplete}
            />
          )}
          
          {step === 2 && (
            <GoOutTypesStep
              formData={formData}
              onBack={() => setStep(1)}
              onSubmit={handleSubmit}
              setFormData={setFormData}
              isGenerating={isGenerating}
            />
          )}
        </div>
      </div>
      
      {/* Chatbot Float Button */}
      <FloatButton
        shape="square"
        type="primary"
        style={{
          insetInlineEnd: 24,
          width: 60,
          height: 60,
          backgroundColor: '#9333ea',
        }}
        icon={<MessageOutlined style={{ fontSize: 24 }} />}
        onClick={() => setDrawerOpen(true)}
      />
      
      {/* Chatbot Drawer */}
      <Drawer
        title="District Planning Assistant"
        placement="right"
        size="100%"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        styles={{
          header: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderBottom: '2px solid rgba(147, 51, 234, 0.3)'
          },
          body: {
            padding: 0,
            background: '#000000'
          }
        }}
      >
        <Chatbot onComplete={async (payload) => {
          // Keep drawer open and show loading state
          setIsGenerating(true);
          
          try {
            // Build API payload from chatbot data
            const apiPayload = {
              date: payload.date,
              startTime: payload.startTime,
              endTime: payload.endTime,
              budget: payload.budget,
              numberOfPeople: payload.numberOfPeople,
              startLocation: payload.startLocation,
              endLocation: payload.endLocation,
              extraInfo: payload.extraInfo,
              travelTolerance: payload.travelTolerance || [],
              transportMode: payload.transportMode || 'driving-car',
              preferredTypes: payload.preferredTypes || []
            };

            // Call the API to generate itinerary
            const response = await fetch('/api/plan-itinerary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(apiPayload)
            });

            const result = await response.json();

            if (result.success && result.itineraries) {
              // Store in sessionStorage and navigate to results
              sessionStorage.setItem('itineraryData', JSON.stringify({
                itineraries: result.itineraries,
                originalRequest: apiPayload
              }));
              
              // Close drawer before navigation
              setDrawerOpen(false);
              setIsGenerating(false);
              
              // Navigate to results page
              router.push('/results');
            } else {
              const errorMsg = result.details || result.error || 'Failed to generate itinerary';
              alert(`❌ ${errorMsg}`);
              setIsGenerating(false);
            }
          } catch (error) {
            console.error('Error:', error);
            alert(`Network error: ${error.message}`);
            setIsGenerating(false);
          }
        }} />
      </Drawer>
    </div>
  );
}
