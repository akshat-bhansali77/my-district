
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Avatar, Spin } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { TextArea } = Input;

export default function Chatbot({ onComplete }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState({
    payload: {
      preferredTypes: []
    },
    missingFields: ['date', 'startTime', 'budget', 'numberOfPeople', 'startLocation']
  });
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send initial greeting
  useEffect(() => {
    const greetingMessage = {
      role: 'assistant',
      content: "👋 Hello! I'm District Assistant, here to help you plan an amazing day out!\n\nTo get started, I'll need some information from you. Let me ask you a few questions:\n\n📅 First, what date are you planning this outing? (Please provide in YYYY-MM-DD format, like 2025-02-15)"
    };
    setMessages([greetingMessage]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Check if user is confirming to generate (after all fields are collected)
      if (conversationState.missingFields.length === 0 &&
          (currentInput.toLowerCase().includes('yes') ||
           currentInput.toLowerCase().includes('generate') ||
           currentInput.toLowerCase().includes('proceed'))) {
        
        const confirmMessage = {
          role: 'assistant',
          content: "🚀 Great! Generating your perfect day out itinerary now...\n\nPlease wait while I find the best activities, dining spots, and experiences for you!"
        };
        setMessages(prev => [...prev, confirmMessage]);
        
        // Keep loading state active and trigger completion callback
        await onComplete(conversationState.payload);
        return;
      }

      // Send to AI API to process the message
      const response = await fetch('/api/chatbot-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          currentPayload: conversationState.payload,
          missingFields: conversationState.missingFields
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add AI response
        const assistantMessage = {
          role: 'assistant',
          content: data.response
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Update conversation state
        setConversationState({
          payload: data.payload,
          missingFields: data.missingFields
        });

        // If all mandatory fields are collected, offer to generate itinerary
        if (data.missingFields.length === 0 && data.readyToGenerate) {
          setTimeout(() => {
            const completionMessage = {
              role: 'assistant',
              content: "🎉 Perfect! I have all the information I need. Would you like me to generate your itinerary now? (Type 'yes' to proceed)"
            };
            setMessages(prev => [...prev, completionMessage]);
          }, 1000);
        }
      } else {
        throw new Error(data.error || 'Failed to process message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your message. Please try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleGenerate = async () => {
    // Check if all mandatory fields are filled
    if (conversationState.missingFields.length > 0) {
      alert('Not enough context! Please provide: ' + conversationState.missingFields.join(', '));
      return;
    }

    // Add a message to indicate generation is starting
    const generatingMessage = {
      role: 'assistant',
      content: "🚀 Perfect! Generating your itinerary now... Please wait while I find the best options for you!"
    };
    setMessages(prev => [...prev, generatingMessage]);
    setIsLoading(true);

    // Call onComplete which will handle API call and navigation
    await onComplete(conversationState.payload);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-black">
      {/* Generate Button Header */}
      <div className="bg-gray-900 border-b border-purple-500/30 p-3 flex justify-end">
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={handleGenerate}
          size="large"
          loading={isLoading}
          disabled={isLoading || conversationState.missingFields.length > 0}
          style={{
            backgroundColor: conversationState.missingFields.length === 0 ? '#9333ea' : '#6b7280',
            borderColor: conversationState.missingFields.length === 0 ? '#9333ea' : '#6b7280',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? 'Generating...' : 'Generate Itinerary'}
        </Button>
      </div>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: 'calc(100vh - 260px)' }}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <Avatar
              size={40}
              icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
              className={
                message.role === 'user'
                  ? 'bg-purple-600'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }
            />

            {/* Message Bubble */}
            <div
              className={`max-w-[70%] rounded-2xl p-4 ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-100 border border-purple-500/20'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <Avatar
              size={40}
              icon={<RobotOutlined />}
              className="bg-gradient-to-br from-purple-500 to-pink-500"
            />
            <div className="bg-gray-800 rounded-2xl p-4 border border-purple-500/20">
              <Spin size="small" />
              <span className="ml-2 text-gray-400 text-sm">District Assistant is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 bg-gray-900 p-4">
        <div className="flex gap-2">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="flex-1"
            disabled={isLoading}
            style={{
              backgroundColor: '#1f2937',
              border: '1px solid #4b5563',
              color: 'white',
              borderRadius: '12px'
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="large"
            style={{
              backgroundColor: '#9333ea',
              borderColor: '#9333ea',
              height: 'auto',
              minHeight: '40px',
              borderRadius: '12px'
            }}
          />
        </div>
      </div>
    </div>
  );
}
