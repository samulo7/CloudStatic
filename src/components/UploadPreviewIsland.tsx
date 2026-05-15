import { useEffect, useRef, useState } from 'react';

interface PreviewImage {
  id: string;
  name: string;
  size: number;
  url: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function UploadPreviewIsland() {
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const accepted = files.filter((file) => file.type.startsWith('image/'));
    const rejected = files.length - accepted.length;

    if (rejected > 0) {
      setError(`${rejected} non-image file${rejected === 1 ? '' : 's'} skipped.`);
    } else {
      setError('');
    }

    if (accepted.length === 0) return;

    const nextImages = accepted.map((file) => {
      const url = URL.createObjectURL(file);
      urlsRef.current.push(url);

      return {
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        name: file.name,
        size: file.size,
        url,
      };
    });

    setImages((current) => [...current, ...nextImages]);
  }

  function removeImage(id: string) {
    setImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
        urlsRef.current = urlsRef.current.filter((url) => url !== target.url);
      }
      return current.filter((image) => image.id !== id);
    });
  }

  return (
    <div className="upload-island">
      <div
        className="upload-dropzone"
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.currentTarget.value = '';
          }}
        />
        <span>Drop images here</span>
        <strong>Choose local files for preview</strong>
        <p>No upload happens here. Files stay in this browser until refresh.</p>
      </div>

      {error && <p className="upload-error">{error}</p>}

      {images.length === 0 ? (
        <div className="empty-state upload-empty">
          <h2>No previews yet.</h2>
          <p>Select PNG, JPG, GIF, WebP, or other browser-readable images to preview the future upload list.</p>
        </div>
      ) : (
        <section className="preview-grid" aria-label="Selected image previews">
          {images.map((image) => (
            <article className="preview-card" key={image.id}>
              <img src={image.url} alt={image.name} />
              <div>
                <h2>{image.name}</h2>
                <p>{formatSize(image.size)}</p>
                <button type="button" onClick={() => removeImage(image.id)}>Remove</button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
