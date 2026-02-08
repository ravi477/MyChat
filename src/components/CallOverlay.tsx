
import React, { useState, useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Minimize2, Maximize2 } from 'lucide-react';
import { playRingtone, stopRingtone, playConnectedSound } from '../utils/callSounds';

const CallOverlay: React.FC = () => {
    const {
        call,
        callAccepted,
        myVideo,
        userVideo,
        stream,
        answerCall,
        leaveCall,
        isCalling
    } = useCall();

    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');

    const toggleMic = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !micOn;
            });
            setMicOn(!micOn);
        }
    };

    const toggleCam = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => {
                track.enabled = !camOn;
            });
            setCamOn(!camOn);
        }
    };

    // Handle ringtone for incoming calls
    useEffect(() => {
        if (call.isReceivingCall && !callAccepted) {
            ringtoneRef.current = playRingtone();
        } else {
            stopRingtone(ringtoneRef.current);
            ringtoneRef.current = null;
        }
        return () => stopRingtone(ringtoneRef.current);
    }, [call.isReceivingCall, callAccepted]);

    // Play sound when call is accepted
    useEffect(() => {
        if (callAccepted) {
            playConnectedSound();
            setConnectionStatus('connected');
        }
    }, [callAccepted]);

    if (call.isReceivingCall && !callAccepted) {
        return (
            <div style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                padding: '16px 24px',
                gap: '24px',
                minWidth: '400px',
                animation: 'slideDown 0.3s ease-out'
            }}>
                <div style={{
                    position: 'relative',
                    width: '56px',
                    height: '56px'
                }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        backgroundColor: 'var(--bg-tertiary)',
                        animation: 'pulse-ring 2s infinite'
                    }} />
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', fontSize: '20px'
                    }}>
                        {call.name.charAt(0).toUpperCase()}
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {call.name || "Unknown Caller"}
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Incoming {call.isVideo ? 'Video' : 'Voice'} Call...
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => {
                            stopRingtone(ringtoneRef.current);
                            leaveCall();
                        }}
                        title="Decline"
                        style={{
                            width: '40px', height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'transform 0.2s'
                        }}
                    >
                        <PhoneOff size={20} color="white" />
                    </button>
                    <button
                        onClick={() => {
                            stopRingtone(ringtoneRef.current);
                            answerCall();
                        }}
                        title="Accept"
                        style={{
                            width: '40px', height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            transform: 'scale(1.1)',
                            transition: 'transform 0.2s'
                        }}
                    >
                        <Phone size={20} color="white" />
                    </button>
                </div>
                <style>{`
                    @keyframes slideDown {
                        from { transform: translate(-50%, -100%); opacity: 0; }
                        to { transform: translate(-50%, 0); opacity: 1; }
                    }
                    @keyframes pulse-ring {
                        0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                        100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                    }
                `}</style>
            </div>
        );
    }

    if (callAccepted || isCalling) {
        return (
            <div style={isMinimized ? {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '320px',
                height: '240px',
                backgroundColor: '#1e293b',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                zIndex: 9999,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            } : {
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: '#000',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                {/* Header / Controls Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    padding: isMinimized ? '8px' : '20px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    zIndex: 20,
                    background: isMinimized ? 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' : 'none'
                }}>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white'
                        }}
                    >
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={20} />}
                    </button>
                </div>

                {/* Remote Video (Full Screen) */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    {callAccepted ? (
                        <video
                            playsInline
                            ref={userVideo}
                            autoPlay
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'column',
                            color: 'white'
                        }}>
                            {!isMinimized && (
                                <>
                                    <div style={{
                                        width: '120px', height: '120px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        marginBottom: '24px',
                                    }} />
                                    <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>
                                        {connectionStatus === 'connecting' ? 'Connecting...' : 'Ringing...'}
                                    </h3>
                                    <div style={{
                                        display: 'flex',
                                        gap: '4px',
                                        alignItems: 'center'
                                    }}>
                                        {[0, 1, 2].map(i => (
                                            <div
                                                key={i}
                                                style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'rgba(255,255,255,0.3)',
                                                    animation: `pulse 1.4s infinite ${i * 0.2}s`
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <style>{`
                                        @keyframes pulse {
                                            0%, 100% { opacity: 0.3; transform: scale(0.8); }
                                            50% { opacity: 1; transform: scale(1.2); }
                                        }
                                    `}</style>
                                </>
                            )}
                            {isMinimized && (
                                <h3 style={{ fontSize: '16px' }}>Calling...</h3>
                            )}
                        </div>
                    )}

                    {/* Local Video (PIP) - Hide if minimized to avoid clutter, or make very small? 
                        Let's hide local video in minimized mode to keep it clean. 
                    */}
                    {!isMinimized && (
                        <div style={{
                            position: 'absolute',
                            bottom: '120px',
                            right: '32px',
                            width: '180px',
                            height: '240px',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            backgroundColor: '#1e293b',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <video
                                playsInline
                                ref={myVideo}
                                autoPlay
                                muted
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transform: 'scaleX(-1)' // Mirror effect
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Controls Bar - Compact if minimized */}
                <div style={{
                    height: isMinimized ? '60px' : '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isMinimized ? '12px' : '24px',
                    paddingBottom: isMinimized ? '0' : '20px',
                    background: isMinimized ? 'rgba(0,0,0,0.8)' : 'transparent',
                    backdropFilter: isMinimized ? 'blur(10px)' : 'none'
                }}>
                    <button
                        onClick={toggleMic}
                        style={{
                            padding: isMinimized ? '8px' : '16px',
                            borderRadius: '50%',
                            backgroundColor: micOn ? 'rgba(255,255,255,0.1)' : '#ef4444',
                            border: 'none', cursor: 'pointer', color: 'white',
                            transition: 'all 0.2s'
                        }}
                    >
                        {micOn ? <Mic size={isMinimized ? 16 : 24} /> : <MicOff size={isMinimized ? 16 : 24} />}
                    </button>

                    <button
                        onClick={() => leaveCall()}
                        style={{
                            padding: isMinimized ? '8px 16px' : '16px 32px',
                            borderRadius: '32px',
                            backgroundColor: '#ef4444',
                            border: 'none', cursor: 'pointer', color: 'white'
                        }}
                    >
                        <PhoneOff size={isMinimized ? 16 : 24} />
                    </button>

                    <button
                        onClick={toggleCam}
                        style={{
                            padding: isMinimized ? '8px' : '16px',
                            borderRadius: '50%',
                            backgroundColor: camOn ? 'rgba(255,255,255,0.1)' : '#ef4444',
                            border: 'none', cursor: 'pointer', color: 'white',
                            transition: 'all 0.2s'
                        }}
                    >
                        {camOn ? <Video size={isMinimized ? 16 : 24} /> : <VideoOff size={isMinimized ? 16 : 24} />}
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default CallOverlay;
