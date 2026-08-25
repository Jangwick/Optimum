import { useDownloadUrl } from '../hooks/useDownloadUrl.js';

interface SecureDownloadLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  resource: string;
}

export function SecureDownloadLink({ resource, ...props }: SecureDownloadLinkProps) {
  const { url, loading } = useDownloadUrl(resource);

  return (
    <a
      {...props}
      href={url ?? '#'}
      onClick={(e) => {
        if (!url) {
          e.preventDefault();
        }
        props.onClick?.(e);
      }}
      aria-disabled={loading || !url}
    />
  );
}
