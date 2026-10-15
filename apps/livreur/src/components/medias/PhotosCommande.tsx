// Photos attached by the client (colis, courses express), served by
// Cloudinary: thumbnails are requested small to save data on 3G, the full
// image opens on tap.
function miniature(url: string): string {
  return url.replace('/image/upload/', '/image/upload/c_limit,w_320,q_auto,f_auto/');
}

export function PhotosCommande({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2.5">
      {urls.map((url) => (
        <a key={url} href={url} target="_blank" rel="noreferrer" className="group">
          <img
            src={miniature(url)}
            alt="Photo jointe par le client"
            loading="lazy"
            className="size-20 rounded-2xl object-cover border border-border/70 shadow-2xs transition-transform duration-200 group-hover:scale-105"
          />
        </a>
      ))}
    </div>
  );
}
