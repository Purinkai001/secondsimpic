import { useRef } from "react";
import { Image as ImageIcon, Upload, Loader2, Trash2 } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface ImageUploaderProps {
    imageUrl: string;
    uploading: boolean;
    setImageUrl: (url: string) => void;
    setUploading: (v: boolean) => void;
}

export function ImageUploader({ imageUrl, uploading, setImageUrl, setUploading }: ImageUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const storageRef = ref(storage, `questions/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            setImageUrl(url);
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-admin-muted">Visual Documentation</label>
            <div className="flex gap-4">
                <div className="relative flex-1 group">
                    <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="External Image Endpoint (Direct Link)..."
                        className="admin-input w-full rounded-[1.5rem] pl-12 pr-4 py-4 text-sm font-medium placeholder:text-admin-muted/45"
                    />
                    <ImageIcon className="absolute left-4 top-4.5 w-4 h-4 text-admin-muted/45 group-focus-within:text-admin-cyan transition-colors" />
                </div>
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 rounded-full border border-admin-cyan/20 bg-admin-cyan/10 px-6 text-[10px] font-black uppercase tracking-widest text-admin-cyan transition-all active:scale-95 hover:bg-admin-cyan/20"
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload
                </button>
            </div>
            {imageUrl && (
                <div className="group relative aspect-video overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.04]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                    <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute right-4 top-4 rounded-xl bg-rose-400 p-2 text-white opacity-0 shadow-xl transition-all group-hover:opacity-100"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
