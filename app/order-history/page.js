
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
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Start planning your first itinerary!</p>
            <button
              onClick={() => router.push('/plan')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-[1.02]"
            >
              Plan Itinerary
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isExpanded = expandedOrders.has(order._id);
              
              return (
                <div key={order._id} className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden hover:border-purple-500/50 transition-colors">
                  {/* Order Summary - Always Visible */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono text-purple-400 bg-purple-900/30 px-3 py-1 rounded-lg">
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(order.orderDate)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleOrderExpansion(order._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-purple-300 rounded-lg transition-colors"
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                          <Package className="w-3 h-3" />
                          Activities
                        </div>
                        <div className="text-white font-semibold">{order.itinerary.length}</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                          <IndianRupee className="w-3 h-3" />
                          Total Cost
                        </div>
                        <div className="text-white font-semibold">₹{order.totalBudget}</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                          <Users className="w-3 h-3" />
                          People
                        </div>
                        <div className="text-white font-semibold">{order.numberOfPeople}</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                          <Navigation className="w-3 h-3" />
                          Distance
                        </div>
                        <div className="text-white font-semibold">
                          {order.totalDistance ? `${order.totalDistance.toFixed(1)} km` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Activities Preview (when collapsed) */}
                    {!isExpanded && (
                      <div className="flex flex-wrap gap-2">
                        {order.itinerary.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-lg text-sm text-purple-300">
                            {item.venue.name}
                          </div>
                        ))}
                        {order.itinerary.length > 3 && (
                          <div className="px-3 py-1 bg-gray-800 rounded-lg text-sm text-gray-400">
                            +{order.itinerary.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-800 bg-gray-800/30 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Itinerary Details</h3>
                      
                      <div className="space-y-4">
                        {order.itinerary.map((item, idx) => (
                          <div key={idx} className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
                            <div className="flex gap-4">
                              {/* Activity Number */}
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                  {idx + 1}
                                </div>
                              </div>

                              {/* Venue Image */}
                              {item.venue.banner_url && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={item.venue.banner_url}
                                    alt={item.venue.name}
                                    className="w-24 h-24 rounded-lg object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                </div>
                              )}

                              {/* Venue Details */}
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-white mb-1">{item.venue.name}</h4>
                                {item.venue.description && (
                                  <p className="text-sm text-gray-400 mb-2 line-clamp-2">{item.venue.description}</p>
                                )}
                                
                                <div className="flex flex-wrap gap-3 text-sm">
                                  {item.venue.pricePerPerson && (
                                    <div className="flex items-center gap-1 text-gray-300">
                                      <IndianRupee className="w-4 h-4" />
                                      <span>₹{item.venue.pricePerPerson}/person</span>
                                    </div>
                                  )}
                                  {item.venue.duration && (
                                    <div className="flex items-center gap-1 text-gray-300">
                                      <Clock className="w-4 h-4" />
                                      <span>{item.venue.duration} mins</span>
                                    </div>
                                  )}
                                  {item.venue.rating && (
                                    <div className="flex items-center gap-1 text-yellow-400">
                                      <Star className="w-4 h-4 fill-yellow-400" />
                                      <span>{item.venue.rating}</span>
                                    </div>
                                  )}
                                  {item.venue.distanceKm !== undefined && (
                                    <div className="flex items-center gap-1 text-gray-300">
                                      <Navigation className="w-4 h-4" />
                                      <span>{item.venue.distanceKm} km</span>
                                    </div>
                                  )}
                                </div>

                                {item.venue.address && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                    <MapPin className="w-3 h-3" />
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
