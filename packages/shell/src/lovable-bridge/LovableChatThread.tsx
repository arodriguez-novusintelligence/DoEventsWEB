import React from 'react';
import type { ChatMessage as ApiChatMessage, ChatRoom } from '@doevents/shared';
import { Loader, UserAvatar } from '@doevents/shared';
import ChatRoomView from '@lovable/components/chat/ChatRoomView';
import PrivateChatView from '@lovable/components/chat/PrivateChatView';
import {
  chatRoomToEventChatRoom,
  chatRoomToPrivateChat,
} from './chatAdapter';

interface LovableChatThreadProps {
  room: ChatRoom;
  messages: ApiChatMessage[];
  userId: string;
  onlineUserIds: Record<string, boolean>;
  loadingMessages: boolean;
  sending: boolean;
  canMessage: boolean;
  showInvitationBanner: boolean;
  showEventInvitationBanner: boolean;
  showPendingSentBanner: boolean;
  peerName?: string;
  peerAvatar?: string;
  inviteBusy: boolean;
  onBack: () => void;
  onAcceptInvitation: () => void;
  onDeclineInvitation: () => void;
  onSendMessage: (text: string, options?: { announcement?: boolean }) => void;
  onDeleteMessage: (messageId: string) => void;
  onMediaPick?: (file: File) => void;
  onShareLocation?: () => void;
  onShareEvent?: () => void;
  onEventClick?: (eventId: string) => void;
  onAddPerson?: () => void;
  isEventAdmin?: boolean;
  canBroadcast?: boolean;
  isEventChat: boolean;
  isPrivateGroup: boolean;
  isReadOnlyEventChat?: boolean;
}

export const LovableChatThread: React.FC<LovableChatThreadProps> = ({
  room,
  messages,
  userId,
  onlineUserIds,
  loadingMessages,
  sending,
  canMessage,
  showInvitationBanner,
  showEventInvitationBanner,
  showPendingSentBanner,
  peerName,
  peerAvatar,
  inviteBusy,
  onBack,
  onAcceptInvitation,
  onDeclineInvitation,
  onSendMessage,
  onDeleteMessage,
  onMediaPick,
  onShareLocation,
  onShareEvent,
  onEventClick,
  onAddPerson,
  isEventAdmin = false,
  canBroadcast,
  isEventChat,
  isPrivateGroup,
  isReadOnlyEventChat = false,
}) => {
  if (loadingMessages) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-secondary">
        <Loader />
      </div>
    );
  }

  const eventRoom = isEventChat
    ? chatRoomToEventChatRoom(room, messages, userId, onlineUserIds)
    : null;
  const privateChat = !isEventChat
    ? chatRoomToPrivateChat(room, messages, userId, onlineUserIds)
    : null;

  return (
    <div className="bg-secondary">
      {(showInvitationBanner || showEventInvitationBanner) && (
        <div className="w-full px-4 pt-3">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={peerName || 'Usuario'} imageUrl={peerAvatar} size={44} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">
                  {showEventInvitationBanner ? 'Invitación al chat del evento' : 'Solicitud de mensaje'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {peerName || 'Un usuario'} quiere conversar contigo
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={inviteBusy}
                onClick={onAcceptInvitation}
                className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Aceptar
              </button>
              <button
                type="button"
                disabled={inviteBusy}
                onClick={onDeclineInvitation}
                className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPendingSentBanner && (
        <div className="w-full px-4 pt-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Solicitud enviada. La otra persona debe aceptar para que puedan conversar.
          </div>
        </div>
      )}

      {isEventChat && eventRoom && (
        <ChatRoomView
          chatRoom={eventRoom}
          onBack={onBack}
          currentUserId={userId}
          sending={sending}
          canMessage={canMessage}
          canBroadcast={canBroadcast}
          isReadOnly={isReadOnlyEventChat}
          onSendMessage={onSendMessage}
          onDeleteMessage={onDeleteMessage}
          onMediaPick={onMediaPick}
          onShareLocation={onShareLocation}
          onShareEvent={onShareEvent}
          onEventClick={onEventClick}
          onAddPerson={onAddPerson}
        />
      )}

      {!isEventChat && !isPrivateGroup && privateChat && (
        <PrivateChatView
          chat={privateChat}
          onBack={onBack}
          currentUserId={userId}
          sending={sending}
          canMessage={canMessage}
          onSendMessage={onSendMessage}
          onDeleteMessage={onDeleteMessage}
          onMediaPick={onMediaPick}
          onShareLocation={onShareLocation}
          onShareEvent={onShareEvent}
          onEventClick={onEventClick}
        />
      )}

      {isPrivateGroup && (
        <ChatRoomView
          chatRoom={chatRoomToEventChatRoom(room, messages, userId, onlineUserIds)}
          onBack={onBack}
          currentUserId={userId}
          sending={sending}
          canMessage={canMessage}
          onSendMessage={onSendMessage}
          onDeleteMessage={onDeleteMessage}
          onMediaPick={onMediaPick}
          onShareLocation={onShareLocation}
          onShareEvent={onShareEvent}
          onEventClick={onEventClick}
        />
      )}
    </div>
  );
};

export default LovableChatThread;
