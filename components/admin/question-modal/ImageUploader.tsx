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
            <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Visual Documentation</label>
            <div className="flex gap-4">
                <div className="relative flex-1 group">
                    <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="External Image Endpoint (Direct Link)..."
                        className="w-full bg-surface-bg/50 border border-surface-border rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-accent-blue/30 text-sm italic font-medium text-foreground transition-colors placeholder:text-muted/30"
                    />
                    <ImageIcon className="absolute left-4 top-4.5 w-4 h-4 text-muted/30 group-focus-within:text-accent-blue transition-colors" />
                </div>
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-6 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/20 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all active:scale-95"
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload
                </button>
            </div>
            {imageUrl && (
                <div className="relative aspect-video rounded-3xl overflow-hidden border border-surface-border bg-surface-bg/80 group">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                    <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
