import { useDownloadUrl } from '../hooks/useDownloadUrl.js';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  resource: string;
}

export function SecureImage({ resource, ...props }: SecureImageProps) {
  const { url, loading } = useDownloadUrl(resource);

  if (loading || !url) {
    return (
      <div className={props.className} aria-label="Loading image">
        <div className="w-full h-full bg-surface-container-high animate-pulse" />
      </div>
    );
  }

  return <img {...props} src={url} />;
}
