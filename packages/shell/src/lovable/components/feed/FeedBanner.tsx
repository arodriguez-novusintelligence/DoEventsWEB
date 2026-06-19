import { Megaphone } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { cn } from '@lovable/lib/utils';

interface FeedBannerProps {
  title: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export const FeedBanner = ({
  title,
  message,
  onAction,
  actionLabel = 'Ver más',
  className,
}: FeedBannerProps) => (
  <div
    className={cn(
      'mx-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-4 shadow-sm',
      className,
    )}
  >
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
        <Megaphone className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{message}</p>
        {onAction && (
          <Button
            type="button"
            size="sm"
            className="mt-3 rounded-full"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  </div>
);

export default FeedBanner;
