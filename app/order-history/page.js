
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, MapPin, IndianRupee, Calendar, Users, Navigation, ChevronDown, ChevronUp, Package, ArrowLeft, Star } from 'lucide-react';

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/order-history');
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
      } else {
        console.error('Failed to fetch orders:', data.error);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m > 0) {
      return `${h}h ${m}m`;
    }
    return `${h}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-700 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-purple-300 font-medium">Loading your order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-700 py-12 px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-purple-300 hover:text-purple-200 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Order History</h1>
          </div>
          <p className="text-purple-300">View all your booked itineraries</p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-2 border-purple-500/30 rounded-2xl p-12 text-center shadow-2xl">
            <div className="bg-purple-900/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No orders yet</h2>
            <p className="text-purple-300 mb-8 text-lg">Start planning your first adventure!</p>
            <button
              onClick={() => router.push('/plan')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-[1.02]"
            >
              Plan Itinerary
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isExpanded = expandedOrders.has(order._id);
              
              return (
                <div key={order._id} className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-2 border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden hover:border-purple-500/50 hover:shadow-purple-500/20 transition-all duration-300 transform hover:scale-[1.01]">
                  {/* Order Summary - Always Visible */}
                  <div className="p-6 bg-gradient-to-br from-purple-900/10 to-blue-900/10">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-purple-300 bg-gradient-to-r from-purple-900/50 to-blue-900/50 px-4 py-2 rounded-xl border border-purple-500/30 font-bold backdrop-blur-sm">
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-300 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">{formatDate(order.orderDate)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleOrderExpansion(order._id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-blue-600/40 text-purple-300 rounded-xl transition-all duration-300 border border-purple-500/30 hover:border-purple-400/50 font-medium backdrop-blur-sm"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-5 h-5" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-5 h-5" />
                            View Details
                          </>
                        )}
                      </button>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                      <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 hover:border-purple-400/40 transition-all">
                        <div className="flex items-center gap-2 text-purple-300 text-xs mb-2">
                          <Package className="w-4 h-4" />
                          <span className="font-semibold">Activities</span>
                        </div>
                        <div className="text-white font-bold text-2xl">{order.itinerary.length}</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-900/30 to-emerald-800/30 backdrop-blur-sm rounded-xl p-4 border border-green-500/20 hover:border-green-400/40 transition-all">
                        <div className="flex items-center gap-2 text-green-300 text-xs mb-2">
                          <IndianRupee className="w-4 h-4" />
                          <span className="font-semibold">Total Cost</span>
                        </div>
                        <div className="text-white font-bold text-2xl">₹{order.totalBudget}</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20 hover:border-blue-400/40 transition-all">
                        <div className="flex items-center gap-2 text-blue-300 text-xs mb-2">
                          <Users className="w-4 h-4" />
                          <span className="font-semibold">People</span>
                        </div>
                        <div className="text-white font-bold text-2xl">{order.numberOfPeople}</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 backdrop-blur-sm rounded-xl p-4 border border-orange-500/20 hover:border-orange-400/40 transition-all">
                        <div className="flex items-center gap-2 text-orange-300 text-xs mb-2">
                          <Navigation className="w-4 h-4" />
                          <span className="font-semibold">Distance</span>
                        </div>
                        <div className="text-white font-bold text-2xl">
                          {order.totalDistance ? `${order.totalDistance.toFixed(1)}` : 'N/A'}
                          {order.totalDistance && <span className="text-sm font-normal text-orange-300 ml-1">km</span>}
                        </div>
                      </div>
                    </div>

                    {/* Activities Preview (when collapsed) */}
                    {!isExpanded && (
                      <div className="flex flex-wrap gap-2">
                        {order.itinerary.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="px-4 py-2 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/40 rounded-xl text-sm text-purple-200 font-medium backdrop-blur-sm hover:border-purple-400/60 transition-all">
                            {item.venue.name}
                          </div>
                        ))}
                        {order.itinerary.length > 3 && (
                          <div className="px-4 py-2 bg-gray-800/60 border border-gray-600/40 rounded-xl text-sm text-gray-300 font-medium backdrop-blur-sm">
                            +{order.itinerary.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t-2 border-purple-500/20 bg-gradient-to-b from-gray-800/40 to-gray-900/40 p-6 backdrop-blur-sm">
                      <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-6">Itinerary Details</h3>
                      
                      <div className="space-y-4">
                        {order.itinerary.map((item, idx) => (
                          <div key={idx} className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 border-2 border-gray-700/50 rounded-xl p-5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm">
                            <div className="flex gap-5">
                              {/* Activity Number */}
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-lg border-2 border-purple-400/30">
                                  {idx + 1}
                                </div>
                              </div>

                              {/* Venue Image */}
                              {item.venue.banner_url && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={item.venue.banner_url}
                                    alt={item.venue.name}
                                    className="w-28 h-28 rounded-xl object-cover border-2 border-gray-700/50 shadow-lg"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                </div>
                              )}

                              {/* Venue Details */}
                              <div className="flex-1">
                                <h4 className="text-xl font-bold text-white mb-2">{item.venue.name}</h4>
                                {item.venue.description && (
                                  <p className="text-sm text-purple-200/80 mb-3 line-clamp-2">{item.venue.description}</p>
                                )}
                                
                                <div className="flex flex-wrap gap-3 text-sm mb-3">
                                  {item.venue.pricePerPerson && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/30 border border-green-500/30 rounded-lg text-green-300 font-medium">
                                      <IndianRupee className="w-4 h-4" />
                                      <span>₹{item.venue.pricePerPerson}/person</span>
                                    </div>
                                  )}
                                  {item.venue.duration && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/30 border border-blue-500/30 rounded-lg text-blue-300 font-medium">
                                      <Clock className="w-4 h-4" />
                                      <span>{item.venue.duration} mins</span>
                                    </div>
                                  )}
                                  {item.venue.rating && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-900/30 border border-yellow-500/30 rounded-lg text-yellow-300 font-medium">
                                      <Star className="w-4 h-4 fill-yellow-400" />
                                      <span>{item.venue.rating}</span>
                                    </div>
                                  )}
                                  {item.venue.distanceKm !== undefined && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-900/30 border border-orange-500/30 rounded-lg text-orange-300 font-medium">
                                      <Navigation className="w-4 h-4" />
                                      <span>{item.venue.distanceKm} km</span>
                                    </div>
                                  )}
                                </div>

                                {item.venue.address && (
                                  <div className="flex items-center gap-2 text-xs text-purple-300/70 bg-purple-900/20 px-3 py-1.5 rounded-lg border border-purple-500/20 w-fit">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{item.venue.address}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
