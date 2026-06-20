import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, MessageSquare, Mail, Smartphone, Bell, TrendingUp, Eye, CheckCircle, Users, Download, List, Loader2, BarChart3 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@lovable/components/ui/avatar';
import type { EventChatRoom } from '@lovable/data/chatData';
import type { ChannelData } from '@lovable/data/guestStatsData';
import { getEmptyGuestStats, resolveGuestStatsData, resolveRefundsData } from '../../../lovable-bridge/statsAdapter';
import { useLiveEventStats } from '../../../lovable-bridge/useLiveEventStats';
import { exportGuestExcel, exportGuestBuyersExcel } from '@lovable/utils/exportGuestExcel';
import GuestBuyerList from './GuestBuyerList';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface GuestStatsViewProps {
  event: EventChatRoom;
  onBack: () => void;
}

const channelIcons = {
  whatsapp: MessageSquare,
  mail: Mail,
  campaign: Smartphone,
  push: Bell,
};

const funnelStepIcons = [
  MessageSquare, // Enviados
  TrendingUp,    // Entregados
  Eye,           // Abiertos
  TrendingUp,    // Clics
  CheckCircle,   // Confirmados
];

const ChannelFunnelCard = ({ channel }: { channel: ChannelData }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = channelIcons[channel.icon];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 transition-colors hover:bg-accent/30"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
          <Icon className="h-5 w-5 text-accent-foreground" />
        </div>
        <span className="text-sm font-semibold text-card-foreground whitespace-pre-line text-left">
          {channel.name}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-muted-foreground">{channel.sent.toLocaleString('es-CO')}</span>
            <span className="text-xs text-muted-foreground ml-1">enviados</span>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            {channel.conversionRate}% conversión
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {channel.funnel.map((step, i) => {
              const StepIcon = funnelStepIcons[i];
              const isLast = i === channel.funnel.length - 1;
              return (
                <div
                  key={step.label}
                  className={`flex flex-col items-center rounded-xl bg-secondary p-4 ${isLast ? 'col-span-2 max-w-[50%] mx-auto w-full' : ''}`}
                >
                  <StepIcon className="h-5 w-5 text-muted-foreground mb-1.5" />
                  <span className="text-[11px] text-muted-foreground">{step.label}</span>
                  <span className="text-lg font-bold text-card-foreground mt-0.5">
                    {step.value.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{step.percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ChannelGuestsCard = ({ channel }: { channel: ChannelData }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = channelIcons[channel.icon];
  const total = channel.guests.length;
  const confirmed = channel.confirmedCount;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 transition-colors hover:bg-accent/30"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
          <Icon className="h-5 w-5 text-accent-foreground" />
        </div>
        <span className="text-sm font-semibold text-card-foreground whitespace-pre-line text-left">
          {channel.name}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {confirmed}/{total} ({Math.round((confirmed / total) * 100)}%)
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-3">
            {channel.guests.map((guest, i) => (
              <div key={i} className="flex flex-col items-center gap-1 w-14">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarImage src={guest.avatar} alt={guest.name} />
                    <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                      {guest.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {guest.confirmed && (
                    <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-card p-0.5">
                      <CheckCircle className="h-4 w-4 text-primary fill-primary/20" />
                    </div>
                  )}
                  {!guest.confirmed && (
                    <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-card p-0.5">
                      <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground text-center truncate w-full">
                  {guest.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const GuestStatsView = ({ event, onBack }: GuestStatsViewProps) => {
  const { data, loading } = useLiveEventStats(event, resolveGuestStatsData, getEmptyGuestStats());
  const [refundedFirstNames, setRefundedFirstNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    resolveRefundsData(event).then((refunds) => {
      if (cancelled) return;
      const names = new Set(
        refunds.requests
          .filter((r) => r.status !== 'rejected')
          .map((r) => r.buyerName.split(' ')[0]),
      );
      setRefundedFirstNames(names);
    });
    return () => { cancelled = true; };
  }, [event.eventId, event.id]);

  const [showBuyerList, setShowBuyerList] = useState(false);
  const allGuests = data.channels.flatMap((ch) => ch.guests);
  const chartData = data.channels.map(ch => ({
    name: ch.name.replace('\n', ' '),
    Entregados: ch.funnel[1]?.percentage ?? 0,
    Abiertos: ch.funnel[2]?.percentage ?? 0,
    Clics: ch.funnel[3]?.percentage ?? 0,
    Conversión: ch.funnel[4]?.percentage ?? 0,
  }));

  const summaryCards = [
    { label: 'Tasa de Entrega Promedio', value: `${data.avgDeliveryRate}%`, icon: TrendingUp, color: 'text-primary' },
    { label: 'Tasa de Apertura Promedio', value: `${data.avgOpenRate}%`, icon: Eye, color: 'text-primary' },
    { label: 'Tasa de Conversión Promedio', value: `${data.avgConversionRate}%`, icon: CheckCircle, color: 'text-foreground' },
    { label: 'Total Confirmaciones', value: data.totalConfirmations.toString(), icon: Users, color: 'text-foreground' },
  ];

  return (
    <div className="min-h-screen bg-background pt-16 pb-24">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button onClick={onBack} className="text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">Estadísticas de Invitados</h1>
            <p className="text-xs text-muted-foreground truncate">{event.eventName}</p>
          </div>
        </div>
        <button
          onClick={() => exportGuestExcel(data, event.eventName)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Excel
        </button>
      </div>

      <div className="mx-auto max-w-lg px-4 py-4 space-y-8">
        {loading && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Cargando estadísticas de invitados…
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-5">
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="mt-3 h-8 w-1/4 rounded bg-muted" />
              </div>
            ))}
          </div>
        )}
        {!loading && data.channels.length === 0 && (
          <div className="rounded-2xl border border-dashed border-primary/25 bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Sin datos de invitados</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cuando envíes invitaciones por WhatsApp, email o push, verás el embudo de conversión aquí.
            </p>
          </div>
        )}
        {!loading && data.channels.length > 0 && (
          showBuyerList ? (
          <GuestBuyerList
            guests={allGuests}
            currency="COP"
            refundedNames={refundedFirstNames}
            onBack={() => setShowBuyerList(false)}
            onExport={() => exportGuestBuyersExcel(allGuests, event.eventName, 'COP')}
          />
        ) : (
        <>
        {/* Consolidated buyers button */}
        <button
          onClick={() => setShowBuyerList(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-card border border-primary/30 p-3.5 shadow-sm hover:bg-accent/30 transition-colors"
        >
          <List className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Ver lista de compradores</span>
        </button>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-1">Embudo de Conversión por Canal</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Visualiza la caída en cada paso del proceso de invitación, dividido por canal
          </p>
          <div className="space-y-3">
            {data.channels.map(ch => (
              <ChannelFunnelCard key={ch.id} channel={ch} />
            ))}
          </div>
        </section>

        {/* Section 2: Rendimiento por Canal (chart) */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-1">Rendimiento por Canal</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Comparación de tasas de entrega, apertura y conversión por canal
          </p>
          <div className="rounded-2xl border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="Entregados" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Abiertos" fill="hsl(var(--primary) / 0.6)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Clics" fill="hsl(var(--chart-2, var(--primary)) / 0.8)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Conversión" fill="hsl(var(--accent-foreground, var(--primary)) / 0.7)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Section 3: Conversión por Canal (guests with avatars) */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-1">Conversión por Canal</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Invitados que compraron boletos organizados por canal
          </p>
          <div className="space-y-3">
            {data.channels.map(ch => (
              <ChannelGuestsCard key={ch.id} channel={ch} />
            ))}
          </div>
        </section>

        {/* Section 4: Summary stats */}
        <section>
          <div className="space-y-3">
            {summaryCards.map(card => (
              <div
                key={card.label}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-5"
              >
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color} mt-1`}>{card.value}</p>
                </div>
                <card.icon className="h-6 w-6 text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </section>
        </>
        ))}
      </div>
    </div>
  );
};

export default GuestStatsView;
