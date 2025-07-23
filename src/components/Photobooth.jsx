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
  const [stickerSize, setStickerSize] = useState(300);
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

  const bgColors = {
    none: "bg-pink-100 text-pink-600",
    sepia: "bg-rose-100 text-rose-700",
    bw: "bg-gray-100 text-gray-700",
    cool: "bg-indigo-100 text-indigo-700",
    warm: "bg-purple-200 text-purple-800",
    dream: "bg-pink-100 text-pink-600",
    vintage: "bg-rose-200 text-rose-800",
    sunset: "bg-pink-200 text-rose-700",
    heart: "bg-pink-100 text-pink-600", // optional
    coolblue: "bg-blue-100 text-blue-700", // optional
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

  const [hearts] = useState(generateHearts(6));

  const capturePhoto = () => {
    const video = webcamRef.current?.video;
    if (!video) return;

    const canvas = document.createElement("canvas");

    // Force canvas size to 480x360 for consistency
    const canvasWidth = 480;
    const canvasHeight = 360;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    // Draw mirrored video
    ctx.save();
    ctx.translate(canvasWidth, 0);
    ctx.scale(-1, 1);
    ctx.filter = cssFilterEquivalent(selectedFilter);
    ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);
    ctx.restore();

    // Draw sticker
    if (stickDhruv && stickerImageRef.current) {
      const displayRect = video.getBoundingClientRect();
      const scaleX = canvasWidth / displayRect.width;
      const scaleY = canvasHeight / displayRect.height;

      const stickerX = stickerPos.x * scaleX;
      const stickerY = stickerPos.y * scaleY;
      const stickerW = stickerSize * scaleX;
      const stickerH = stickerSize * scaleY;

      ctx.filter = cssFilterEquivalent(selectedFilter);
      ctx.drawImage(
        stickerImageRef.current,
        stickerX,
        stickerY,
        stickerW,
        stickerH
      );
      ctx.filter = "none";
    }

    // Draw hearts (if selected)
    if (selectedFilter === "heart" && heartImageRef.current) {
      hearts.forEach((heart) => {
        ctx.drawImage(
          heartImageRef.current,
          canvasWidth - heart.x - 60,
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
  const handleTouchStart = (e) => {
    if (!stickerRef.current) return;
    setDragging(true);
    const rect = stickerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    setOffset({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
  };

  const handleTouchMove = (e) => {
    if (!dragging || !webcamRef.current?.video) return;
    const touch = e.touches[0];
    const container = webcamRef.current.video.getBoundingClientRect();
    const stickerWidth = stickerSize;
    const stickerHeight = stickerSize;

    let newX = touch.clientX - container.left - offset.x;
    let newY = touch.clientY - container.top - offset.y;

    newX = Math.max(0, Math.min(container.width - stickerWidth, newX));
    newY = Math.max(0, Math.min(container.height - stickerHeight, newY));

    setStickerPos({ x: newX, y: newY });
  };

  const handleTouchEnd = () => setDragging(false);

  useEffect(() => {
    const video = webcamRef.current?.video;
    if (video) {
      video.style.filter = cssFilterEquivalent(selectedFilter);
    }
  }, [selectedFilter]);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-[url('./src/assets/background.png')] p-4 space-y-6 bg-cover bg-center bg-no-repeat font-[chillax]">
      <h1 className="inline-flex items-center gap-2 px-6 py-3 bg-pink-200 text-pink-900 text-2xl sm:text-7xl font-bold rounded-full shadow-sm font-[bitterRose]">
        <span className="text-3xl">
          <img src="/src/assets/camera.png" alt="" className="w-18 h-18" />
        </span>{" "}
        DP's Photo Booth
      </h1>

      <div className="relative w-full max-w-[480px] aspect-[4/3] rounded-3xl bg-[#ffd5d8] shadow-2xl overflow-hidden">
        <div className="absolute inset-0 transform scale-x-[-1] border-1 border-pink-300 rounded-2xl  overflow-hidden">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/png"
            className="w-full h-full object-cover"
            videoConstraints={{
              width: 480,
              height: 360,
              facingMode: "user",
            }}
          />
        </div>

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
              touchAction: "none",
            }}
            draggable={false}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        )}

        {selectedFilter === "heart" &&
          hearts.map((heart) => (
            <img
              key={heart.id}
              src="/stickers/heart.png"
              alt="heart"
              className="heart absolute w-[60px] h-[60px]"
              style={{
                top: `${heart.y}px`,
                left: `${heart.x}px`,
                animationDelay: heart.delay,
              }}
            />
          ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-full">
        {Object.keys(filters).map((key) => {
          const selectedBg = "ring-2 ring-pink-400";

          return (
            <button
              key={key}
              onClick={() => setSelectedFilter(key)}
              className={`px-4 py-2 text-sm font-medium rounded-full shadow-sm transition-all duration-200
          ${bgColors[key] || "bg-white text-gray-800"}
          ${selectedFilter === key ? selectedBg : ""}
        `}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={() => setStickDhruv(!stickDhruv)}
          className={`px-5 py-2 rounded-full font-semibold text-sm transition-all duration-300 shadow-md
    ${
      stickDhruv
        ? "bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white hover:shadow-lg"
        : "bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 text-white hover:shadow-lg"
    }
  `}
        >
          {stickDhruv ? "💨 Remove Dhruv" : "Stick Dhruv 👦🏽"}
        </button>

        <button
          onClick={capturePhoto}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Capture 📷
        </button>
      </div>

      {stickDhruv && (
        <div className="w-full max-w-xs flex flex-col items-center gap-3 p-4 bg-pink-50 rounded-xl shadow-sm">
          <label className="text-sm font-medium text-pink-700">
            Sticker Size
          </label>
          <input
            type="range"
            min="40"
            max="300"
            value={stickerSize}
            onChange={(e) => setStickerSize(parseInt(e.target.value))}
            className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
          />
        </div>
      )}

      {capturedImages.length > 0 && (
        <div className="mt-6 w-full overflow-x-auto px-2">
          <div className="flex space-x-4 w-max">
            {capturedImages.map((img, index) => (
              <div
                key={index}
                className="flex flex-col items-center space-y-2 min-w-[160px]"
              >
                <img
                  src={img}
                  alt={`Captured ${index + 1}`}
                  className="w-40 aspect-[4/3] object-contain border border-gray-300 shadow-lg rounded-md bg-white"
                />
                <button
                  onClick={() => downloadImage(img, index)}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Download ⬇️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h1>Made with ❤️ by Dhruv</h1>
      </div>
    </div>
  );
};

export default Photobooth;
