import fs from 'fs';

const path = 'packages/shell/src/pages/ChatPage.tsx';
let s = fs.readFileSync(path, 'utf8');

const threadStart = s.indexOf('  const showEventLayout = selectedRoom ? isEventRoom(selectedRoom) : false;');
const listStart = s.indexOf('  return (\n    <div className="de-chat-page de-chat-page--list');
const listEnd = s.lastIndexOf('export default ChatPage;');

if (threadStart < 0 || listStart < 0) {
  console.error('markers not found', threadStart, listStart);
  process.exit(1);
}

const before = s.slice(0, threadStart);
const after = s.slice(listEnd);

const newMiddle = `  const showEventLayout = selectedRoom ? isEventRoom(selectedRoom) : false;

  const activeEventRoomsForList = useMemo(
    () => eventRooms.filter((room) => !isRoomArchivedForUser(room, userId)),
    [eventRooms, userId],
  );

  const lovableEventRooms = useMemo(
    () => (userId ? roomsToEventChatRooms(activeEventRoomsForList, userId, onlineUserIds) : []),
    [activeEventRoomsForList, userId, onlineUserIds],
  );

  const lovablePrivateChats = useMemo(
    () => (userId ? roomsToPrivateChats(inboxPrivateRooms.filter((room) => !isPrivateGroupRoom(room)), userId, onlineUserIds) : []),
    [inboxPrivateRooms, userId, onlineUserIds],
  );

  const lovableGroupChats = useMemo(
    () => (userId ? roomsToPrivateChats(
      inboxPrivateRooms.filter((room) => isPrivateGroupRoom(room)),
      userId,
      onlineUserIds,
    ) : []),
    [inboxPrivateRooms, userId, onlineUserIds],
  );

  const lovableContacts = useMemo(
    () => chatContacts.map(chatContactToAttendee),
    [chatContacts],
  );

  const archivedChatIds = useMemo(() => {
    const ids = new Set<string>();
    if (!userId) return ids;
    rooms.forEach((room) => {
      if (isRoomArchivedForUser(room, userId)) ids.add(resolveRoomId(room));
    });
    return ids;
  }, [rooms, userId]);

  const handleOpenEventChat = (chatId: string) => {
    const room = rooms.find((r) => resolveRoomId(r) === chatId);
    if (room) {
      setActiveTab('events');
      openRoom(room);
    }
  };

  const handleOpenPrivateChat = (chatId: string) => {
    const room = rooms.find((r) => resolveRoomId(r) === chatId);
    if (room) {
      setActiveTab('private');
      openRoom(room);
      return;
    }
    void openDirectChat(chatId);
  };

  const handleArchiveFromList = async (chatId: string, archive: boolean) => {
    if (!userId) return;
    const room = rooms.find((r) => resolveRoomId(r) === chatId);
    if (!room) return;
    try {
      if (archive) {
        await archiveChatRoom(userId, chatId);
        setRooms((prev) => prev.map((r) => (
          resolveRoomId(r) === chatId
            ? { ...r, archivedBy: [...(r.archivedBy || []), userId] }
            : r
        )));
        showToast('Conversación archivada', 'success');
      } else {
        await handleUnarchiveRoom(room);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar el archivo', 'error');
    }
  };

  const profileInitials = profileName
    ? profileName.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : 'YO';

  if (selectedRoom) {
    return (
      <>
        <LovableChatThread
          room={selectedRoom}
          messages={messages}
          userId={userId!}
          onlineUserIds={onlineUserIds}
          loadingMessages={loadingMessages}
          sending={sending}
          canMessage={canMessageInRoom}
          showInvitationBanner={showInvitationBanner}
          showEventInvitationBanner={showEventInvitationBanner}
          showPendingSentBanner={showPendingSentBanner}
          peerName={peerProfile?.name || selectedRoom.hostName}
          peerAvatar={peerProfile?.avatar}
          inviteBusy={inviteBusy}
          onBack={() => setSelectedRoom(null)}
          onAcceptInvitation={handleAcceptInvitation}
          onDeclineInvitation={handleDeclineInvitation}
          onSendMessage={sendRoomMessage}
          onDeleteMessage={handleDeleteMessageById}
          isEventChat={showEventLayout}
          isPrivateGroup={isPrivateGroupRoom(selectedRoom)}
        />
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <MessagesListView
        chatRooms={lovableEventRooms}
        privateChats={lovablePrivateChats}
        groupChats={lovableGroupChats}
        contacts={lovableContacts}
        loading={loading}
        profileAvatar={profileAvatar}
        profileInitials={profileInitials}
        archivedIds={archivedChatIds}
        onBack={() => navigate(-1)}
        onBlockedClick={() => setShowBlockedPanel(true)}
        onCreateConversation={() => setShowCreateGroup(true)}
        onOpenChat={handleOpenEventChat}
        onOpenPrivateChat={handleOpenPrivateChat}
        onArchiveChat={handleArchiveFromList}
      />

`;

const modalsStart = s.indexOf('{showBlockedPanel && (', listStart);
const modals = s.slice(modalsStart, listEnd);

fs.writeFileSync(path, before + newMiddle + modals + after);
console.log('ChatPage render replaced OK');
