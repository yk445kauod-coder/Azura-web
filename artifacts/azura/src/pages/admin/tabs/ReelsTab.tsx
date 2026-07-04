import React, { useState } from "react";
import { Film, ImageIcon, Video, CheckCircle, Plus, Pin, Trash2 } from "lucide-react";
import { Reel } from "../types";
import { VideoProvider, parseVideoUrl, getProviderIcon, getProviderName } from "@/lib/videoProviders";
import { compressToBase64 } from "@/lib/imageUtils";
import { swalError, swalSuccess, swalLoading, swalClose } from "@/lib/swal";
import { push, ref, db } from "@/lib/firebase";
import { smartSet, smartUpdate, smartRemove } from "@/lib/dbWrapper";
import { fileToChunks, getChunksSizeMB, saveToIndexedDB } from "@/lib/chunkedVideo";

interface ReelsTabProps {
  tr: (en: string, ar: string) => string;
  reels: Reel[];
  togglePin: (reel: Reel) => void;
  deleteReel: (reel: Reel) => void;
}

export const ReelsTab: React.FC<ReelsTabProps> = ({ tr, reels, togglePin, deleteReel }) => {
  const [newReel, setNewReel] = useState<{
    image: string; caption: string; captionAr: string; mediaType: "image" | "video"; videoUrl: string; videoProvider: VideoProvider | undefined; videoThumbnail: string; videoChunks?: string[]; chunkCount?: number;
  }>({
    image: "", caption: "", captionAr: "", mediaType: "image" as "image" | "video", videoUrl: "", videoProvider: undefined as VideoProvider | undefined, videoThumbnail: "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const inp = "input-field px-3 py-2.5 text-sm";

  const createReel = async () => {
    if (!newReel.image || (!newReel.caption && !newReel.captionAr)) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      const r = push(ref(db, "reels"));
      const reelId = r.key!;

      await smartSet(`reels/${reelId}`, {
        image: newReel.image,
        caption: newReel.caption,
        captionAr: newReel.captionAr,
        likes: 0,
        createdAt: Date.now(),
        authorName: "Admin",
        mediaType: newReel.mediaType,
        videoUrl: newReel.videoUrl || "",
        videoProvider: newReel.videoProvider || "direct",
        videoThumbnail: newReel.videoThumbnail || "",
        chunkCount: newReel.chunkCount || 0,
      });

      if (newReel.videoChunks && newReel.videoChunks.length > 0) {
        const fullVideo = newReel.videoChunks.join("");
        await saveToIndexedDB(`reel_${reelId}`, fullVideo);

        const chunksRef = ref(db, `reelChunks/${reelId}`);
        const batchSize = 5;
        for (let i = 0; i < newReel.videoChunks.length; i += batchSize) {
          const batch: Record<string, string> = {};
          const end = Math.min(i + batchSize, newReel.videoChunks.length);
          for (let j = i; j < end; j++) { batch[`chunk_${j}`] = newReel.videoChunks![j]; }
          await smartUpdate(`reelChunks/${reelId}`, batch);
          setUploadProgress(Math.round(((i + batchSize) / newReel.videoChunks!.length) * 90));
        }
      } else if (newReel.mediaType === "video" && newReel.videoUrl && newReel.videoProvider !== "direct") {
        await saveToIndexedDB(`reel_${reelId}`, newReel.videoUrl);
      }

      setUploadProgress(100);
      swalSuccess(tr("Reel created!", "تم إنشاء المنشور!"));
      setNewReel({ image: "", caption: "", captionAr: "", mediaType: "image", videoUrl: "", videoProvider: undefined, videoThumbnail: "" });
    } catch (err) {
      console.error(err);
      swalError(tr("Failed to create reel", "فشل في إنشاء المنشور"));
    }
    setUploading(false);
  };

  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Film size={18} className="text-primary"/> {tr("Create New Post","إنشاء منشور جديد")}
        </h3>

        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setNewReel({ ...newReel, mediaType: 'image' })}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${newReel.mediaType === 'image' ? 'btn-primary' : 'bg-muted'}`}
            >
              <ImageIcon size={16} className="inline mr-1"/> {tr("Image","صورة")}
            </button>
            <button
              onClick={() => setNewReel({ ...newReel, mediaType: 'video' })}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${newReel.mediaType === 'video' ? 'btn-primary' : 'bg-muted'}`}
            >
              <Video size={16} className="inline mr-1"/> {tr("Video","فيديو")}
            </button>
          </div>

          {newReel.mediaType === 'image' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-semibold">{tr("Image URL","رابط الصورة")}</label>
                <input
                  type="text"
                  className={inp}
                  placeholder={tr("Paste image URL or upload below","الصق رابط الصورة أو ارفع من الأسفل")}
                  value={newReel.image}
                  onChange={(e) => setNewReel({ ...newReel, image: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">{tr("Or Upload Image","أو ارفع صورة")}</label>
                <div className="border-2 border-dashed border-muted rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="reel-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const base64 = await compressToBase64(file);
                        setNewReel({ ...newReel, image: base64 });
                      } catch (err) {
                        console.error(err);
                        swalError(tr("Failed to upload image", "فشل في رفع الصورة"));
                      }
                      setUploading(false);
                    }}
                  />
                  <label htmlFor="reel-upload" className="cursor-pointer">
                    <ImageIcon size={24} className="mx-auto text-muted-foreground mb-2"/>
                    <p className="text-xs text-muted-foreground">
                      {uploading ? tr("Uploading...", "جاري الرفع...") : tr("Click to upload image", "انقر لرفع صورة")}
                    </p>
                    {newReel.image && newReel.image.startsWith("data:") && (
                      <img src={newReel.image} className="w-16 h-16 object-cover rounded-lg mx-auto mt-2" loading="lazy"/>
                    )}
                  </label>
                </div>
              </div>
            </>
          )}

          {newReel.mediaType === 'video' && (
            <div className="space-y-3">
              <label className="text-sm font-semibold">{tr("Video URL","رابط الفيديو")}</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder={tr("Paste video URL here...", "الصق رابط الفيديو هنا...")}
                  className={`${inp} flex-1`}
                  value={newReel.videoUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setNewReel({ ...newReel, videoUrl: url });
                    if (url) {
                      const parsed = parseVideoUrl(url);
                      setNewReel(prev => ({
                        ...prev,
                        videoUrl: url,
                        videoProvider: parsed.provider,
                        videoThumbnail: parsed.thumbnail,
                        image: parsed.thumbnail || prev.image,
                      }));
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (!newReel.videoUrl) return;
                    const parsed = parseVideoUrl(newReel.videoUrl);
                    setNewReel(prev => ({
                      ...prev,
                      videoProvider: parsed.provider,
                      videoThumbnail: parsed.thumbnail,
                      image: parsed.thumbnail || prev.image,
                    }));
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-xl font-semibold"
                >
                  <CheckCircle size={18} />
                </button>
              </div>
              {newReel.videoProvider && (
                <div className="flex items-center gap-2 text-sm">
                  <span>{getProviderIcon(newReel.videoProvider)}</span>
                  <span className="text-muted-foreground">{getProviderName(newReel.videoProvider)}</span>
                </div>
              )}
              {newReel.videoThumbnail && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-muted">
                  <img src={newReel.videoThumbnail} alt="Thumbnail" className="w-full h-full object-cover" loading="lazy"/>
                  <span className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded-lg">
                    {getProviderIcon(newReel.videoProvider!)} {getProviderName(newReel.videoProvider!)}
                  </span>
                </div>
              )}
              <details className="group">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  {tr("Or upload a video file instead...", "أو ارفع ملف فيديو بدلاً من ذلك...")}
                </summary>
                <div className="mt-2 border-2 border-dashed border-muted rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    id="reel-video-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const maxSize = 100 * 1024 * 1024;
                      if (file.size > maxSize) { swalError(tr("Video too large. Max 100MB.", "الفيديو كبير جداً. الحد الأقصى 100 ميجابايت.")); return; }
                      setUploading(true);
                      setUploadProgress(0);
                      try {
                        if (file.size <= 10 * 1024 * 1024) {
                          const base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                          });
                          setNewReel({ ...newReel, videoUrl: base64, image: base64, videoProvider: "direct" });
                        } else {
                          swalLoading(tr("Processing large video...", "جاري معالجة الفيديو الكبير..."));
                          const chunks = await fileToChunks(file, (progress) => setUploadProgress(progress));
                          const sizeMB = getChunksSizeMB(chunks);
                          swalClose();
                          if (sizeMB > 100) { swalError(tr("Video too large after processing. Max 100MB.", "الفيديو كبير جداً بعد المعالجة. الحد الأقصى 100 ميجابايت.")); setUploading(false); return; }
                          setNewReel({ ...newReel, videoUrl: chunks[0], image: chunks[0], videoProvider: "direct", videoChunks: chunks, chunkCount: chunks.length });
                        }
                        setUploadProgress(100);
                      } catch (err) { console.error(err); swalError(tr("Failed to upload video", "فشل في رفع الفيديو")); }
                      setUploading(false);
                    }}
                  />
                  <label htmlFor="reel-video-upload" className="cursor-pointer">
                    <Video size={24} className="mx-auto text-muted-foreground mb-2"/>
                    <p className="text-xs text-muted-foreground">
                      {uploading ? `${tr("Processing...", "جاري المعالجة...")} ${uploadProgress}%` : tr("Click to upload video (max 100MB)", "انقر لرفع فيديو (حد أقصى 100 ميجابايت)")}
                    </p>
                  </label>
                </div>
              </details>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold">{tr("Caption (English)","الوصف (إنجليزي)")}</label>
            <textarea
              className={`${inp} min-h-[60px] resize-none`}
              placeholder={tr("Write caption in English...","اكتب الوصف بالإنجليزية...")}
              value={newReel.caption}
              onChange={(e) => setNewReel({ ...newReel, caption: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">{tr("Caption (Arabic)","الوصف (عربي)")}</label>
            <textarea
              className={`${inp} min-h-[60px] resize-none`}
              placeholder={tr("اكتب الوصف بالعربية...","اكتب الوصف بالعربية...")}
              value={newReel.captionAr}
              onChange={(e) => setNewReel({ ...newReel, captionAr: e.target.value })}
              dir="rtl"
            />
          </div>
          <button
            onClick={createReel}
            disabled={!newReel.image || (!newReel.caption && !newReel.captionAr)}
            className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={16}/> {tr("Create Post","إنشاء المنشور")}
          </button>
        </div>
      </div>

      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-foreground">{tr("Manage Posts","إدارة المنشورات")}</h3>
        {reels.length === 0 && (
          <div className="text-center py-8"><Film size={40} className="mx-auto text-muted-foreground/25 mb-2"/><p className="text-muted-foreground text-sm">{tr("No posts yet","لا يوجد منشورات بعد")}</p></div>
        )}
        <div className="space-y-3">
          {reels.map((reel) => (
            <div key={reel.id} className="card rounded-xl overflow-hidden flex">
              <div className="w-20 h-20 flex-shrink-0 bg-muted">
                {reel.image && <img src={reel.image} alt={reel.caption} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} loading="lazy"/>}
              </div>
              <div className="flex-1 p-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {reel.pinned && <span className="badge px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold mb-1">📌 {tr("Pinned","مثبت")}</span>}
                    <p className="text-xs text-foreground font-medium line-clamp-2">{reel.caption || reel.captionAr || tr("No caption","بدون وصف")}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">❤️ {reel.likes||0} · {new Date(reel.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 p-2 flex-shrink-0 justify-center">
                <button onClick={() => togglePin(reel)} className="btn-icon w-8 h-8 text-primary" title={reel.pinned ? "Unpin" : "Pin"}>
                  <Pin size={13} className={reel.pinned ? "fill-primary" : ""}/>
                </button>
                <button onClick={() => deleteReel(reel)} className="btn-icon w-8 h-8 text-destructive/60 hover:text-destructive">
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
