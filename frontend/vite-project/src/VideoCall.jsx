import React, { useEffect, useRef, useState, useCallback } from "react";

import './VideoCall.css';
import SimplePeer from "simple-peer";

const VideoCall = ({ socket, roomId, userName, joined }) => {
  const [peers, setPeers] = useState([]); // [{ peerId, peer, stream, userName, cameraOn, micOn }]
  const [myStream, setMyStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef();
  const peersRef = useRef([]);
  const [micVolume, setMicVolume] = useState(0); // 0 to 1

  // Helper: update peer state
  const updatePeerState = (peerId, updates) => {
    setPeers((prev) => prev.map(p => p.peerId === peerId ? { ...p, ...updates } : p));
  };

  // Get media stream
  const getMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: cameraOn, audio: micOn });
      setMyStream(stream);
      return stream;
    } catch (err) {
      setMyStream(null);
      return null;
    }
  }, [cameraOn, micOn]);

  // Toggle camera/mic
  const toggleCamera = async () => {
    setCameraOn((prev) => !prev);
  };
  const toggleMic = async () => {
    setMicOn((prev) => !prev);
  };

  // Draggable logic
  const onMouseDown = (e) => {
    setDragging(true);
    setOffset({ x: e.clientX - panelPos.x, y: e.clientY - panelPos.y });
  };
  const onMouseMove = (e) => {
    if (dragging) {
      setPanelPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };
  const onMouseUp = () => setDragging(false);

  // Setup/cleanup event listeners for dragging
  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    } else {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, onMouseMove]);

  // Join/leave call logic
  useEffect(() => {
    if (!joined || !roomId || !userName) return;
    let cleanup = false;
    let localStream = null;
    let myPeerId = socket.id;
    let peerConnections = {};

    // Join call room
    socket.emit("join-call", { roomId, userName });

    // Get local media
    getMedia().then((stream) => {
      if (cleanup) return;
      localStream = stream;
      setMyStream(stream);
    });

    // Handle new user joining
    socket.on("user-joined-call", ({ userName: remoteName, socketId }) => {
      if (socketId === myPeerId) return;
      const peer = new SimplePeer({ initiator: true, trickle: false, stream: myStream });
      peer.on("signal", (signal) => {
        socket.emit("signal", { roomId, signal, to: socketId });
      });
      peer.on("stream", (stream) => {
        setPeers((prev) => [...prev, { peerId: socketId, peer, stream, userName: remoteName, cameraOn: true, micOn: true }]);
      });
      peerConnections[socketId] = peer;
    });

    // Handle receiving signal
    socket.on("signal", ({ signal, from }) => {
      let peer = peerConnections[from];
      if (!peer) {
        peer = new SimplePeer({ initiator: false, trickle: false, stream: myStream });
        peerConnections[from] = peer;
        peer.on("signal", (signal) => {
          socket.emit("signal", { roomId, signal, to: from });
        });
        peer.on("stream", (stream) => {
          setPeers((prev) => [...prev, { peerId: from, peer, stream, userName: "", cameraOn: true, micOn: true }]);
        });
      }
      peer.signal(signal);
    });

    // Handle user leaving
    socket.on("user-left-call", ({ socketId }) => {
      setPeers((prev) => prev.filter((p) => p.peerId !== socketId));
      if (peerConnections[socketId]) {
        peerConnections[socketId].destroy();
        delete peerConnections[socketId];
      }
    });

    // Cleanup on unmount
    return () => {
      cleanup = true;
      socket.emit("leave-call", { roomId });
      Object.values(peerConnections).forEach((peer) => peer.destroy());
      setPeers([]);
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line
  }, [joined, roomId, userName, cameraOn, micOn]);

  // Audio analysis for local mic
  useEffect(() => {
    let audioContext, analyser, dataArray, source;
    if (micOn && myStream) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      source = audioContext.createMediaStreamSource(myStream);
      source.connect(analyser);
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(dataArray);
        // Calculate RMS (root mean square) for volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          let val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        setMicVolume(Math.sqrt(sum / dataArray.length));
        if (micOn) requestAnimationFrame(tick);
      };
      tick();
    } else {
      setMicVolume(0);
    }
    return () => {
      if (audioContext) audioContext.close();
    };
  }, [micOn, myStream]);

  // UI for each video
  const renderVideo = (stream, label, isMe, camOn, micOn) => (
    <div className="video-tile">
      {camOn && stream ? (
        <video
          ref={(ref) => {
            if (ref) {
              ref.srcObject = stream;
              ref.play();
            }
          }}
          muted={isMe}
          autoPlay
        />
      ) : (
        <div className="video-placeholder">{label[0] || '?'}</div>
      )}
      <div className="video-label">
        {label} {camOn ? "📷" : "🚫"} {micOn ? (
          <>
            🎤
            {isMe && (
              <span className="mic-volume-bar">
                <span
                  className="mic-volume-fill"
                  style={{ width: `${Math.min(100, Math.round(micVolume * 100))}%` }}
                />
              </span>
            )}
          </>
        ) : "🔇"}
      </div>
    </div>
  );

  return (
    <div
      className="video-call-panel"
      ref={panelRef}
      style={{ left: panelPos.x, top: panelPos.y }}
    >
      <div className="video-call-header" onMouseDown={onMouseDown}>
        Video Call
      </div>
      <div className="video-call-controls">
        <button onClick={toggleCamera}>{cameraOn ? "Turn Camera Off" : "Turn Camera On"}</button>
        <button onClick={toggleMic}>{micOn ? "Mute" : "Unmute"}</button>
      </div>
      <div className="video-call-videos">
        {renderVideo(myStream, userName || "Me", true, cameraOn, micOn)}
        {peers.map((p) =>
          renderVideo(p.stream, p.userName || p.peerId.slice(0, 6), false, p.cameraOn, p.micOn)
        )}
      </div>
    </div>
  );
};

export default VideoCall; 