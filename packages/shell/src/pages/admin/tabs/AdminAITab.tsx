import React, { useEffect, useState } from 'react';

import { fetchAdminAIMetrics, type AdminAIMetrics } from '@doevents/shared';

import { StatCard } from '../AdminLayout';



export const AdminAITab: React.FC = () => {

  const [metrics, setMetrics] = useState<AdminAIMetrics | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    let cancelled = false;

    setLoading(true);

    fetchAdminAIMetrics()

      .then((data) => { if (!cancelled) setMetrics(data); })

      .catch((err) => {

        if (!cancelled) setError(err instanceof Error ? err.message : 'Error cargando métricas IA');

      })

      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };

  }, []);



  if (loading) return <p className="text-sm text-muted-foreground">Cargando métricas del asistente IA…</p>;

  if (error) return <p className="text-sm text-destructive">{error}</p>;

  if (!metrics) return null;



  return (

    <div className="mx-auto max-w-6xl space-y-6">

      <header>

        <h2 className="text-xl font-bold">Asistente IA</h2>

        <p className="text-sm text-muted-foreground">

          Interacciones registradas en AIInteractions-qa · actualizado {new Date(metrics.generatedAt).toLocaleString('es-CO')}

        </p>

      </header>



      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard label="Interacciones totales" value={metrics.totalInteractions} />

        <StatCard label="Búsquedas sin resultados" value={metrics.emptyResultSearches} accent="amber" />

        <StatCard label="Tasa vacía" value={`${metrics.emptyResultRate}%`} />

        <StatCard label="Días con actividad" value={metrics.conversationsByDay.length} />

      </div>



      <section className="grid gap-4 lg:grid-cols-2">

        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">

          <h3 className="mb-3 text-sm font-bold">Conversaciones por día (14 días)</h3>

          <ul className="space-y-2 text-sm">

            {metrics.conversationsByDay.map((row) => (

              <li key={row.date} className="flex items-center justify-between gap-3">

                <span className="text-muted-foreground">{row.date}</span>

                <span className="font-semibold">{row.count}</span>

              </li>

            ))}

          </ul>

        </article>



        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">

          <h3 className="mb-3 text-sm font-bold">Intents más usados</h3>

          <ul className="space-y-2 text-sm">

            {metrics.topIntents.map((row) => (

              <li key={row.intent} className="flex items-center justify-between gap-3">

                <span className="font-mono text-xs">{row.intent}</span>

                <span className="font-semibold">{row.count}</span>

              </li>

            ))}

          </ul>

        </article>

      </section>



      <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">

        <h3 className="mb-3 text-sm font-bold">Agentes invocados</h3>

        <div className="flex flex-wrap gap-2">

          {metrics.topAgents.map((row) => (

            <span key={row.agent} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">

              {row.agent} · {row.count}

            </span>

          ))}

        </div>

      </article>

    </div>

  );

};



export default AdminAITab;

