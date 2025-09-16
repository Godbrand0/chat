import React, { useState, useRef } from "react";
import { Upload, X, Loader } from "lucide-react";
import Image from "next/image";
import { uploadToIPFS, getIPFSUrl } from "../utils/ipfs";

interface ImageUploadProps {
  onImageUpload: (hash: string) => void;
  previewUrl?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, previewUrl }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      // Preview locally
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      // Upload to Pinata
      const hash = await uploadToIPFS(file);
      const url = getIPFSUrl(hash);

      console.log("✅ Uploaded to IPFS:", url);
      onImageUpload(hash);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    }
    setUploading(false);
  };

  const clearImage = () => {
    setPreview(null);
    onImageUpload("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        ref={fileInputRef}
      />

      {preview ? (
        <div className="relative w-32 h-32 mx-auto">
          <Image
            src={preview}
            alt="Profile preview"
            fill
            className="object-cover rounded-full"
          />
          <button
            onClick={clearImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-32 h-32 mx-auto border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          {uploading ? (
            <Loader className="w-8 h-8 animate-spin text-gray-400" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
        </div>
      )}

      <p className="text-sm text-gray-600 text-center">
        Click to upload profile picture (max 5MB)
      </p>
    </div>
  );
};

export default ImageUpload;
