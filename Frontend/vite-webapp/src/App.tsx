import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { villages as demoVillages } from './data/demo';
import { villageText } from './lib/i18n';
import { useLanguage } from './lib/LanguageContext';
import { alertPreview, getRegisteredResidents, getVillages, registerResident, removeRegisteredResident, sendSmsDemo, type RegisteredResident } from './services/api';
import type { Village } from './types';

type View = 'official' | 'public' | 'asha' | 'demo';
const badge = (risk: string) => `badge ${risk.toLowerCase()}`;

export default function App() {
  const { lang, setLang, t: tx, number, speak, languages } = useLanguage();
  const [view, setView] = useState<View>('public');
  const [villages, setVillages] = useState<Village[]>(demoVillages);
  const [selected, setSelected] = useState(demoVillages[0]);
  const [offline, setOffline] = useState(false);
  const [queue, setQueue] = useState<any[]>(() => JSON.parse(localStorage.getItem('jr-asha') || '[]'));
  const [channel, setChannel] = useState('SMS');
  const [customSms, setCustomSms] = useState('JalRakshak demo: Water-safety alert. Please boil drinking water before use.');
  const [notice, setNotice] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  const [registeredResidents, setRegisteredResidents] = useState<RegisteredResident[]>([]);

  useEffect(() => { getVillages(demoVillages).then(setVillages); }, []);
  useEffect(() => { localStorage.setItem('jr-asha', JSON.stringify(queue)); }, [queue]);
  useEffect(() => { getRegisteredResidents(selected.name).then(setRegisteredResidents).catch(() => setRegisteredResidents([])); }, [selected.name]);

  const stats = useMemo(() => ({
    high: villages.filter(v => v.risk === 'HIGH').length,
    moderate: villages.filter(v => v.risk === 'MODERATE').length,
    online: villages.filter(v => v.online).length,
  }), [villages]);
  const water = (value: string) => tx(value === 'SAFE' ? 'waterSafe' : value === 'BOIL WATER' ? 'waterBoil' : 'waterChlorine');
  const risk = (value: string) => tx(value === 'HIGH' ? 'riskHigh' : value === 'MODERATE' ? 'riskModerate' : 'riskSafe');
  const speakGuidance = () => speak(`${selected.name}. ${water(selected.water)}. ${selected.water === 'SAFE' ? tx('safeMessage') : tx('unsafeMessage')}`);
  const nav = (name: View, label: string) => <button className={view === name ? 'active' : ''} onClick={() => setView(name)}>{label}</button>;

  function logSymptom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setQueue(items => [...items, { id: Date.now(), symptom: form.get('symptom'), source: form.get('source'), quality: form.get('quality'), at: new Date().toLocaleString() }]);
    event.currentTarget.reset();
    setNotice('Symptom record saved for the next sync.');
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (form.get('sms_consent') !== 'on') { setNotice('SMS consent is required before registering a mobile number.'); return; }
    try {
      const result = await registerResident({ full_name: String(form.get('full_name') || ''), phone: String(form.get('phone') || ''), village_name: String(form.get('village_name') || selected.name), sms_consent: true });
      formElement.reset();
      setRegisteredResidents(await getRegisteredResidents(result.registration.village_name));
      setNotice('mode' in result && result.mode === 'local-demo' ? 'Number saved locally for demo preview. Connect the backend before sending SMS.' : 'Mobile number registered with SMS consent.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not register the mobile number.'); }
  }

  async function runSmsDemo() {
    setSendingSms(true);
    try { const result = await sendSmsDemo(selected.name, customSms); setNotice(`SMS sent to ${result.sent_to} registered household(s).`); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Could not send the demo SMS.'); }
    finally { setSendingSms(false); }
  }

  async function removeRegistration(id: string) {
    try {
      await removeRegisteredResident(id);
      setRegisteredResidents(await getRegisteredResidents(selected.name));
      setNotice('Registered mobile number removed.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not remove the mobile number.'); }
  }

  function simulate() {
    const next = villages.map(v => v.id === selected.id ? { ...v, score: 42, risk: 'HIGH' as const, water: 'BOIL WATER' } : v);
    setVillages(next);
    setSelected(next.find(v => v.id === selected.id)!);
    setNotice('Abnormal water reading simulated. You can now send a consent-based SMS demo.');
  }

  return <main>
    <header>
      <button className="brand" onClick={() => setView('public')} aria-label="Open village dashboard"><Logo /><span>{tx('brand')}</span><small>{tx('tagline')}</small></button>
      <nav>{nav('public', tx('public'))}{nav('official', tx('official'))}{nav('asha', tx('asha'))}{nav('demo', tx('demo'))}<button className="sos">{tx('sos')}</button></nav>
      <button aria-label="Listen to current health guidance" onClick={speakGuidance}>🔊 Listen</button>
      <select aria-label="Language" value={lang} onChange={event => setLang(event.target.value)}>{languages.map(language => <option key={language.code} value={language.code}>{language.label}</option>)}</select>
    </header>
    {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}

    {view === 'public' && <section className="public page">
      <p className="eyebrow">{selected.name.toUpperCase()} • {tx('citizen')}</p>
      <div className={`status ${selected.risk.toLowerCase()}`}><p>{tx('score')}</p><strong>{number(selected.score)}<small>/100</small></strong><h1>{selected.water === 'SAFE' ? tx('safe') : tx('required')}: {water(selected.water)}</h1><p className="public-copy">{selected.water === 'SAFE' ? tx('safeMessage') : tx('unsafeMessage')}</p><button className="primary" onClick={speakGuidance}>🔊 Listen to guidance</button></div>
      <div className="grid"><Info title={`🦟 ${tx('mosquito')}`} value={risk(selected.mosquito)} /><Info title={`☀️ ${tx('heat')}`} value={risk(selected.heat)} /><Info title={`💉 ${tx('vaccination')}`} value={tx('check')} /></div>
      <section className="panel"><h2>{tx('guidance')}</h2><div className="guidance"><span>{tx('drink')}</span><span>{tx('cover')}</span><span>{tx('stagnant')}</span><span>{tx('phc')}</span></div></section>
      <section className="panel registration"><h2>Get village SMS alerts</h2><p>Register a mobile number to receive water-safety alerts for {selected.name}. SMS consent is required.</p><button className="primary" onClick={() => setView('asha')}>Register mobile number</button></section>
    </section>}

    {view === 'official' && <section className="page">
      <div className="hero"><div><p className="eyebrow">{tx('control')}</p><h1>{tx('hero')}</h1><p>{tx('subhero')}</p></div><button className="primary" onClick={() => { setSelected(villages[0]); setView('demo'); }}>{tx('run')}</button></div>
      <div className="grid stats"><Card n={villages.length} label={tx('monitored')} /><Card n={stats.high} label={tx('high')} red /><Card n={stats.moderate} label={tx('moderate')} yellow /><Card n={`${stats.online}/${villages.length}`} label={tx('online')} /></div>
      <section className="panel"><h2>{tx('table')}</h2><div className="table"><div className="thead">{tx('village')} <span>{tx('score')}</span><span>{tx('risk')}</span><span>{tx('water')}</span><span>{tx('action')}</span></div>{villages.map(village => <button className="row" key={village.id} onClick={() => { setSelected(village); setView('public'); }}><strong>{village.name}</strong><span className="score">{number(village.score)}</span><span className={badge(village.risk)}>{risk(village.risk)}</span><span>{water(village.water)}</span><span>{villageText(lang, village.id).action}</span></button>)}</div></section>
      <div className="split"><section className="panel"><h2>{tx('ai')}</h2><p className="big">“{villageText(lang, selected.id).explanation}”</p><ul><li>{tx('dispatch')}</li><li>{tx('boil')}</li><li>{tx('notify')}</li></ul></section><section className="panel"><h2>{tx('modules')}</h2><p>🦟 {tx('vector')}</p><p>☀️ {tx('heatmodule')}</p><p>💉 {tx('vaccineModule')}</p></section></div>
    </section>}

    {view === 'asha' && <section className="page">
      <div className="hero"><div><p className="eyebrow">{tx('portal')}</p><h1>{tx('offlineTitle')}</h1></div><label className="toggle"><input type="checkbox" checked={offline} onChange={event => setOffline(event.target.checked)} /> {tx('offline')}</label></div>
      <div className="split"><form className="panel" onSubmit={logSymptom}><h2>{tx('log')}</h2><label>{tx('symptom')}<select name="symptom"><option>{tx('fever')}</option><option>{tx('diarrhea')}</option><option>{tx('vomiting')}</option></select></label><label>{tx('source')}<select name="source"><option>{tx('well')}</option><option>{tx('handpump')}</option><option>{tx('tap')}</option></select></label><label>{tx('quality')}<select name="quality"><option>{tx('clear')}</option><option>{tx('murky')}</option><option>{tx('odor')}</option></select></label><button className="primary">{tx('save')}</button></form><section className="panel"><h2>{tx('queue')} ({queue.length})</h2><p>{tx('last')} {offline ? tx('waiting') : tx('justNow')}</p><button className="primary" onClick={() => { if (offline) { setNotice(tx('offline')); return; } setQueue([]); setNotice(tx('sync')); }}>{tx('sync')}</button>{queue.slice(-3).map(item => <p key={item.id} className="queued">{item.symptom} · {item.source} · {item.at}</p>)}</section></div>
      <form className="panel registration" onSubmit={submitRegistration}><h2>Register a village mobile number</h2><p>Only register people who agree to receive JalRakshak water-safety SMS alerts.</p><label>Resident name<input name="full_name" required maxLength={120} /></label><label>Mobile number<input name="phone" required inputMode="numeric" pattern="[0-9+ -]{10,15}" placeholder="10-digit mobile number" /></label><label>Village<select name="village_name" defaultValue={selected.name}>{villages.map(village => <option key={village.id}>{village.name}</option>)}</select></label><label className="consent"><input name="sms_consent" type="checkbox" required /> I confirm this person gave consent for JalRakshak SMS alerts.</label><button className="primary">Register mobile number</button></form>
      <section className="panel registration"><h2>Registered SMS recipients ({registeredResidents.length})</h2>{registeredResidents.length ? <ul>{registeredResidents.map(resident => <li key={resident.id}><strong>{resident.full_name}</strong> — {resident.masked_phone} <button type="button" onClick={() => removeRegistration(resident.id)}>Remove</button></li>)}</ul> : <p>No consented mobile numbers are registered for {selected.name} yet.</p>}<small>Numbers stay saved after refresh on this device. Phone numbers are masked for privacy.</small></section>
    </section>}

    {view === 'demo' && <section className="page"><p className="eyebrow">{tx('demoTitle')}</p><h1>{tx('demoHero')}</h1><div className="flow">{['sensor', 'backend', 'engine', 'dashboard', 'alert', 'task'].map((step, index) => <div key={step} className={index < 5 ? 'flowstep' : ''}><b>{number(index + 1)}</b>{tx(step as any)}</div>)}</div><section className="panel"><h2>{tx('simulator')}</h2><p>{tx('selected')} <strong>{selected.name}</strong>. {tx('raw')}</p><button className="primary" onClick={simulate}>{tx('simulate')}</button><div className="alert"><h3>{tx('preview')}</h3><select value={channel} onChange={event => setChannel(event.target.value)}><option>SMS</option><option>Voice / IVR</option><option>WhatsApp</option></select>{channel === 'SMS' ? <><label>Custom SMS message<textarea value={customSms} maxLength={450} onChange={event => setCustomSms(event.target.value)} /></label><p><b>SMS</b> → {customSms}</p><button className="primary" disabled={sendingSms || !customSms.trim()} onClick={runSmsDemo}>{sendingSms ? 'Sending SMS…' : 'Send custom SMS to registered numbers'}</button></> : <p><b>{channel}</b> → {alertPreview(channel, selected.name).message}</p>}<small>SMS is sent only to registered mobile numbers with recorded consent.</small></div></section></section>}
  </main>;
}

const Card = ({ n, label, red, yellow }: { n: string | number; label: string; red?: boolean; yellow?: boolean }) => { const { number } = useLanguage(); return <article className={`card ${red ? 'red' : yellow ? 'yellow' : ''}`}><strong>{number(n)}</strong><span>{label}</span></article>; };
const Info = ({ title, value }: { title: string; value: string }) => <article className="info"><h3>{title}</h3><b>{value}</b></article>;
const Logo = () => <svg className="logo" viewBox="0 0 48 48" aria-label="Water safety mark" role="img"><path d="M24 4C16 15 10 21 10 30a14 14 0 0 0 28 0C38 21 32 15 24 4Z" fill="#0070f3" stroke="#000" strokeWidth="3" /><path d="M17 30c2 4 5 6 10 6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>;
