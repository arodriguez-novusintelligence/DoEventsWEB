import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lovable/components/ui/card";
import { Button } from "@lovable/components/ui/button";
import { ArrowLeft, TrendingUp, Users, Mail, Eye, MousePointer, Check, MessageCircle, Bell, Smartphone, ChevronRight } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@lovable/components/ui/chart";
import { Badge } from "@lovable/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@lovable/components/ui/accordion";
import { useGuestEvents } from "@lovable/hooks/useGuestEvents";
import { GuestEvent } from "@lovable/types/guest-event";

import ana from "@lovable/assets/avatars/ana.jpg";
import carlos from "@lovable/assets/avatars/carlos.jpg";
import maria from "@lovable/assets/avatars/maria.jpg";
import jose from "@lovable/assets/avatars/jose.jpg";
import laura from "@lovable/assets/avatars/laura.jpg";
import miguel from "@lovable/assets/avatars/miguel.jpg";
import pedro from "@lovable/assets/avatars/pedro.jpg";
import isabel from "@lovable/assets/avatars/isabel.jpg";
import fernando from "@lovable/assets/avatars/fernando.jpg";
import luis from "@lovable/assets/avatars/luis.jpg";

const funnelByChannel = {
  whatsapp: { label: "WhatsApp", data: [
    { step: "Enviados", count: 3200, percentage: 100 },
    { step: "Entregados", count: 3136, percentage: 98 },
    { step: "Abiertos", count: 2720, percentage: 85 },
    { step: "Clics", count: 544, percentage: 17 },
    { step: "Confirmados", count: 134, percentage: 4.2 },
  ] },
  mail: { label: "Mail", data: [
    { step: "Enviados", count: 4000, percentage: 100 },
    { step: "Entregados", count: 3800, percentage: 95 },
    { step: "Abiertos", count: 1520, percentage: 38 },
    { step: "Clics", count: 304, percentage: 7.6 },
    { step: "Confirmados", count: 61, percentage: 1.52 },
  ] },
  inapp: { label: "Campaña (inApp)", data: [
    { step: "Enviados", count: 1800, percentage: 100 },
    { step: "Entregados", count: 1782, percentage: 99 },
    { step: "Abiertos", count: 1656, percentage: 92 },
    { step: "Clics", count: 248, percentage: 13.8 },
    { step: "Confirmados", count: 122, percentage: 6.8 },
  ] },
  push: { label: "Push", data: [
    { step: "Enviados", count: 1000, percentage: 100 },
    { step: "Entregados", count: 970, percentage: 97 },
    { step: "Abiertos", count: 780, percentage: 78 },
    { step: "Clics", count: 156, percentage: 15.6 },
    { step: "Confirmados", count: 31, percentage: 3.1 },
  ] },
};

const channelData = [
  { channel: "WhatsApp", deliveryRate: 98, openRate: 85, conversionRate: 4.2 },
  { channel: "Mail", deliveryRate: 95, openRate: 38, conversionRate: 1.52 },
  { channel: "Campaña", deliveryRate: 99, openRate: 92, conversionRate: 6.8 },
  { channel: "Push", deliveryRate: 97, openRate: 78, conversionRate: 3.1 },
];

const channelIcon = (l: string) => {
  if (l.startsWith("WhatsApp")) return <MessageCircle className="h-5 w-5 text-favorite" />;
  if (l === "Mail") return <Mail className="h-5 w-5 text-primary" />;
  if (l.startsWith("Campaña")) return <Smartphone className="h-5 w-5 text-secondary-foreground" />;
  if (l === "Push") return <Bell className="h-5 w-5 text-accent-foreground" />;
  return <Users className="h-5 w-5 text-muted-foreground" />;
};

const stepIcon = (s: string) => {
  switch (s) {
    case "Enviados": return <Mail className="h-5 w-5 text-primary" />;
    case "Entregados": return <TrendingUp className="h-5 w-5 text-blue-500" />;
    case "Abiertos": return <Eye className="h-5 w-5 text-green-500" />;
    case "Clics": return <MousePointer className="h-5 w-5 text-orange-500" />;
    case "Confirmados": return <Check className="h-5 w-5 text-favorite" />;
    default: return <Users className="h-5 w-5 text-muted-foreground" />;
  }
};

const guestsByChannel = {
  whatsapp: [
    { name: "Ana", purchased: true, avatar: ana },
    { name: "Carlos", purchased: false, avatar: carlos },
    { name: "María", purchased: true, avatar: maria },
    { name: "José", purchased: true, avatar: jose },
    { name: "Laura", purchased: true, avatar: laura },
    { name: "Miguel", purchased: true, avatar: miguel },
  ],
  mail: [
    { name: "Pedro", purchased: true, avatar: pedro },
    { name: "Isabel", purchased: false, avatar: isabel },
    { name: "Antonio", purchased: false, avatar: jose },
    { name: "Lucía", purchased: true, avatar: maria },
  ],
  inapp: [
    { name: "Fernando", purchased: true, avatar: fernando },
    { name: "Beatriz", purchased: true, avatar: isabel },
    { name: "Sergio", purchased: false, avatar: carlos },
    { name: "Diana", purchased: true, avatar: laura },
  ],
  push: [
    { name: "Luis", purchased: true, avatar: luis },
    { name: "Rosa", purchased: true, avatar: isabel },
    { name: "Ángel", purchased: false, avatar: jose },
  ],
};

