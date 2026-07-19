import * as React from 'react';
import { AvatarImage } from '@lovable/components/ui/avatar';
import { resolveUserAvatarUrl } from '@doevents/shared';

type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarImage>;

export type UserAvatarImageProps = Omit<AvatarImageProps, 'src'> & {
  src?: string | null;
  userId?: string | null;
};

export const UserAvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarImage>,
  UserAvatarImageProps
>(({ src, userId, ...props }, ref) => {
  const resolved = resolveUserAvatarUrl(src, userId);
  if (!resolved) return null;
  return <AvatarImage ref={ref} src={resolved} {...props} />;
});

UserAvatarImage.displayName = 'UserAvatarImage';

export default UserAvatarImage;
