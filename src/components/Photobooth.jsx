import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const Photobooth = () => {
  const webcamRef = useRef(null);
  const stickerRef = useRef(null);
  const stickerImageRef = useRef(null);
  const heartImageRef = useRef(null);

  const [selectedFilter, setSelectedFilter] = useState("none");
  const [stickDhruv, setStickDhruv] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [stickerPos, setStickerPos] = useState({ x: 0, y: 0 });
  const [stickerSize, setStickerSize] = useState(340);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const filters = {
    none: "",
    sepia: "filter sepia",
    bw: "filter grayscale",
    cool: "filter hue-rotate-90",
    warm: "filter warm",
    heart: "filter heart",
    dream: "filter dream",
    vintage: "filter vintage",
    coolblue: "filter coolblue",
    sunset: "filter sunset",
  };

  const cssFilterEquivalent = (filter) => {
    switch (filter) {
      case "sepia":
        return "sepia(1)";
      case "bw":
        return "grayscale(1)";
      case "cool":
        return "hue-rotate(90deg)";
      case "warm":
        return "contrast(1.25) brightness(1.1)";
      case "heart":
        return "hue-rotate(-30deg) saturate(2.5) brightness(1.3) contrast(0.9)";
      case "dream":
        return "blur(1px) brightness(1.2) saturate(1.3)";
      case "vintage":
        return "sepia(0.8) contrast(0.9) brightness(0.9)";
      case "coolblue":
        return "hue-rotate(200deg) contrast(1.2)";
      case "sunset":
        return "hue-rotate(-40deg) brightness(1.1) saturate(1.3)";
      default:
        return "none";
    }
  };

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/stickers/sticker3.png";
    img.onload = () => {
      stickerImageRef.current = img;
    };

    const heartImg = new Image();
    heartImg.crossOrigin = "anonymous";
    heartImg.src = "/stickers/heart.png";
    heartImg.onload = () => {
      heartImageRef.current = heartImg;
    };
  }, []);

  const generateHearts = (count) => {
    const hearts = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 420; // To avoid overflowing edge (480 - 60)
      const y = Math.random() * 300; // (360 - 60)
      hearts.push({
        id: i,
        x,
        y,
        delay: Math.random() * 3 + "s",
        duration: 2 + Math.random() * 2 + "s",
      });
    }
    return hearts;
  };

  const [hearts] = useState(generateHearts(10));

  const capturePhoto = () => {
    const video = webcamRef.current?.video;
    if (!video) return;

    const canvas = document.createElement("canvas");
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext("2d");

    // Draw mirrored webcam video on canvas
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.filter = cssFilterEquivalent(selectedFilter);
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    ctx.restore();

    if (stickDhruv && stickerImageRef.current) {
      const displayRect = video.getBoundingClientRect();
      const scaleX = videoWidth / displayRect.width;
      const scaleY = videoHeight / displayRect.height;

      const stickerX = stickerPos.x * scaleX;
      const stickerY = stickerPos.y * scaleY;
      const stickerW = stickerSize * scaleX;
      const stickerH = stickerSize * scaleY;

      // Apply the same filter before drawing sticker
      ctx.filter = cssFilterEquivalent(selectedFilter);
      ctx.drawImage(
        stickerImageRef.current,
        stickerX,
        stickerY,
        stickerW,
        stickerH
      );

      // Reset filter after drawing sticker
      ctx.filter = "none";
    }

    if (selectedFilter === "heart" && heartImageRef.current) {
      hearts.forEach((heart) => {
        ctx.drawImage(
          heartImageRef.current,
          canvas.width - heart.x - 60,
          heart.y,
          60,
          60
        );
      });
    }

    const finalImg = canvas.toDataURL("image/png");
    setCapturedImages((prev) => [...prev, finalImg]);
  };

  const handleMouseDown = (e) => {
    if (!stickerRef.current) return;
    setDragging(true);
    const rect = stickerRef.current.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e) => {
    if (!dragging || !webcamRef.current?.video) return;
    const container = webcamRef.current.video.getBoundingClientRect();
    const stickerWidth = stickerSize;
    const stickerHeight = stickerSize;

    let newX = e.clientX - container.left - offset.x;
    let newY = e.clientY - container.top - offset.y;

    newX = Math.max(0, Math.min(container.width - stickerWidth, newX));
    newY = Math.max(0, Math.min(container.height - stickerHeight, newY));

    setStickerPos({ x: newX, y: newY });
  };

  const handleMouseUp = () => setDragging(false);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, offset]);

  const downloadImage = (imgDataUrl, index) => {
    const a = document.createElement("a");
    a.href = imgDataUrl;
    a.download = `photo-booth-${index + 1}.png`;
    a.click();
  };

  useEffect(() => {
    const video = webcamRef.current?.video;
    if (video) {
      video.style.filter = cssFilterEquivalent(selectedFilter);
    }
  }, [selectedFilter]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 space-y-6">
      <h1 className="text-3xl font-bold">📸 Dhruv's Photo Booth</h1>

      <div className="relative border-4 border-dashed border-gray-400 rounded-xl overflow-hidden w-fit">
        <div style={{ position: "relative", width: "480px", height: "360px" }}>
          <div
            className="webcam-mirror"
            style={{
              transform: "scaleX(-1)",
              width: "100%",
              height: "100%",
            }}
          >
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/png"
              width={480}
              height={360}
              className="rounded"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              videoConstraints={{
                width: 480,
                height: 360,
                facingMode: "user",
              }}
            />
          </div>

          {/* Stickers and hearts stay as-is, outside the mirrored webcam */}
          {stickDhruv && (
            <img
              src="/stickers/sticker3.png"
              alt="Sticker"
              ref={stickerRef}
              style={{
                position: "absolute",
                top: stickerPos.y,
                left: stickerPos.x,
                width: `${stickerSize}px`,
                height: `${stickerSize}px`,
                cursor: "move",
                userSelect: "none",
                pointerEvents: "auto",
                filter: cssFilterEquivalent(selectedFilter),
              }}
              draggable={false}
              onMouseDown={handleMouseDown}
            />
          )}

          {selectedFilter === "heart" &&
            hearts.map((heart) => (
              <img
                key={heart.id}
                src="/stickers/heart.png"
                alt="heart"
                className="heart"
                style={{
                  position: "absolute",
                  top: `${heart.y}px`,
                  left: `${heart.x}px`,
                  animationDelay: heart.delay,
                  width: "60px",
                  height: "60px",
                }}
              />
            ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {Object.keys(filters).map((key) => (
          <button
            key={key}
            onClick={() => setSelectedFilter(key)}
            className={`px-3 py-1 rounded-md border ${
              selectedFilter === key
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-800"
            } hover:shadow`}
          >
            {key.toUpperCase()}
          </button>
        ))}

        <button
          onClick={() => setStickDhruv(!stickDhruv)}
          className={`px-3 py-1 rounded-md border ${
            stickDhruv ? "bg-green-600 text-white" : "bg-white text-gray-800"
          } hover:shadow`}
        >
          {stickDhruv ? "Remove Dhruv" : "Stick Dhruv 👦🏽"}
        </button>

        <button
          onClick={capturePhoto}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Capture 📷
        </button>
      </div>

      {stickDhruv && (
        <div className="mt-2 flex items-center space-x-2">
          <label className="text-sm font-medium">Sticker Size:</label>
          <input
            type="range"
            min="40"
            max="340"
            value={stickerSize}
            onChange={(e) => setStickerSize(parseInt(e.target.value))}
            className="w-48"
          />
        </div>
      )}

      {capturedImages.length > 0 && (
        <div className="mt-6 w-full overflow-x-auto">
          <div className="flex space-x-4">
            {capturedImages.map((img, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <img
                  src={img}
                  alt={`Captured ${index + 1}`}
                  width={160}
                  height={120}
                  className="border border-gray-300 shadow-lg rounded-md"
                />
                <button
                  onClick={() => downloadImage(img, index)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Download ⬇️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Photobooth;
