"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { translations, villages as staticVillages, type Village } from "../lib/data";

type Mode = "district" | "village" | "asha";

const riskClass = (value: string) =>
  value === "High"
    ? "risk high"
    : value === "Moderate" ||
      value === "Boil Required" ||
      value === "Chlorination Needed"
    ? "risk moderate"
    : "risk safe";

type BackendVillage = {
  village_name: string;
  community_health_score: number;
  risk_level: string;
  updated_at: string;
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("district");
  const [language, setLanguage] = useState("English");
  const [villages, setVillages] = useState<Village[]>(staticVillages);
  const [active, setActive] = useState<Village>(staticVillages[0]);
  const [explanation, setExplanation] = useState("");
  const [offline, setOffline] = useState(false);
  const [queue, setQueue] = useState<{ type: string; time: string }[]>([]);
  const [notice, setNotice] = useState("");

  const t = translations[language];
  // LIVE BACKEND DATA
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/v1/villages",
          { cache: "no-store" }
        );

        if (!response.ok) return;

        const data: BackendVillage[] = await response.json();

        // Keep only latest record for each village
        const latest = new Map<string, BackendVillage>();

        for (const item of data) {
          if (!latest.has(item.village_name)) {
            latest.set(item.village_name, item);
          }
        }

        const liveVillages: Village[] = staticVillages.map((oldVillage) => {
          const live = latest.get(oldVillage.name);

          if (!live) return oldVillage;

          const risk =
            live.risk_level.toLowerCase() === "high"
              ? "High"
              : live.risk_level.toLowerCase() === "moderate"
              ? "Moderate"
              : "Safe";

          return {
            ...oldVillage,
            score: live.community_health_score,
            risk,
          };
        });

        setVillages(liveVillages);

        const rampur = liveVillages.find(
          (v) => v.name.toLowerCase() === "rampur"
        );

        if (rampur) {
          setActive(rampur);
        }
      } catch (error) {
        console.log("Backend unavailable:", error);
      }
    };

    loadData();

    const interval = setInterval(loadData, 3000);

    return () => clearInterval(interval);
  }, []);

  const counts = useMemo(
    () => ({
      high: villages.filter((v) => v.risk === "High").length,
      moderate: villages.filter((v) => v.risk === "Moderate").length,
      safe: villages.filter((v) => v.risk === "Safe").length,
    }),
    [villages]
  );

  useEffect(() => {
    const saved = localStorage.getItem("jr-queue");
    if (saved) setQueue(JSON.parse(saved));
  }, []);

  function addQueue(type: string) {
    const next = [
      ...queue,
      { type, time: new Date().toLocaleTimeString() },
    ];

    setQueue(next);
    localStorage.setItem("jr-queue", JSON.stringify(next));

    setNotice(
      offline
        ? "Saved securely on this device. It will sync when online."
        : "Report received and added to the response queue."
    );
  }

  async function explain(v: Village) {
    setActive(v);
    setExplanation("Generating clear response guidance…");

    try {
      const response = await fetch("/api/ai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          village: v.name,
          context: v.reason,
        }),
      });

      const data = await response.json();
      setExplanation(data.summary);
    } catch {
      setExplanation(v.reason);
    }
  }

  function submitReport(
    e: FormEvent<HTMLFormElement>,
    type: string
  ) {
    e.preventDefault();
    addQueue(type);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">RURAL PUBLIC HEALTH EARLY WARNING</p>
          <h1>
            JalRakshak <i>2.0</i>
          </h1>
        </div>

        <div className="header-actions">
          <select
            aria-label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {Object.keys(translations).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>

          <button
            className="sos"
            onClick={() =>
              setNotice(
                "Emergency protocol opened. Contact your district control room immediately."
              )
            }
          >
            {t.sos}
          </button>
        </div>
      </header>

      <nav aria-label="Application views">
        {(["district", "village", "asha"] as Mode[]).map((x) => (
          <button
            key={x}
            className={mode === x ? "selected" : ""}
            onClick={() => setMode(x)}
          >
            {t[x]}
          </button>
        ))}
      </nav>

      {notice && (
        <div className="notice" role="status">
          ✓ {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}

      {mode === "district" && (
        <District
          villages={villages}
          counts={counts}
          onExplain={explain}
        />
      )}

      {mode === "village" && (
        <PublicView
          village={active}
          t={t}
          onSubmit={submitReport}
        />
      )}

      {mode === "asha" && (
        <Asha
          offline={offline}
          setOffline={setOffline}
          queue={queue}
          onSubmit={submitReport}
          onSync={() => {
            setQueue([]);
            localStorage.removeItem("jr-queue");
            setNotice("All offline records synced successfully.");
          }}
          t={t}
        />
      )}

      {explanation && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <section className="modal">
            <p className="eyebrow">
              EXPLAINABLE AI • RESPONSE NOTE
            </p>

            <h2>{active.name}</h2>

            <p>{explanation}</p>

            <small>
              Supports local public-health decisions; not a medical
              diagnosis.
            </small>

            <button onClick={() => setExplanation("")}>
              CLOSE
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

function District({
  villages,
  counts,
  onExplain,
}: {
  villages: Village[];
  counts: {
    high: number;
    moderate: number;
    safe: number;
  };
  onExplain: (v: Village) => void;
}) {
  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">LIVE DISTRICT OVERVIEW</p>
          <h2>Protect every village, earlier.</h2>
        </div>

        <span className="live">● DATA SYNCED</span>
      </div>

      <div className="stats">
        <Stat
          label="VILLAGES MONITORED"
          value={villages.length}
        />

        <Stat
          label="HIGH RISK"
          value={counts.high}
          tone="red"
        />

        <Stat
          label="MODERATE RISK"
          value={counts.moderate}
          tone="yellow"
        />

        <Stat
          label="SAFE"
          value={counts.safe}
          tone="green"
        />

        <Stat
          label="AI CONFIDENCE"
          value="92%"
          tone="blue"
        />
      </div>

      <div className="grid-main">
        <section className="panel">
          <div className="panel-title">
            <h3>VILLAGE RISK REGISTER</h3>
            <span>Updated now</span>
          </div>

          <div className="village-list">
            {villages.map((v) => (
              <button
                key={v.name}
                className="village-row"
                onClick={() => onExplain(v)}
              >
                <strong>{v.name}</strong>

                <div className="score">
                  <span
                    style={{
                      width: `${v.score}%`,
                    }}
                  ></span>
                </div>

                <b>{v.score}</b>

                <em className={riskClass(v.risk)}>
                  {v.risk}
                </em>

                <span className="action">
                  {v.action} →
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel actions">
          <h3>AI RESPONSE QUEUE</h3>

          {villages.slice(0, 3).map((v) => (
            <article
              key={v.name}
              className="action-card"
            >
              <em className={riskClass(v.risk)}>
                {v.risk}
              </em>

              <strong>{v.action}</strong>

              <p>
                {v.name} · {v.reason}
              </p>

              <button onClick={() => onExplain(v)}>
                WHY THIS?
              </button>
            </article>
          ))}
        </section>
      </div>

      <h3 className="module-title">
        MODULE STATUS
      </h3>

      <div className="modules">
        <Module
          icon="≈"
          name="Water Safety"
          note="Cholera • Typhoid • Diarrhea"
          risk="High"
        />

        <Module
          icon="◉"
          name="Mosquito / Vector"
          note="Dengue • Malaria"
          risk="Moderate"
        />

        <Module
          icon="☀"
          name="Heatwave"
          note="Hydration risk"
          risk="Moderate"
        />

        <Module
          icon="↗"
          name="Air Quality"
          note="Respiratory risk"
          risk="Safe"
        />

        <Module
          icon="+"
          name="Vaccination"
          note="78% community coverage"
          risk="Moderate"
        />
      </div>
    </section>
  );
}

function PublicView({
  village,
  t,
  onSubmit,
}: {
  village: Village;
  t: Record<string, string>;
  onSubmit: (
    e: FormEvent<HTMLFormElement>,
    type: string
  ) => void;
}) {
  return (
    <section className="page public">
      <p className="eyebrow">
        VILLAGE PUBLIC VIEW • {village.name.toUpperCase()}
      </p>

      <div className="public-hero">
        <div>
          <p>{t.health}</p>

          <div className="big-score">
            {village.score}
            <small>/100</small>
          </div>

          <em className={riskClass(village.risk)}>
            {village.risk} RISK
          </em>
        </div>

        <div className="water-status">
          <p>DRINKING WATER STATUS</p>

          <h2>{village.water.toUpperCase()}</h2>

          <span>
            {village.water === "Safe"
              ? "Use clean, covered containers."
              : "Follow guidance: boil water before drinking."}
          </span>
        </div>
      </div>

      <div className="guidance">
        <Guide
          icon="1"
          title="Drink safe water"
          text="Boil water and let it cool in a covered vessel."
        />

        <Guide
          icon="2"
          title="Stop mosquitoes"
          text="Empty stagnant water around your home weekly."
        />

        <Guide
          icon="3"
          title="Protect family"
          text="Visit your nearest PHC for due immunizations."
        />
      </div>

      <div className="grid-main">
        <section className="panel">
          <h3>COMMUNITY ALERT PREVIEW</h3>

          <div className="channels">
            <button>☎ IVR VOICE CALL</button>
            <button>
              SMS: Boil water before drinking.
            </button>
            <button>◉ WHATSAPP NOTICE</button>
          </div>
        </section>

        <section className="panel">
          <h3>{t.report}</h3>

          <form
            onSubmit={(e) =>
              onSubmit(e, "Citizen concern")
            }
          >
            <label>
              What do you see?
              <select required>
                <option>Dirty water supply</option>
                <option>Stagnant water</option>
                <option>Diarrhea cases nearby</option>
              </select>
            </label>

            <label>
              Village / area
              <input
                required
                placeholder="e.g., Ward 4"
              />
            </label>

            <button type="submit">
              SEND REPORT →
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}

function Asha({
  offline,
  setOffline,
  queue,
  onSubmit,
  onSync,
  t,
}: {
  offline: boolean;
  setOffline: (x: boolean) => void;
  queue: { type: string; time: string }[];
  onSubmit: (
    e: FormEvent<HTMLFormElement>,
    type: string
  ) => void;
  onSync: () => void;
  t: Record<string, string>;
}) {
  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">HEALTH WORKER PORTAL</p>
          <h2>Field records that work anywhere.</h2>
        </div>

        <button
          className={
            offline ? "offline on" : "offline"
          }
          onClick={() => setOffline(!offline)}
        >
          {offline
            ? "● OFFLINE — SAVING LOCALLY"
            : "● ONLINE — SYNC ENABLED"}
        </button>
      </div>

      <div className="grid-main">
        <section className="panel">
          <h3>PATIENT SYMPTOM LOG</h3>

          <form
            onSubmit={(e) =>
              onSubmit(e, "Patient symptom log")
            }
          >
            <label>
              Patient reference
              <input
                required
                placeholder="Initials or household no."
              />
            </label>

            <fieldset>
              <legend>Symptoms</legend>

              <label>
                <input type="checkbox" /> Fever
              </label>

              <label>
                <input type="checkbox" /> Diarrhea
              </label>

              <label>
                <input type="checkbox" /> Vomiting
              </label>
            </fieldset>

            <button type="submit">
              SAVE FIELD RECORD →
            </button>
          </form>
        </section>

        <section className="panel">
          <h3>WATER SOURCE CHECK</h3>

          <form
            onSubmit={(e) =>
              onSubmit(e, "Water source check")
            }
          >
            <label>
              Location
              <input
                required
                placeholder="Ward / landmark"
              />
            </label>

            <label>
              Source type
              <select>
                <option>Handpump</option>
                <option>Tube well</option>
                <option>Tap</option>
              </select>
            </label>

            <label>
              Visual quality
              <select>
                <option>Clear</option>
                <option>Murky</option>
                <option>Unusual odour</option>
              </select>
            </label>

            <button type="submit">
              SAVE SOURCE STATUS →
            </button>
          </form>
        </section>
      </div>

      <section className="sync panel">
        <div>
          <h3>
            SYNC QUEUE <span>{queue.length}</span>
          </h3>

          <p>
            {queue.length
              ? queue
                  .map(
                    (q) =>
                      `${q.type} • ${q.time}`
                  )
                  .join(" | ")
              : "No records waiting. All work is synced."}
          </p>
        </div>

        <button
          disabled={!queue.length || offline}
          onClick={onSync}
        >
          SYNC NOW →
        </button>
      </section>
    </section>
  );
}

function Stat({
  label,
  value,
  tone = "",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <article className={`stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Module({
  icon,
  name,
  note,
  risk,
}: {
  icon: string;
  name: string;
  note: string;
  risk: string;
}) {
  return (
    <article className="module">
      <b>{icon}</b>

      <div>
        <strong>{name}</strong>
        <small>{note}</small>
      </div>

      <em className={riskClass(risk)}>
        {risk}
      </em>
    </article>
  );
}

function Guide({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <article>
      <b>{icon}</b>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}