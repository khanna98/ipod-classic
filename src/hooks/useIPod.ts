import { useState, useEffect, useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import axios from 'axios';

type View = 'MENU' | 'COVER_FLOW' | 'PLAYER';

export interface MenuItem {
  label: string;
  type?: 'menu' | 'song' | 'action';
  id?: string;
  children?: MenuItem[];
  imageUrl?: string;
}

// Initial Menu Structure
const INITIAL_MENU: MenuItem = {
  label: 'Mayank\'s iPod',
  type: 'menu',
  children: [
    { label: 'Cover Flow', type: 'action', id: 'cover_flow' },
    { label: 'Music', type: 'menu', children: [
        { label: 'Playlists', type: 'menu', children: [
            { label: 'Loading...', type: 'menu', children: [] } // Will be replaced by API data
        ]},
        { label: 'Artists', type: 'menu', children: [] },
        { label: 'Songs', type: 'menu', children: [] }
    ]},
    { label: 'Settings', type: 'menu', children: [
        { label: 'Sign In', type: 'action', id: 'signin' },
        { label: 'Sign Out', type: 'action', id: 'signout' }
    ]}
  ]
};

export const useIPod = () => {
  const { data: session, status } = useSession();
  const [menuStack, setMenuStack] = useState<MenuItem[]>([INITIAL_MENU]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeView, setActiveView] = useState<View>('MENU');
  
  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<MenuItem[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);

  const currentMenu = menuStack[menuStack.length - 1];
  const currentSong = queue[queueIndex] || null;

  // --- 1. YOUTUBE FETCHING LOGIC ---
  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchPlaylists(session.accessToken as string);
    }
  }, [status, session]);

  const fetchPlaylists = async (token: string) => {
    try {
      // 1. Get Playlists
      const res = await axios.get('https://www.googleapis.com/youtube/v3/playlists', {
        params: { part: 'snippet', mine: 'true', maxResults: 20 },
        headers: { Authorization: `Bearer ${token}` }
      });

      const playlists: MenuItem[] = res.data.items.map((item: any) => ({
        label: item.snippet.title,
        type: 'menu', // It's a menu because clicking it opens songs
        id: item.id,
        children: [] // We will fetch songs when clicked (Lazy Loading) or fetch now.
                     // For simplicity, let's just create a placeholder that triggers fetch.
      }));

      // Update the "Playlists" menu item in the stack
      // This is a simplified deep update for the prototype
      const newRoot = { ...INITIAL_MENU };
      // Drill down: Music -> Playlists
      if (newRoot.children?.[1]?.children?.[0]) {
        newRoot.children[1].children[0].children = playlists;
        newRoot.children[1].children[0].label = "My Playlists";
      }
      
      // Update Settings Label
      if (newRoot.children?.[2]?.children?.[0]) {
        newRoot.children[2].children[0].label = `Signed in as ${session?.user?.name?.split(' ')[0]}`;
      }

      setMenuStack([newRoot]);
    } catch (error) {
      console.error("Failed to fetch playlists", error);
    }
  };

  const fetchSongsForPlaylist = async (playlistId: string, playlistLabel: string) => {
    if (!session?.accessToken) return;
    
    try {
      const res = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
        params: { part: 'snippet', playlistId: playlistId, maxResults: 50 },
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });

      const songs: MenuItem[] = res.data.items
        .filter((item: any) => item.snippet.title !== 'Private video') // Filter bad data
        .map((item: any) => ({
          label: item.snippet.title,
          type: 'song',
          id: item.snippet.resourceId.videoId,
          imageUrl: item.snippet.thumbnails?.high?.url
        }));

      // Push a new Menu View onto the stack with these songs
      const newMenu: MenuItem = {
        label: playlistLabel,
        type: 'menu',
        children: songs
      };

      setMenuStack(prev => [...prev, newMenu]);
      setSelectedIndex(0);

    } catch (error) {
      console.error("Error fetching songs", error);
    }
  };

  // --- 2. NAVIGATION LOGIC ---
  const scroll = useCallback((direction: 1 | -1) => {
    setSelectedIndex((prev) => {
      const max = (currentMenu.children?.length || 0) - 1;
      const next = prev + direction;
      if (next < 0) return max;
      if (next > max) return 0;
      return next;
    });
  }, [currentMenu]);

  const select = () => {
    const item = currentMenu.children?.[selectedIndex];
    if (!item) return;

    if (item.id === 'signin') {
        signIn('google');
        return;
    }
    if (item.id === 'signout') {
        signOut();
        return;
    }

    if (item.type === 'menu') {
      // Check if this is a YouTube Playlist (it has an ID but no children loaded yet)
      if (item.id && (!item.children || item.children.length === 0)) {
         fetchSongsForPlaylist(item.id, item.label);
      } else {
         // Normal Menu Navigation
         setMenuStack([...menuStack, item]);
         setSelectedIndex(0);
      }
    } else if (item.type === 'song') {
      // 1. CREATE QUEUE
      const songs = currentMenu.children?.filter(c => c.type === 'song') || [];
      setQueue(songs);
      
      // 2. SET INDEX
      const idx = songs.findIndex(s => s.id === item.id);
      setQueueIndex(idx);
      
      // 3. PLAY
      setActiveView('PLAYER');
      setIsPlaying(true);
    } else if (item.id === 'cover_flow') {
      setActiveView('COVER_FLOW');
    }
  };

  const back = () => {
    if (activeView !== 'MENU') {
      setActiveView('MENU');
      return;
    }
    if (menuStack.length > 1) {
      setMenuStack(menuStack.slice(0, -1));
      setSelectedIndex(0);
    }
  };

  const playPause = () => setIsPlaying(!isPlaying);

  // --- 3. NEXT / PREV LOGIC ---
  const nextSong = () => {
    if (queue.length > 0) {
        const nextIdx = (queueIndex + 1) % queue.length;
        setQueueIndex(nextIdx);
        setIsPlaying(true);
    }
  };

  const prevSong = () => {
    if (queue.length > 0) {
        // Handle wrapping to end if at start
        const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
        setQueueIndex(prevIdx);
        setIsPlaying(true);
    }
  };

  return {
    currentMenu,
    selectedIndex,
    activeView,
    currentSongId: currentSong?.id || null,
    currentSong, // We export the full object now so we can get labels/images
    isPlaying,
    scroll,
    select,
    back,
    playPause,
    nextSong,
    prevSong
  };
};