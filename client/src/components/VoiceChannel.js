import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import './VoiceChannel.css';

const VoiceChannel = ({ username }) => {
  const [inVoice, setInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState([]);
  const [speaking, setSpeaking] = useState(new Set());
  
  const streamRef = useRef(null);
  const peersRef = useRef({});
  const audioContextRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const setupSocketListeners = () => {
      if (!wsRef.current) return;

      wsRef.current.addEventListener('message', (e) => {
        try {
          const data = JSON.parse(e.data);
          
          if (data.type === 'voice_users') {
            console.log('📋 Voice users updated:', data.payload);
            setVoiceUsers(data.payload);
          }
          
          if (data.type === 'voice_signal') {
            console.log('📨 Received voice signal');
            if (streamRef.current) {
              handleSignal(data.payload);
            } else {
              console.log('⚠️ No stream yet, ignoring signal');
            }
          }
        } catch (err) {
          console.error('Error handling voice message:', err);
        }
      });
    };

    // Get WebSocket from window (set by sagas)
    const checkSocket = setInterval(() => {
      if (window.chatWebSocket) {
        wsRef.current = window.chatWebSocket;
        clearInterval(checkSocket);
        setupSocketListeners();
      }
    }, 100);

    return () => {
      clearInterval(checkSocket);
      leaveVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      setInVoice(true);
      
      // Setup audio detection
      setupAudioDetection(stream);
      
      // Tell server we joined
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'join_voice' }));
      }
      
    } catch (err) {
      console.error('Failed to get microphone:', err);
      alert('Could not access microphone. Please allow microphone permissions.');
    }
  };

  const leaveVoice = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    Object.values(peersRef.current).forEach(peer => {
      if (peer.destroy) peer.destroy();
    });
    peersRef.current = {};
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setInVoice(false);
    setIsMuted(false);
    setSpeaking(new Set());
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_voice' }));
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const createPeer = (fromUser, initiator, stream) => {
    console.log(`🔗 Creating peer for ${fromUser}, initiator: ${initiator}`);
    
    const peer = new Peer({ 
      initiator, 
      stream, 
      trickle: true,
      config: {
        iceServers: [
          // STUN servers para descubrir IPs públicas
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          
          // TURN servers (relay) para NAT traversal en producción
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ],
        iceTransportPolicy: 'all' // Permite usar tanto STUN como TURN
      }
    });
    
    peer.on('signal', signal => {
      console.log('📡 Sending signal to', fromUser);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'voice_signal',
          payload: { signal }
        }));
      }
    });
    
    peer.on('stream', remoteStream => {
      console.log('🎵 Received remote stream from', fromUser);
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.volume = 1.0;
      audio.autoplay = true;
      audio.play().then(() => {
        console.log('▶️ Playing audio from', fromUser);
      }).catch(e => console.error('Audio play error:', e));
    });
    
    peer.on('connect', () => {
      console.log('✅ Peer connected:', fromUser);
    });
    
    peer.on('error', err => {
      console.error('❌ Peer error:', err);
    });
    
    peer.on('close', () => {
      console.log('🔌 Peer connection closed:', fromUser);
    });
    
    return peer;
  };

  const handleSignal = ({ from, fromUsername, signal }) => {
    if (!from || !signal) return;
    
    console.log('📥 Handling signal from', fromUsername || from);
    
    if (peersRef.current[fromUsername]) {
      console.log('Signaling existing peer:', fromUsername);
      peersRef.current[fromUsername].signal(signal);
    } else if (streamRef.current) {
      console.log('Creating new peer for:', fromUsername);
      const peer = createPeer(fromUsername, false, streamRef.current);
      peersRef.current[fromUsername] = peer;
      peer.signal(signal);
    }
  };

  const setupAudioDetection = (stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const detectSpeaking = () => {
        if (!streamRef.current) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        if (average > 15 && !isMuted) {
          setSpeaking(prev => {
            const newSet = new Set(prev);
            newSet.add(username);
            return newSet;
          });
        } else {
          setSpeaking(prev => {
            const newSet = new Set(prev);
            newSet.delete(username);
            return newSet;
          });
        }
        
        requestAnimationFrame(detectSpeaking);
      };
      
      detectSpeaking();
    } catch (err) {
      console.error('Error setting up audio detection:', err);
    }
  };

  // Create peer connections for new users
  useEffect(() => {
    if (!inVoice || !streamRef.current) return;
    
    console.log('Voice users changed:', voiceUsers);
    
    voiceUsers.forEach(user => {
      if (user !== username && !peersRef.current[user]) {
        const shouldInitiate = username < user;
        console.log(`🔗 Creating peer for ${user}, shouldInitiate: ${shouldInitiate}`);
        const peer = createPeer(user, shouldInitiate, streamRef.current);
        peersRef.current[user] = peer;
      }
    });
    
    // Clean up disconnected peers
    Object.keys(peersRef.current).forEach(userId => {
      const stillConnected = voiceUsers.some(u => u === userId);
      if (!stillConnected && peersRef.current[userId]) {
        console.log('🗑️ Cleaning up peer:', userId);
        peersRef.current[userId].destroy();
        delete peersRef.current[userId];
      }
    });
  }, [voiceUsers, inVoice, username]);

  return (
    <div className="voice-channel">
      <div className="voice-header">
        <h3>🎤 Voice Channel</h3>
        {!inVoice ? (
          <button className="join-voice-btn" onClick={joinVoice}>
            Join
          </button>
        ) : (
          <div className="voice-controls">
            <button 
              className={`mute-btn ${isMuted ? 'muted' : ''}`}
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>
            <button className="leave-voice-btn" onClick={leaveVoice}>
              Leave
            </button>
          </div>
        )}
      </div>
      
      <div className="voice-users-list">
        <h4>In Voice ({voiceUsers.length})</h4>
        {voiceUsers.length === 0 ? (
          <p className="no-users">No one in voice</p>
        ) : (
          <ul>
            {voiceUsers.map((user, index) => (
              <li key={index} className={speaking.has(user) ? 'speaking' : ''}>
                <span className="voice-indicator">
                  {user === username && isMuted ? '🔇' : speaking.has(user) ? '🔊' : '🎤'}
                </span>
                {user}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VoiceChannel;