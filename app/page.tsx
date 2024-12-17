"use client";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const [files, setFiles] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [uploadedFilesCount, setUploadedFilesCount] = useState<number>(0);
  const [uploadingFile, setUploadingFile] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;

    if (selectedFiles) {
      const validFiles = Array.from(selectedFiles).filter(
        (file) =>
          file.size <= 11 * 1024 * 1024 && file.type.startsWith("image/"),
      );
      const invalidFiles = Array.from(selectedFiles).filter(
        (file) =>
          file.size > 11 * 1024 * 1024 || !file.type.startsWith("image/"),
      );

      if (invalidFiles.length > 0) {
        invalidFiles.forEach((file) =>
          toast.error(
            file.size > 11 * 1024 * 1024
              ? `${file.name} exceeds 10MB limit and won't be uploaded.`
              : `${file.name} is not a valid image file and won't be uploaded.`,
          ),
        );
      }

      setFiles(validFiles as any);
    }
  };

  const handleUpload = async () => {
    if (files && files.length > 0) {
      setUploading(true);
      setUploadedFilesCount(0);
      setUploadProgress([]);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadFile(file, i);
      }

      setUploading(false);
    } else {
      toast.error("No valid files selected.");
    }
  };

  const uploadFile = async (file: File, index: number) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("content_type", file.type);
    formData.append("optimise", "false");

    setUploadingFile(file.name);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", process.env.NEXT_PUBLIC_UPLOAD_URL!, true);
    xhr.setRequestHeader("X-API-Key", process.env.NEXT_PUBLIC_API_KEY!);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setUploadProgress((prevProgress) => {
          const updatedProgress = [...prevProgress];
          updatedProgress[index] = percentComplete;
          return updatedProgress;
        });
      }
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        setUploadProgress((prevProgress) => {
          const updatedProgress = [...prevProgress];
          updatedProgress[index] = 100;
          return updatedProgress;
        });
        setUploadedFilesCount((prevCount) => prevCount + 1);
      } else {
        toast.error(`Failed to upload ${file.name}`);
      }
    };

    xhr.onerror = () => {
      toast.error(`Error uploading ${file.name}`);
    };

    xhr.send(formData);
  };

  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-8 gap-8 bg-gradient-to-r from-slate-900 to-purple-900">
      <ToastContainer />
      <h1 className="text-3xl font-bold text-white">
        {files
          ? `Uploading ${uploadedFilesCount} of ${files.length} Files`
          : "File Uploader"}
      </h1>

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-10">
          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-black text-white px-4 py-2 rounded-md border-2 border-black hover:border-white transition-all duration-500"
          >
            Select Files
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={handleUpload}
            className={`text-white px-4 py-2 rounded-md bg-zinc-500 border-zinc-500 border-2 hover:border-white transition-all duration-500 disabled:cursor-not-allowed`}
            disabled={uploading || !files}
          >
            {uploading ? "Uploading..." : "Upload Files"}
          </button>
        </div>
        {files && (
          <ul className="mt-4 space-y-2 text-gray-700 text-sm flex gap-10 flex-wrap">
            {Array.from(files).map((file: any, index) => (
              <li
                key={file.name}
                className="text-gray-600 border-2 border-gray-300 p-10 rounded-md"
              >
                <h1 className="text-white">{file.name}</h1>
                {uploadProgress[index] !== undefined && (
                  <div className="flex items-center mt-2">
                    <div className="w-full bg-white h-2 rounded-md">
                      <div
                        className="bg-purple-500 h-2 rounded-md"
                        style={{ width: `${uploadProgress[index]}%` }}
                      ></div>
                    </div>
                    <span className="text-white ml-2">
                      {uploadProgress[index].toFixed(0)}%
                    </span>
                  </div>
                )}
                {uploadProgress[index] === 100 && (
                  <span className="text-white ml-2">✔️ Uploaded</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
