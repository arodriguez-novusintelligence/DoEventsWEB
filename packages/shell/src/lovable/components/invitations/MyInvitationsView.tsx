import { useState } from 'react';
import { ChevronLeft, Heart, MailOpen } from 'lucide-react';
import { mockInvitations, InvitationEvent, InvitationPerson } from '@lovable/data/invitationsData';
import InvitationEventDetailView from './InvitationEventDetailView';

interface MyInvitationsViewProps {
  onBack: () => void;
  onViewProfile?: (person: InvitationPerson, role: string) => void;
}

const MyInvitationsView = ({ onBack, onViewProfile }: MyInvitationsViewProps) => {
  const [selected, setSelected] = useState<InvitationEvent | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  if (selected) {
    return <InvitationEventDetailView event={selected} onBack={() => setSelected(null)} onViewProfile={onViewProfile} />;
  }

  return (
    <div className="min-h-screen bg-background pb-36">
      <div className="bg-gradient-to-br from-primary via-primary to-accent px-4 pt-4 pb-10 rounded-b-3xl">
        <div className="mx-auto max-w-lg">
          <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10 rounded-lg px-2 py-1 -ml-2 transition mb-2">
            <ChevronLeft className="h-4 w-4" /> Atrás
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur">
              <MailOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-primary-foreground leading-tight">Mis invitaciones</h1>
              <p className="text-xs text-primary-foreground/80">{mockInvitations.length} invitaciones recibidas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-4">


      <div className="space-y-4">
        {mockInvitations.map((inv) => (
          <button
            key={inv.id}
            onClick={() => setSelected(inv)}
            className="flex w-full items-stretch gap-3 rounded-2xl bg-card shadow-sm text-left overflow-hidden transition-colors hover:bg-accent/40"
          >
            <img src={inv.image} alt={inv.title} className="h-36 w-28 flex-shrink-0 object-cover" />
            <div className="flex-1 min-w-0 py-3 pr-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-foreground leading-snug flex-1">{inv.title}</h3>
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLiked((p) => ({ ...p, [inv.id]: !p[inv.id] }));
                  }}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10"
                >
                  <Heart
                    className={`h-4 w-4 ${liked[inv.id] ? 'fill-primary text-primary' : 'text-primary'}`}
                  />
                </span>
              </div>
              <p className="text-xs text-foreground mt-2 font-mono">{inv.receivedAt}</p>
              <p className="text-xs text-muted-foreground mt-3">{inv.inviter}</p>
              <p className="text-sm text-foreground mt-1">Invitación pendiente</p>
            </div>
          </button>
        ))}
      </div>
      </div>
    </div>
  );

};

export default MyInvitationsView;