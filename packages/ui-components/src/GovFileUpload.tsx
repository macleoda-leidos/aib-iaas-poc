import React, { useCallback, useState, useRef } from 'react';

interface GovFileUploadProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesSelected?: (files: File[]) => void;
  className?: string;
}

export function GovFileUpload({
  id,
  label,
  hint,
  error,
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
  multiple = false,
  maxSizeMB = 10,
  onFilesSelected,
  className = '',
}: GovFileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(f => f.size <= maxSizeMB * 1024 * 1024);
    setSelectedFiles(prev => multiple ? [...prev, ...valid] : valid);
    onFilesSelected?.(valid);
  }, [maxSizeMB, multiple, onFilesSelected]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div className={`govuk-form-group mb-6 ${error ? 'border-l-4 border-red-700 pl-4' : ''} ${className}`}>
      <label htmlFor={id} className="block text-base font-bold text-gray-900 mb-1">
        {label}
      </label>
      {hint && <div className="text-gray-600 text-sm mb-2">{hint}</div>}
      {error && (
        <p className="text-red-700 text-sm font-bold mb-2" role="alert">
          <span className="sr-only">Error:</span> {error}
        </p>
      )}
      <div
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-400 bg-gray-50 hover:border-gray-600'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        <p className="text-gray-700 mb-2">Drag and drop files here or click to browse</p>
        <p className="text-gray-500 text-sm">Maximum file size: {maxSizeMB}MB</p>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={e => handleFiles(e.target.files)}
          className="sr-only"
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
      </div>
      {selectedFiles.length > 0 && (
        <ul className="mt-3 space-y-1" aria-label="Selected files">
          {selectedFiles.map((file, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
              <span>📄</span> {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
