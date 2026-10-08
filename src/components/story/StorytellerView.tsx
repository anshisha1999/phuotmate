import React, { useState } from 'react';
import { Trip, TripPhoto, StoryAIResult } from '../../types/trip';
import { requestAiStoryteller } from '../../services/api';
import { 
  Sparkles, Video, Share2, Copy, Check, Upload, Image as ImageIcon, 
  Clock, Music, Film, Eye, MessageSquare, ChevronRight, AlertCircle, Loader2 
} from 'lucide-react';

interface StorytellerViewProps {
  trip: Trip;
  onUpdateStoryResult: (result: StoryAIResult) => void;
}

export const StorytellerView: React.FC<StorytellerViewProps> = ({
  trip,
  onUpdateStoryResult,
}) => {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>(
    trip.photos.slice(0, 3).map((p) => p.id)
  );
  const [customPhotos, setCustomPhotos] = useState<TripPhoto[]>([]);
  const [bikerNotes, setBikerNotes] = useState(
    'Chuyến đi 3 ngày băng qua đèo dốc hiểm trở, đón bình minh biển mây trên đỉnh núi cùng anh em.'
  );
  const [activeResultTab, setActiveResultTab] = useState<'facebook' | 'reels'>('facebook');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedFb, setCopiedFb] = useState(false);
  const [copiedReels, setCopiedReels] = useState(false);

  // Combine trip preset photos with any custom uploaded photos
  const allAvailablePhotos = [...trip.photos, ...customPhotos];

  const handleTogglePhoto = (id: string) => {
    if (selectedPhotos.includes(id)) {
      if (selectedPhotos.length <= 1) return; // Keep at least 1
      setSelectedPhotos(selectedPhotos.filter((p) => p !== id));
    } else {
      if (selectedPhotos.length >= 5) {
        alert('Tối đa chọn 5 bức ảnh để AI phân tích tốt nhất!');
        return;
      }
      setSelectedPhotos([...selectedPhotos, id]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).slice(0, 3).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        const newPhoto: TripPhoto = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          url: base64Url,
          base64: base64Url,
          mimeType: file.type || 'image/jpeg',
          caption: file.name,
        };
        setCustomPhotos((prev) => [newPhoto, ...prev]);
        setSelectedPhotos((prev) => [newPhoto.id, ...prev.slice(0, 4)]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGenerateStory = async () => {
    setIsLoading(true);

    // Prepare photos payload
    const photosToAnalyze = allAvailablePhotos
      .filter((p) => selectedPhotos.includes(p.id))
      .map((p) => {
        // If image has base64 use it, otherwise pass placeholder representation
        return {
          base64: p.base64 || 'data:image/jpeg;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          mimeType: p.mimeType || 'image/jpeg',
        };
      });

    try {
      const result = await requestAiStoryteller({
        photos: photosToAnalyze,
        tripTitle: trip.title,
        destination: trip.destination,
        bikerNotes,
      });

      onUpdateStoryResult(result);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      alert('Không thể tạo kịch bản AI lúc này. Vui lòng thử lại!');
    }
  };

  const currentResult = trip.aiStory;

  const handleCopyFacebook = () => {
    if (!currentResult) return;
    const post = currentResult.facebookPost;
    const textToCopy = `${post.title}\n\n${post.hook}\n\n${post.content}\n\n${post.hashtags.join(' ')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedFb(true);
    setTimeout(() => setCopiedFb(false), 2000);
  };

  const handleCopyReels = () => {
    if (!currentResult) return;
    const script = currentResult.reelsScript;
    let text = `🎬 KỊCH BẢN REELS / TIKTOK: ${script.title}\n`;
    text += `⏱️ Thời lượng: ${script.durationSeconds}s | 🎵 Nhạc nền: ${script.recommendedMusic}\n`;
    text += `🔥 HOOK 3 GIÂY ĐẦU: ${script.hook3s}\n\n`;
    text += `--- CÁC PHÂN CẢNH (SCENES) ---\n`;
    script.scenes.forEach((s) => {
      text += `[Cảnh ${s.sceneNumber} - ${s.timeRange}]\n`;
      text += `🎥 Visual góc máy: ${s.visual}\n`;
      text += `🎙️ Voiceover: ${s.voiceover}\n`;
      text += `💬 Chữ màn hình: ${s.onScreenText}\n\n`;
    });
    text += `👉 Call to Action: ${script.callToAction}`;

    navigator.clipboard.writeText(text);
    setCopiedReels(true);
    setTimeout(() => setCopiedReels(false), 2000);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-slate-900 border border-purple-500/30 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/30">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Nhật Ký & Kịch Bản Reels AI
              </h2>
              <span className="px-1.5 py-0.2 text-[9px] bg-purple-500 text-white font-black rounded uppercase">
                Multimodal
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Gemini Flash phân tích 3–5 ảnh chụp ➔ Bài review Facebook & Kịch bản Reels 30–45s
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Photo Selector */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">
              Chọn 3–5 Ảnh Đẹp Trong Chuyến Đi ({selectedPhotos.length}/5 đã chọn)
            </h3>
          </div>

          <label className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 cursor-pointer font-semibold">
            <Upload className="w-3.5 h-3.5" />
            <span>Tải ảnh từ máy</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {allAvailablePhotos.map((photo) => {
            const isSelected = selectedPhotos.includes(photo.id);
            return (
              <div
                key={photo.id}
                onClick={() => handleTogglePhoto(photo.id)}
                className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all group ${
                  isSelected
                    ? 'border-purple-500 scale-102 shadow-lg shadow-purple-500/20'
                    : 'border-slate-800 opacity-60 hover:opacity-90'
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Ảnh phượt'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs shadow">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                {photo.caption && (
                  <span className="absolute bottom-1 left-1 right-1 text-[9px] text-white/90 truncate font-medium px-1">
                    {photo.caption}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Biker Notes Input */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Cảm xúc / Ghi chú của Biker (để AI bắt trúng vibe):
          </label>
          <input
            type="text"
            value={bikerNotes}
            onChange={(e) => setBikerNotes(e.target.value)}
            placeholder="Vd: 3 ngày đổ đèo sương mù buốt giá, đón hoàng hôn cùng bạn thân..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateStory}
          disabled={isLoading || selectedPhotos.length === 0}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-98 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Gemini Flash Đang Soi Ảnh & Lên Kịch Bản...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Phân Tích {selectedPhotos.length} Ảnh ➔ Xuất Nhật Ký & Kịch Bản Reels</span>
            </>
          )}
        </button>
      </div>

      {/* Output Content */}
      {currentResult && (
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          {/* Themes detected */}
          {currentResult.detectedThemes?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">AI Nhận diện:</span>
              {currentResult.detectedThemes.map((theme, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20"
                >
                  #{theme}
                </span>
              ))}
            </div>
          )}

          {/* Sub tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveResultTab('facebook')}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                activeResultTab === 'facebook'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📘 1. Bài Review Facebook
            </button>
            <button
              onClick={() => setActiveResultTab('reels')}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                activeResultTab === 'reels'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎬 2. Kịch Bản Reels/TikTok (30-45s)
            </button>
          </div>

          {/* Facebook Post View */}
          {activeResultTab === 'facebook' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Bản Thảo Đăng Mạng Xã Hội
                </span>
                <button
                  onClick={handleCopyFacebook}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition active:scale-95"
                >
                  {copiedFb ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFb ? 'Đã sao chép' : 'Sao chép bài viết'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 text-xs leading-relaxed">
                <h4 className="font-extrabold text-white text-sm leading-snug">
                  {currentResult.facebookPost.title}
                </h4>

                <p className="text-amber-300/90 font-medium italic border-l-2 border-amber-400 pl-2">
                  "{currentResult.facebookPost.hook}"
                </p>

                <div className="text-slate-200 whitespace-pre-line space-y-2">
                  {currentResult.facebookPost.content}
                </div>

                <div className="pt-2 flex flex-wrap gap-1.5 border-t border-slate-800 text-blue-400 font-semibold text-[11px]">
                  {currentResult.facebookPost.hashtags.map((h, i) => (
                    <span key={i}>{h}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reels / TikTok Script View */}
          {activeResultTab === 'reels' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {currentResult.reelsScript.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1 text-purple-400">
                      <Clock className="w-3 h-3" />
                      {currentResult.reelsScript.durationSeconds} giây
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-pink-400 truncate">
                      <Music className="w-3 h-3" />
                      {currentResult.reelsScript.recommendedMusic}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCopyReels}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow transition active:scale-95 shrink-0"
                >
                  {copiedReels ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReels ? 'Đã chép' : 'Sao chép kịch bản'}</span>
                </button>
              </div>

              {/* 3s Hook Highlight */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/15 to-transparent border border-red-500/30 text-xs">
                <span className="px-1.5 py-0.5 bg-red-500 text-white font-black text-[9px] rounded uppercase mr-2">
                  3S HOOK GIỮ CHÂN
                </span>
                <span className="text-white font-semibold">
                  {currentResult.reelsScript.hook3s}
                </span>
              </div>

              {/* Scenes Table / Cards */}
              <div className="space-y-2">
                {currentResult.reelsScript.scenes.map((scene) => (
                  <div
                    key={scene.sceneNumber}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-400 uppercase">
                        Phân cảnh {scene.sceneNumber}
                      </span>
                      <span className="font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {scene.timeRange}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-slate-300">
                        <strong className="text-slate-400">🎥 Góc máy:</strong> {scene.visual}
                      </div>
                      <div className="text-slate-200">
                        <strong className="text-purple-400">🎙️ Voiceover:</strong> {scene.voiceover}
                      </div>
                      <div className="text-amber-300/90">
                        <strong className="text-slate-400">💬 Text màn hình:</strong> {scene.onScreenText}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Call to action */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400">Kêu gọi hành động (CTA):</span>
                <span className="font-bold text-white text-right">
                  {currentResult.reelsScript.callToAction}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
