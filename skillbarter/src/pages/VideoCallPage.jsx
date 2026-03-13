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

    const [peerId, setPeerId] = useState("");
    const [partnerReady, setPartnerReady] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
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

        let heartbeatInterval = null;
        
        // 1. Get local media
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Cleanup any existing instance
                if (peerInstance.current) {
                    peerInstance.current.destroy();
                }

                // 2. Initialize PeerJS with a TRULY unique ID to avoid collisions
                // Format: userId_meetingId_randomString
                const mySeed = Math.random().toString(36).substr(2, 6);
                const myPeerId = `${app.user._id}_${meetingId}_${mySeed}`;
                
                const peer = new Peer(myPeerId, {
                    config: {
                        iceServers: [
                            { urls: "stun:stun.l.google.com:19302" },
                            { urls: "stun:stun1.l.google.com:19302" },
                            { urls: "stun:stun2.l.google.com:19302" },
                            { urls: "stun:stun3.l.google.com:19302" },
                        ],
                    },
                    debug: 1 // Only errors
                });

                peer.on("open", (id) => {
                    setPeerId(id);
                    console.log("🚀 My Virtual Session ID:", id);
                    
                    // 3. Join Socket Room and signal readiness
                    app.socket.emit("join-room", meetingId, app.user._id);
                    app.socket.emit("peer-ready", meetingId, id);
                    
                    // 4. Start Redundant Heartbeat
                    heartbeatInterval = setInterval(() => {
                        if (!partnerReady) {
                            app.socket.emit("peer-ready", meetingId, id);
                        }
                    }, 2000); 

                    setCallStatus("Ready — Waiting for partner...");
                });

                peer.on("error", (err) => {
                    console.error("❌ PeerJS Error:", err.type, err);
                    if (err.type === "unavailable-id") {
                        setCallStatus("ID Collision — Retrying...");
                        setTimeout(() => setRetryCount(c => c + 1), 1000);
                    } else if (err.type === "peer-unavailable") {
                        // Just wait for next heartbeat
                    } else {
                        setCallStatus(`Error: ${err.type}`);
                    }
                });

                peer.on("call", (call) => {
                    console.log("📞 Incoming call from partner");
                    setCallStatus("Answering call...");
                    currentCallRef.current = call;
                    
                    call.answer(stream);
                    
                    call.on("stream", (userVideoStream) => {
                        console.log("✅ Remote stream linked");
                        setCallStatus("Connected");
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = userVideoStream;
                        }
                    });

                    call.on("error", (err) => {
                        console.error("Stream err:", err);
                        setCallStatus("Video stream failed");
                    });

                    call.on("close", () => {
                        setCallStatus("Partner left");
                        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                        setPartnerReady(false);
                    });
                });

                app.socket.on("peer-ready", (remotePeerId) => {
                    if (remotePeerId === myPeerId) return;
                    if (partnerReady) return; 

                    console.log("📡 Partner found at:", remotePeerId);
                    setPartnerReady(true);
                    setCallStatus("Establishing encrypted line...");
                    
                    // Always try to call if we hear from them
                    // We add a slight delay based on UserID to avoid "simultaneous" calls
                    const delay = app.user._id < (remotePeerId.split('_')[0]) ? 500 : 1500;
                    
                    setTimeout(() => {
                        initiateCall(peer, stream, remotePeerId);
                    }, delay);
                });

                app.socket.on("user-connected", (userId) => {
                    if (userId !== app.user._id && peer.open) {
                        app.socket.emit("peer-ready", meetingId, myPeerId);
                    }
                });

                app.socket.on("user-disconnected", (userId) => {
                    setCallStatus("Partner disconnected");
                    setPartnerReady(false);
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                });

                peerInstance.current = peer;
            })
            .catch((err) => {
                console.error("Failed to get local stream", err);
                setCallStatus("Error: No camera access");
            });

        return () => {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            endCall(false);
            if (app.socket) {
                app.socket.off("user-connected");
                app.socket.off("peer-ready");
                app.socket.off("user-disconnected");
            }
        };
    }, [app.user._id, meetingId, retryCount]);

    const initiateCall = (peer, stream, remoteId) => {
        console.log("Initiating call to", remoteId);
        const call = peer.call(remoteId, stream);
        currentCallRef.current = call;

        call.on("stream", (userVideoStream) => {
            console.log("Initiator: Remote stream received");
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
            console.error("Initiator err:", err);
            setCallStatus("Connection failed");
        });
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => t.enabled = isMuted);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => t.enabled = isVideoOff);
            setIsVideoOff(!isVideoOff);
        }
    };

    const endCall = (shouldNavigate = true) => {
        if (currentCallRef.current) currentCallRef.current.close();
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        if (peerInstance.current) peerInstance.current.destroy();
        if (shouldNavigate) app.navigate("home");
    };

    return (
        <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", background: "#060606", position: "fixed", top: 0, left: 0, zIndex: 9999 }}>
            
            {/* Header Badge */}
            <div style={{ 
                position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", 
                zIndex: 10, padding: "8px 24px", borderRadius: 99,
                background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)", color: "#FFF",
                display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
            }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: callStatus === "Connected" ? "#10B981" : "#FFD600", boxShadow: `0 0 10px ${callStatus === "Connected" ? "#10B981" : "#FFD600"}` }} />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.02em" }}>{callStatus}</span>
            </div>

            {/* Video Viewport */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* Remote Stream */}
                <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000" }} 
                />
                
                {/* Waiting UI if not connected */}
                {callStatus !== "Connected" && (
                    <div style={{ position: "absolute", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
                        <div style={{ fontSize: 14 }}>Waiting for stream...</div>
                    </div>
                )}

                {/* Local PiP */}
                <div style={{ 
                    position: "absolute", bottom: 120, right: 32, 
                    width: 140, height: 210, borderRadius: 20, 
                    overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)",
                    background: "#111", boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                }}>
                    <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: 8, left: 12, fontSize: 10, color: "#FFF", fontWeight: 600, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>You</div>
                </div>
            </div>

            {/* Premium Controls */}
            <div style={{ 
                height: 100, display: "flex", justifyContent: "center", alignItems: "center", 
                gap: 24, paddingBottom: 20, zIndex: 10
            }}>
                <ControlBtn onClick={toggleMute} icon={isMuted ? "🔇" : "🎤"} active={!isMuted} color={isMuted ? "#EF4444" : "rgba(255,255,255,0.1)"} />
                <ControlBtn onClick={endCall} icon="📞" color="#EF4444" size={64} />
                <ControlBtn onClick={toggleVideo} icon={isVideoOff ? "🚫" : "📹"} active={!isVideoOff} color={isVideoOff ? "#EF4444" : "rgba(255,255,255,0.1)"} />
                <ControlBtn onClick={() => setRetryCount(c => c + 1)} icon="🔄" color="rgba(255,255,255,0.1)" />
            </div>
        </div>
    );
}

function ControlBtn({ onClick, icon, color, size = 52, active = true }) {
    return (
        <button 
            onClick={onClick}
            style={{ 
                width: size, height: size, borderRadius: "50%", 
                background: color, color: "#FFF", border: "none", cursor: "pointer", 
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: size * 0.4, backdropFilter: "blur(12px)",
                transition: "all 0.2s",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                opacity: active ? 1 : 0.8
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
            {icon}
        </button>
    );
}
