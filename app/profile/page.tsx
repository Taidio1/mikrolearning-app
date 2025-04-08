'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaVideo, FaBook, FaCog } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  selected_topics: string[];
  liked_videos: string[];
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }
      
      if (profileData) {
        setProfile(profileData as UserProfile);
        
        // Fetch liked videos
        if (profileData.liked_videos && profileData.liked_videos.length > 0) {
          const { data: videoData, error: videoError } = await supabase
            .from('videos')
            .select('id, title, video_url, category')
            .in('id', profileData.liked_videos);
          
          if (videoError) {
            console.error('Error fetching liked videos:', videoError);
          } else if (videoData) {
            setLikedVideos(videoData);
          }
        }
      }
      
      // Fetch available topics
      const { data: categoryData, error: categoryError } = await supabase
        .from('videos')
        .select('category')
        .limit(20);
      
      if (categoryError) {
        console.error('Error fetching categories:', categoryError);
      } else if (categoryData) {
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(categoryData.map((item: any) => item.category))
        );
        setAvailableTopics(uniqueCategories as string[]);
      }
      
      setLoading(false);
    }
    
    fetchUserProfile();
  }, [user]);

  const handleTopicToggle = async (topic: string) => {
    if (!profile) return;
    
    let updatedTopics;
    
    if (profile.selected_topics.includes(topic)) {
      // Remove topic
      updatedTopics = profile.selected_topics.filter(t => t !== topic);
    } else {
      // Add topic
      updatedTopics = [...profile.selected_topics, topic];
    }
    
    // Update in database
    const { error } = await supabase
      .from('users')
      .update({ selected_topics: updatedTopics })
      .eq('id', profile.id);
      
    if (error) {
      console.error('Error updating topics:', error);
      return;
    }
    
    // Update local state
    setProfile({
      ...profile,
      selected_topics: updatedTopics,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-white text-xl">Ładowanie profilu...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <h2 className="text-2xl mb-4">Coś poszło nie tak</h2>
        <p className="mb-6 text-gray-400">Nie mogliśmy załadować Twojego profilu</p>
        <Link href="/" className="py-2 px-6 bg-blue-600 text-white rounded-md">
          Powrót do strony głównej
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-16 p-4">
      <div className="bg-gray-900 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden mr-6">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">{profile.username.charAt(0).toUpperCase()}</span>
            )}
          </div>
          
          <div>
            <h1 className="text-2xl font-bold">{profile.username}</h1>
            <p className="text-gray-400">{profile.email}</p>
          </div>
          
          <Link href="/settings" className="ml-auto p-2 text-gray-400">
            <FaCog className="text-xl" />
          </Link>
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaBook className="mr-2" /> Wybrane tematy do nauki
        </h2>
        
        <div className="flex flex-wrap gap-2">
          {availableTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicToggle(topic)}
              className={`px-3 py-1 rounded-full text-sm ${
                profile.selected_topics.includes(topic)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaVideo className="mr-2" /> Polubione filmy
        </h2>
        
        {likedVideos.length === 0 ? (
          <p className="text-gray-400">Brak polubionych filmów</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {likedVideos.map((video) => (
              <Link 
                key={video.id} 
                href={`/video?id=${video.id}`}
                className="flex items-center p-3 bg-gray-800 rounded-md hover:bg-gray-700"
              >
                <div className="w-12 h-12 bg-black rounded-md flex items-center justify-center mr-3">
                  <FaVideo className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium">{video.title}</h3>
                  <p className="text-xs text-gray-400">{video.category}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 