const EventListView = ({ events, onSelect, onBack }: { events: GuestEvent[]; onSelect: (e: GuestEvent) => void; onBack: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" className="gap-2" onClick={onBack}><ArrowLeft className="h-4 w-4" />Volver</Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estadísticas de invitaciones</h1>
          <p className="text-sm text-muted-foreground">Selecciona un evento</p>
        </div>
      </div>
      <div className="space-y-3">
        {events.map((ev, i) => {
          const isFinished = i === events.length - 1;
          return (
            <button key={ev.id} onClick={() => onSelect(ev)} className="w-full flex items-center gap-4 bg-card border border-border rounded-2xl p-3 hover:shadow-md transition text-left group">
              <img src={ev.image} alt={ev.title} className="w-20 h-16 object-cover rounded-xl" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-card-foreground text-base truncate">{ev.title}</h3>
                <p className="text-sm text-muted-foreground">{ev.date}</p>
                {isFinished && <p className="text-xs text-muted-foreground italic">Evento finalizado</p>}
              </div>
              <ChevronRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

const EventStatsDetail = ({ event, onBack }: { event: GuestEvent; onBack: () => void }) => {
  const guestStats = (list: typeof guestsByChannel.whatsapp) => {
    const purchased = list.filter(g => g.purchased).length;
    return `${purchased}/${list.length} (${((purchased / list.length) * 100).toFixed(0)}%)`;
  };
  const renderGrid = (list: typeof guestsByChannel.whatsapp) => (
    <div className="grid grid-cols-5 gap-3 pt-4">
      {list.map((g, i) => (
        <div key={i} className="flex flex-col items-center space-y-2">
          <div className="relative hover-scale">
            <img src={g.avatar} alt={g.name} className="w-12 h-12 rounded-full object-cover border-2 border-border" />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background ${g.purchased ? 'bg-favorite text-favorite-foreground' : 'bg-muted text-muted-foreground'}`}>
              {g.purchased ? <Check className="h-3 w-3" /> : <span className="text-xs">—</span>}
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground text-center font-medium">{g.name}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" className="gap-2" onClick={onBack}><ArrowLeft className="h-4 w-4" />Volver</Button>
          <div>
            <h1 className="text-2xl font-bold gradient-text">{event.title}</h1>
            <p className="text-muted-foreground text-sm">{event.date} • {event.location}</p>
          </div>
        </div>
        <div className="space-y-6">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Embudo por Canal</CardTitle>
              <CardDescription>Caída en cada paso del proceso</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={["whatsapp"]} className="w-full">
                {Object.entries(funnelByChannel).map(([key, ch]) => (
                  <AccordionItem key={key} value={key} className="border rounded-lg px-4 mb-3">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-2">
                        <div className="flex items-center gap-3">{channelIcon(ch.label)}<h3 className="text-sm font-semibold">{ch.label}</h3></div>
                        <Badge variant="secondary" className="text-xs">{ch.data[ch.data.length - 1].percentage}% conv.</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-5 gap-2 pt-3">
                        {ch.data.map(s => (
                          <div key={s.step} className="bg-secondary/20 p-2 rounded-lg border border-border/50 text-center">
                            <div className="flex justify-center mb-1">{stepIcon(s.step)}</div>
                            <p className="text-[10px] text-muted-foreground">{s.step}</p>
                            <p className="text-sm font-bold">{s.count.toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">{s.percentage}%</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />Rendimiento por canal</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ deliveryRate: { label: "Entrega", color: "hsl(var(--primary))" }, openRate: { label: "Apertura", color: "hsl(var(--favorite))" }, conversionRate: { label: "Conversión", color: "hsl(var(--secondary-foreground))" } }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={channelData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="channel" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="deliveryRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="openRate" fill="hsl(var(--favorite))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conversionRate" fill="hsl(var(--secondary-foreground))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" />Conversión por canal</CardTitle></CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={["whatsapp"]} className="w-full">
                {([
                  { key: "whatsapp", label: "WhatsApp", list: guestsByChannel.whatsapp },
                  { key: "mail", label: "Mail", list: guestsByChannel.mail },
                  { key: "inapp", label: "Campaña (inApp)", list: guestsByChannel.inapp },
                  { key: "push", label: "Push", list: guestsByChannel.push },
                ] as const).map(({ key, label, list }) => (
                  <AccordionItem key={key} value={key} className="border rounded-lg px-4 mb-3">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-2">
                        <div className="flex items-center gap-3">{channelIcon(label)}<h3 className="text-sm font-semibold">{label}</h3></div>
                        <span className="text-xs text-muted-foreground">{guestStats(list)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>{renderGrid(list)}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Entrega Prom.", value: "97.25%", icon: TrendingUp, color: "text-primary" },
              { label: "Apertura Prom.", value: "74%", icon: Eye, color: "text-favorite" },
              { label: "Conversión Prom.", value: "2.91%", icon: Check, color: "text-secondary-foreground" },
              { label: "Confirmaciones", value: "152", icon: Users, color: "text-foreground" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="card-enhanced">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                  <Icon className={`h-7 w-7 ${color}`} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function GuestStatisticsView({ onBack }: { onBack: () => void }) {
  const { events } = useGuestEvents();
  const [selected, setSelected] = useState<GuestEvent | null>(null);
  if (selected) return <EventStatsDetail event={selected} onBack={() => setSelected(null)} />;
  return <EventListView events={events} onSelect={setSelected} onBack={onBack} />;
}
