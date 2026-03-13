// ─────────────────────────────────────────────
//  SkillBarter — Video Call Page
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import Peer from "peerjs";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { socket } from "../services/api";

export default function VideoCallPage({ meetingId }) {
    const t = useTheme();
    const app = useApp();
    const navigate = null; // Unused, app.navigate is used instead

    const [peerId, setPeerId] = useState("");
    const [callStatus, setCallStatus] = useState("Initializing...");
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [remoteUserName, setRemoteUserName] = useState("Partner");

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerInstance = useRef(null);
    const localStreamRef = useRef(null);
    const currentCallRef = useRef(null);

    useEffect(() => {
        if (!app.user || !meetingId) return;

        // 1. Get local media
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // 2. Initialize PeerJS
                const peer = new Peer(app.user._id);

                peer.on("open", (id) => {
                    setPeerId(id);
                    console.log("My peer ID is: " + id);
                    
                    // 3. Join Socket Room
                    app.socket.emit("join-room", meetingId, app.user._id);
                    setCallStatus("Ready — Waiting for partner...");
                });

                peer.on("call", (call) => {
                    console.log("Incoming call from", call.peer);
                    setCallStatus("Connecting...");
                    currentCallRef.current = call;
                    
                    call.answer(stream);
                    
                    call.on("stream", (userVideoStream) => {
                        console.log("Remote stream received");
                        setCallStatus("Connected");
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = userVideoStream;
                        }
                    });

                    call.on("close", () => {
                        setCallStatus("Partner left");
                        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                    });
                });

                // Listen for other users joining via Socket
                app.socket.on("user-connected", (userId) => {
                    console.log("User connected to room:", userId);
                    setCallStatus("Establishing connection...");
                    
                    // CRITICAL: Wait 1 second before initiating call
                    // This gives the "newcomer" time to set up their own Peer instance
                    // and 'call' listener.
                    setTimeout(() => {
                        initiateCall(peer, stream, userId);
                    }, 1500);
                });

                app.socket.on("user-disconnected", (userId) => {
                    console.log("User disconnected from room:", userId);
                    setCallStatus("Partner disconnected");
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                });

                peerInstance.current = peer;
            })
            .catch((err) => {
                console.error("Failed to get local stream", err);
                setCallStatus("Error accessing camera/microphone");
            });

        return () => {
            endCall(false); // Clean up on unmount
            if (app.socket) {
                app.socket.off("user-connected");
                app.socket.off("user-disconnected");
            }
        };
    }, [app.user, meetingId]);

    const initiateCall = (peer, stream, remoteId) => {
        console.log("Initiating call to", remoteId);
        const call = peer.call(remoteId, stream);
        currentCallRef.current = call;

        call.on("stream", (userVideoStream) => {
            setCallStatus("Connected");
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = userVideoStream;
            }
        });

        call.on("close", () => {
            setCallStatus("Partner left");
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        });

        call.on("error", (err) => {
            console.error(err);
            setCallStatus("Call failed");
        });
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = isMuted;
                setIsMuted(!isMuted);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getVideoTracks()[0];
            if (track) {
                track.enabled = isVideoOff;
                setIsVideoOff(!isVideoOff);
            }
        }
    };

    const endCall = (shouldNavigate = true) => {
        if (currentCallRef.current) {
            currentCallRef.current.close();
        }
        
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }

        if (peerInstance.current) {
            peerInstance.current.destroy();
        }

        if (shouldNavigate) {
            app.navigate("home"); 
        }
    };

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#000" }}>
            {/* Header */}
            <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.5)", position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
                <div style={{ color: "#FFF", fontWeight: 600, fontSize: 16 }}>
                    {callStatus} {remoteUserName && `with ${remoteUserName}`}
                </div>
            </div>

            {/* Video Container */}
            <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* Remote Video (Full Screen) */}
                <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    style={{ width: "100%", height: "100%", objectFit: "cover", background: "#111" }} 
                />

                {/* Local Video (PiP) */}
                <div style={{ 
                    position: "absolute", 
                    bottom: 100, 
                    right: 24, 
                    width: 160, 
                    height: 240, 
                    borderRadius: 16, 
                    overflow: "hidden", 
                    border: "2px solid rgba(255,255,255,0.2)",
                    background: "#222",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
                }}>
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted // Local video must be muted
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                </div>
            </div>

            {/* Controls */}
            <div style={{ 
                padding: "24px", 
                display: "flex", 
                justifyContent: "center", 
                gap: 20, 
                background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0
            }}>
                <button 
                    onClick={toggleMute}
                    style={{ 
                        width: 56, height: 56, borderRadius: "50%", 
                        background: isMuted ? "#EF4444" : "rgba(255,255,255,0.2)", 
                        color: "#FFF", border: "none", cursor: "pointer", 
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24,
                        backdropFilter: "blur(10px)"
                    }}>
                    {isMuted ? "🔇" : "🎤"}
                </button>
                <button 
                    onClick={endCall}
                    style={{ 
                        width: 56, height: 56, borderRadius: "50%", 
                        background: "#EF4444", 
                        color: "#FFF", border: "none", cursor: "pointer", 
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24,
                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)"
                    }}>
                    📞
                </button>
                <button 
                    onClick={toggleVideo}
                    style={{ 
                        width: 56, height: 56, borderRadius: "50%", 
                        background: isVideoOff ? "#EF4444" : "rgba(255,255,255,0.2)", 
                        color: "#FFF", border: "none", cursor: "pointer", 
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24,
                        backdropFilter: "blur(10px)"
                    }}>
                    {isVideoOff ? "🚫" : "📹"}
                </button>
            </div>
        </div>
    );
}
