
import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from './AuthContext';

interface Call {
    isReceivingCall: boolean;
    from: string;
    name: string;
    signal: any;
    isVideo: boolean;
}

interface CallContextType {
    call: Call;
    callAccepted: boolean;
    callEnded: boolean;
    myVideo: React.RefObject<HTMLVideoElement | null>;
    userVideo: React.RefObject<HTMLVideoElement | null>;
    stream: MediaStream | undefined;
    name: string;
    setName: (name: string) => void;
    callUser: (id: string, isVideo?: boolean) => void;
    answerCall: () => void;
    leaveCall: () => void;
    isCalling: boolean;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { socket } = useSocket();
    const { currentUser } = useAuth();
    const [stream, setStream] = useState<MediaStream>();
    const [call, setCall] = useState<Call>({ isReceivingCall: false, from: '', name: '', signal: null, isVideo: false });
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('');
    const [isCalling, setIsCalling] = useState(false);
    const [otherUserId, setOtherUserId] = useState('');

    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);
    const connectionRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        // Setup socket listeners for incoming calls
        if (!socket) return;

        socket.on('callUser', ({ from, name: callerName, signal, isVideo }) => {
            console.log("Receiving call from", callerName);
            setCall({ isReceivingCall: true, from, name: callerName, signal, isVideo });
            setOtherUserId(from);
        });

        // Listen for end call from other side
        socket.on('callEnded', () => {
            leaveCall(false); // Don't emit endCall again
        });

        return () => {
            socket.off('callUser');
            socket.off('callEnded');
        };
    }, [socket]);

    const setupStream = async (video: boolean) => {
        try {
            // IMPORTANT: Clean up any existing stream FIRST
            if (stream) {
                console.log('Cleaning up existing stream before requesting new media...');
                stream.getTracks().forEach(track => {
                    track.stop();
                    console.log(`Stopped existing ${track.kind} track`);
                });
                setStream(undefined);

                // Give browser time to release the devices
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log(`Requesting media access (video: ${video})...`);
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            if (!video) {
                currentStream.getVideoTracks().forEach(track => track.enabled = false);
            }

            setStream(currentStream);
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }

            console.log('Media stream acquired successfully');
            return currentStream;
        } catch (err) {
            console.error("Failed to get local stream", err);
            alert(`Camera/Microphone Error: ${err instanceof Error ? err.message : 'Device in use or permission denied'}. Please close any other apps using your camera and try again.`);
            return null;
        }
    };

    const createPeerConnection = (isInitiator: boolean, currentStream: MediaStream, userToCall?: string) => {
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        currentStream.getTracks().forEach((track) => {
            peer.addTrack(track, currentStream);
        });

        peer.ontrack = (event) => {
            if (userVideo.current) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('iceCandidate', {
                    candidate: event.candidate,
                    to: otherUserId || (isInitiator ? userToCall : call.from)
                });
            }
        };

        // Handle incoming ICE candidates
        socket.on('iceCandidate', async (candidate) => {
            try {
                if (peer.signalingState !== 'closed') {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (e) {
                console.error("Error adding ice candidate", e);
            }
        });

        return peer;
    };

    const callUser = async (id: string, isVideo = true) => {
        console.log('Calling user:', id, isVideo ? '(Video)' : '(Voice)');
        setIsCalling(true);
        setCallEnded(false);
        setCallAccepted(false); // Reset call state
        setOtherUserId(id);

        const currentStream = await setupStream(isVideo);
        if (!currentStream) return;

        const peer = createPeerConnection(true, currentStream, id);
        connectionRef.current = peer;

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        console.log('Emitting callUser event to server');
        socket.emit('callUser', {
            userToCall: id,
            signalData: offer,
            from: currentUser?.uid || 'unknown',
            name: currentUser?.displayName || 'Unknown User',
            isVideo
        });

        socket.on('callAccepted', async (signal) => {
            setCallAccepted(true);
            setIsCalling(false); // Connected
            const desc = new RTCSessionDescription(signal);
            if (peer.signalingState !== 'closed') {
                await peer.setRemoteDescription(desc);
            }
        });
    };

    const answerCall = async () => {
        setCallAccepted(true);
        const currentStream = await setupStream(call.isVideo);
        if (!currentStream) return;

        const peer = createPeerConnection(false, currentStream);
        connectionRef.current = peer;

        await peer.setRemoteDescription(new RTCSessionDescription(call.signal));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket.emit('answerCall', {
            signal: answer,
            to: call.from
        });
    };

    const leaveCall = (emitEnd = true) => {
        console.log('Ending call, cleaning up media...');

        // Notify other user BEFORE closing if explicitly leaving
        if (emitEnd && otherUserId) {
            socket.emit('endCall', { to: otherUserId });
        }

        // STEP 1: Stop tracks from peer connection senders
        if (connectionRef.current) {
            try {
                connectionRef.current.getSenders().forEach(sender => {
                    if (sender.track) {
                        sender.track.stop();
                        console.log(`Stopped peer ${sender.track.kind} track`);
                    }
                });
            } catch (e) {
                console.warn('Error stopping peer tracks:', e);
            }
        }

        // STEP 2: Stop all local stream tracks
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                console.log(`Stopped local ${track.kind} track (state: ${track.readyState})`);
            });
        }

        // STEP 3: Clear video elements
        if (myVideo.current) {
            myVideo.current.srcObject = null;
            myVideo.current.load(); // Force reload to clear
        }
        if (userVideo.current) {
            userVideo.current.srcObject = null;
            userVideo.current.load(); // Force reload to clear
        }

        // STEP 4: Close peer connection
        if (connectionRef.current) {
            connectionRef.current.close();
            connectionRef.current = null;
        }

        // STEP 5: Clear state
        setStream(undefined);
        setCallEnded(true);
        setCall({ isReceivingCall: false, from: '', name: '', signal: null, isVideo: false });
        setCallAccepted(false);
        setIsCalling(false);
        setOtherUserId('');

        console.log('Call cleanup complete');

        // STEP 6: Auto-refresh after 2 seconds to ensure camera is fully released
        console.log('⚠️ Page will refresh in 2 seconds to release camera/microphone...');
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    };

    return (
        <CallContext.Provider value={{
            call,
            callAccepted,
            callEnded,
            myVideo,
            userVideo,
            stream,
            name,
            setName,
            callUser,
            answerCall,
            leaveCall,
            isCalling
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error("useCall must be used within CallProvider");
    return context;
};
