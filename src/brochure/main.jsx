import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { NBrainProvider } from '../../vendor/nbrain-ui/src/components/system/provider';
import { ExperienceBackground } from '../backgrounds/ExperienceBackground';
import '@fontsource-variable/inter';
import '@fontsource-variable/oxanium';
import '@fontsource/ibm-plex-mono/400.css';
import '../../vendor/nbrain-ui/styles.css';
import './brochure.css';

/* ─── Content model ────────────────────────────────────────────────────────────
   Everything the page says lives in public/brochure/content.json. This file only
   knows how to draw it, and how to edit it in the browser (?edit). */

const DRAFT_KEY = 'nbrain-brochure-draft';
const getIn = (o, path) => path.reduce((a, k) => (a == null ? a : a[k]), o);
const setIn = (o, path, v) => {
  if (!path.length) return v;
  const [k, ...rest] = path;
  const copy = Array.isArray(o) ? o.slice() : { ...o };
  copy[k] = setIn(o?.[k], rest, v);
  return copy;
};
const clone = (v) => JSON.parse(JSON.stringify(v));

const Ctx = createContext({ edit: false, update: () => {}, mutate: () => {} });
const useEd = () => useContext(Ctx);

/* An editable text field: plain text in the page, contenteditable in edit mode. */
function F({ path, as: Tag = 'span', multiline = false, className = '', fallback = '' }) {
  const { edit, content, update } = useEd();
  const value = getIn(content, path) ?? fallback;
  if (!edit) return value === '' ? null : <Tag className={`${className} ${multiline ? 'pre' : ''}`}>{value}</Tag>;
  return (
    <Tag
      className={`${className} ed ${multiline ? 'pre' : ''}`}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      data-empty={value === '' ? 'true' : undefined}
      onKeyDown={(e) => { if (e.key === 'Enter' && !multiline) { e.preventDefault(); e.currentTarget.blur(); } }}
      onBlur={(e) => { const t = e.currentTarget.innerText.replace(/\n$/, ''); if (t !== value) update(path, t); }}
    >{value}</Tag>
  );
}

/* Small move / remove / duplicate controls on an item of an array. */
function Tools({ arrayPath, index, label = '', template }) {
  const { edit, content, mutate } = useEd();
  if (!edit) return null;
  const arr = getIn(content, arrayPath) || [];
  const act = (fn) => (e) => { e.preventDefault(); e.stopPropagation(); mutate((c) => { const a = clone(getIn(c, arrayPath)); fn(a); return setIn(c, arrayPath, a); }); };
  const move = (d) => act((a) => { const j = index + d; if (j >= 0 && j < a.length) [a[index], a[j]] = [a[j], a[index]]; });
  return (
    <span className="tools" role="group" aria-label={`Edit ${label}`}>
      <button title="Move earlier" disabled={index === 0} onClick={move(-1)}>←</button>
      <button title="Move later" disabled={index === arr.length - 1} onClick={move(1)}>→</button>
      <button title="Duplicate" onClick={act((a) => a.splice(index + 1, 0, clone(a[index])))}>⧉</button>
      <button title="Remove" disabled={arr.length <= 1 && !template} onClick={act((a) => a.splice(index, 1))}>✕</button>
    </span>
  );
}

function AddButton({ arrayPath, template, label }) {
  const { edit, mutate } = useEd();
  if (!edit) return null;
  return (
    <button className="add" onClick={() => mutate((c) => setIn(c, arrayPath, [...(getIn(c, arrayPath) || []), clone(template)]))}>＋ {label}</button>
  );
}

/* An image whose file can be replaced (a path or URL, or a file embedded in the content). */
function Pic({ path, srcKey = 'src', labelKey = 'label', ratio, kind }) {
  const { edit, content, update } = useEd();
  const src = getIn(content, [...path, srcKey]);
  const file = useRef(null);
  const embed = (f) => {
    if (!f) return;
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const k = Math.min(1, 1400 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      update([...path, srcKey], c.toDataURL('image/jpeg', 0.82));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };
  return (
    <figure className={`pic ${kind === 'real' ? 'real' : ''}`} style={ratio ? { aspectRatio: ratio } : undefined}>
      {src ? <img src={src} alt={getIn(content, [...path, labelKey]) || ''} loading="lazy" /> : <div className="nopic">No image</div>}
      <figcaption><F path={[...path, labelKey]} /></figcaption>
      {edit && (
        <div className="picbar">
          <button onClick={() => { const v = window.prompt('Image path or URL', src && !src.startsWith('data:') ? src : ''); if (v) update([...path, srcKey], v.trim()); }}>URL…</button>
          <button onClick={() => file.current?.click()}>Upload…</button>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { embed(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      )}
    </figure>
  );
}

const Cta = ({ path }) => {
  const { edit, content, update } = useEd();
  const cta = getIn(content, path);
  if (!cta) return null;
  return (
    <div className="ctarow">
      <a className="cta" href={cta.href} {...(edit ? { onClick: (e) => e.preventDefault() } : { target: '_blank', rel: 'noopener noreferrer' })}>
        <F path={[...path, 'label']} />
      </a>
      {edit && <button className="mini" onClick={() => { const v = window.prompt('Link', cta.href); if (v) update([...path, 'href'], v.trim()); }}>link: {cta.href.replace(/^https?:\/\//, '').slice(0, 28)}</button>}
    </div>
  );
};

const Body = ({ i }) => {
  const { content } = useEd();
  const p = ['sections', i, 'body'];
  const paras = getIn(content, p) || [];
  return (
    <div className="body">
      {paras.map((_, k) => (
        <div key={k} className="para"><F path={[...p, k]} as="p" multiline /><Tools arrayPath={p} index={k} label="paragraph" template /></div>
      ))}
      <AddButton arrayPath={p} label="paragraph" template="New paragraph." />
    </div>
  );
};

const Head = ({ i, lead = true }) => (
  <header className="head">
    <F path={['sections', i, 'kicker']} as="div" className="kicker" />
    <F path={['sections', i, 'title']} as="h2" />
    {lead && <F path={['sections', i, 'lead']} as="p" className="lead" multiline />}
  </header>
);

const tone = (t) => `tone-${t || 'blue'}`;

/* ─── Section bodies ─────────────────────────────────────────────────────────── */

function Hero({ i, s }) {
  return (
    <div className="hero">
      <img className="herologo" src="img/lockup-stacked-white.svg" alt="N’Brain" />
      <div>
        <F path={['sections', i, 'kicker']} as="div" className="kicker" />
        <F path={['sections', i, 'title']} as="h1" />
        <F path={['sections', i, 'lead']} as="p" className="lead" multiline />
        <Cta path={['sections', i, 'cta']} />
      </div>
    </div>
  );
}

function Cards({ i, s }) {
  const p = ['sections', i, 'cards'];
  return (
    <>
      <Head i={i} />
      <div className="grid g3">
        {s.cards.map((c, j) => (
          <article key={j} className={`card ${tone(c.tone)}`}>
            <Tools arrayPath={p} index={j} label="card" />
            <F path={[...p, j, 'tag']} as="div" className="tag" />
            <F path={[...p, j, 'title']} as="h3" />
            <F path={[...p, j, 'text']} as="p" multiline />
          </article>
        ))}
      </div>
      <AddButton arrayPath={p} label="card" template={{ tag: 'Tag', title: 'Title', text: 'Text', tone: 'blue' }} />
    </>
  );
}

function Story({ i, s }) {
  const p = ['sections', i, 'beats'];
  return (
    <>
      <Head i={i} />
      <div className="grid g3 beats">
        {s.beats.map((b, j) => (
          <article key={j} className="card beat tone-rose">
            <Tools arrayPath={p} index={j} label="beat" />
            <F path={[...p, j, 'n']} as="div" className="bignum" />
            <F path={[...p, j, 'title']} as="h3" />
            <F path={[...p, j, 'text']} as="p" multiline />
          </article>
        ))}
      </div>
      <AddButton arrayPath={p} label="beat" template={{ n: '04', title: 'Title', text: 'Text' }} />
      <Body i={i} />
      <F path={['sections', i, 'closing']} as="p" className="closing" multiline />
    </>
  );
}

function Stack({ i, s }) {
  const p = ['sections', i, 'layers'];
  return (
    <>
      <Head i={i} />
      <div className="stack">
        {s.layers.map((l, j) => (
          <React.Fragment key={j}>
            {j > 0 && (
              <div className="link" aria-hidden="true">
                <span>↓ <F path={['sections', i, 'down']} /></span><span>↑ <F path={['sections', i, 'up']} /></span>
              </div>
            )}
            <article className={`card srow ${tone(l.tone)}`}>
              <Tools arrayPath={p} index={j} label="layer" />
              <div className="who">
                <F path={[...p, j, 'tag']} as="div" className="tag" />
                <F path={[...p, j, 'title']} as="h3" />
                <F path={[...p, j, 'job']} as="p" multiline />
              </div>
              <div className="why"><b>Without it</b><F path={[...p, j, 'without']} as="p" multiline /></div>
              <div className="why"><b>In N’Brain</b><F path={[...p, j, 'proof']} as="p" multiline /></div>
            </article>
          </React.Fragment>
        ))}
      </div>
      <Body i={i} />
      <F path={['sections', i, 'rule']} as="p" className="rule" multiline />
      <Chips path={['sections', i, 'chips']} chips={s.chips} />
      <AddButton arrayPath={p} label="layer" template={{ tag: 'Layer', title: 'Title', job: 'Job', without: 'Without it', proof: 'In N’Brain', tone: 'blue' }} />
    </>
  );
}

function Double({ i, s }) {
  const p = ['sections', i, 'images'];
  const pp = ['sections', i, 'points'];
  return (
    <>
      <Head i={i} />
      <Body i={i} />
      {s.points && (
        <div className="grid g3 points">
          {s.points.map((x, j) => (
            <div key={j} className="point">
              <Tools arrayPath={pp} index={j} label="point" />
              <F path={[...pp, j, 'title']} as="h3" />
              <F path={[...pp, j, 'text']} as="p" multiline />
            </div>
          ))}
        </div>
      )}
      <div className="double">
        {s.images.map((im, j) => (
          <div key={j} className={`cell c${j}`}>
            <Tools arrayPath={p} index={j} label="image" />
            <Pic path={[...p, j]} kind={im.kind} />
          </div>
        ))}
      </div>
      <AddButton arrayPath={p} label="image" template={{ src: '', label: 'Caption', kind: 'virtual' }} />
    </>
  );
}

function Layers({ i, s }) {
  const p = ['sections', i, 'layers'];
  return (
    <>
      <Head i={i} lead={false} />
      <div className="layers">
        {s.layers.map((l, j) => (
          <article key={j} className={`card layer ${tone(l.tone)}`}>
            <Tools arrayPath={p} index={j} label="layer" />
            <div>
              <F path={[...p, j, 'tag']} as="div" className="tag" />
              <F path={[...p, j, 'title']} as="h3" />
              <F path={[...p, j, 'text']} as="p" multiline />
            </div>
            <Items path={[...p, j, 'items']} items={l.items} />
          </article>
        ))}
      </div>
      <Chips path={['sections', i, 'chips']} chips={s.chips} />
      <AddButton arrayPath={p} label="layer" template={{ tag: 'Layer', title: 'Title', text: 'Text', items: ['Item'], tone: 'blue' }} />
    </>
  );
}

function Items({ path, items }) {
  return (
    <ul className="items">
      {items.map((_, k) => (
        <li key={k}>
          <F path={[...path, k]} />
          <Tools arrayPath={path} index={k} label="item" template />
        </li>
      ))}
      <li className="addli"><AddButton arrayPath={path} label="item" template="New item" /></li>
    </ul>
  );
}

function Chips({ path, chips = [] }) {
  return (
    <div className="chips">
      {chips.map((_, k) => (
        <span key={k} className="chip"><F path={[...path, k]} /><Tools arrayPath={path} index={k} label="chip" template /></span>
      ))}
      <AddButton arrayPath={path} label="chip" template="New" />
    </div>
  );
}

function Tiles({ i, s }) {
  const p = ['sections', i, 'tiles'];
  return (
    <>
      <Head i={i} />
      <div className="grid g4 tiles">
        {s.tiles.map((t, j) => (
          <article key={j} className="card tile tone-blue">
            <Tools arrayPath={p} index={j} label="tile" />
            <F path={[...p, j, 'n']} as="div" className="tag" />
            <F path={[...p, j, 'title']} as="h3" />
            <F path={[...p, j, 'text']} as="p" multiline />
          </article>
        ))}
      </div>
      <AddButton arrayPath={p} label="tile" template={{ n: '09', title: 'Title', text: 'Text' }} />
    </>
  );
}

function Cases({ i, s }) {
  const p = ['sections', i, 'cases'];
  return (
    <>
      <Head i={i} />
      <div className="grid g2 cases">
        {s.cases.map((c, j) => (
          <article key={j} className="case card tone-blue">
            <Tools arrayPath={p} index={j} label="use case" />
            <Pic path={[...p, j]} srcKey="image" ratio="16 / 8" />
            <div className="casebody">
              <F path={[...p, j, 'kicker']} as="div" className="tag" />
              <F path={[...p, j, 'title']} as="h3" />
              <F path={[...p, j, 'challenge']} as="p" className="challenge" multiline />
              <Items path={[...p, j, 'steps']} items={c.steps} />
              <F path={[...p, j, 'payoff']} as="p" className="payoff" multiline />
            </div>
          </article>
        ))}
      </div>
      <AddButton arrayPath={p} label="use case" template={{ kicker: '05 · New', title: 'Title', image: '', label: 'Caption', steps: ['Step'] }} />
    </>
  );
}

function Start({ i, s }) {
  return (
    <>
      <Head i={i} />
      <Chips path={['sections', i, 'chips']} chips={s.chips} />
      <Cta path={['sections', i, 'cta']} />
    </>
  );
}

const BODIES = { story: Story, stack: Stack, hero: Hero, cards: Cards, double: Double, layers: Layers, tiles: Tiles, cases: Cases, start: Start };

/* ─── Page ───────────────────────────────────────────────────────────────────── */

function SectionTools({ i, s }) {
  const { edit, content, mutate } = useEd();
  if (!edit) return null;
  const swap = (d) => mutate((c) => { const a = clone(c.sections); const j = i + d; if (j < 0 || j >= a.length) return c; [a[i], a[j]] = [a[j], a[i]]; return { ...c, sections: a }; });
  return (
    <div className="sectools">
      <b>{s.nav || s.id}</b>
      <button disabled={i === 0} onClick={() => swap(-1)}>↑</button>
      <button disabled={i === content.sections.length - 1} onClick={() => swap(1)}>↓</button>
      <button onClick={() => mutate((c) => setIn(c, ['sections', i, 'hidden'], !s.hidden))}>{s.hidden ? 'Show' : 'Hide'}</button>
      <button onClick={() => { if (window.confirm('Delete this section?')) mutate((c) => ({ ...c, sections: c.sections.filter((_, k) => k !== i) })); }}>Delete</button>
    </div>
  );
}

function EditBar({ onExport, onImport, onReset, dirty }) {
  const file = useRef(null);
  return (
    <div className="editbar" role="toolbar" aria-label="Brochure editor">
      <strong>Editing</strong>
      <span className="muted">{dirty ? 'draft saved in this browser' : 'matches the published version'}</span>
      <button onClick={onExport}>Export content.json</button>
      <button onClick={() => file.current?.click()}>Import</button>
      <input ref={file} type="file" accept="application/json" hidden onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ''; }} />
      <button onClick={() => window.print()}>Print / PDF</button>
      <button onClick={onReset}>Reset</button>
      <a href={location.pathname}>Exit</a>
    </div>
  );
}

function App() {
  const edit = new URLSearchParams(location.search).has('edit');
  const [published, setPublished] = useState(null);
  const [content, setContent] = useState(null);
  const [active, setActive] = useState('hero');
  const [reduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    let live = true;
    fetch('content.json', { cache: 'no-cache' }).then((r) => r.json()).then((j) => {
      if (!live) return;
      setPublished(j);
      let draft = null;
      if (edit) { try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { draft = null; } }
      setContent(draft && draft.version === j.version ? draft : j);
    });
    return () => { live = false; };
  }, [edit]);

  const mutate = useCallback((fn) => setContent((c) => fn(c)), []);
  const update = useCallback((path, v) => setContent((c) => setIn(c, path, v)), []);

  useEffect(() => {
    if (edit && content) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(content)); } catch { /* storage full or blocked */ } }
  }, [edit, content]);

  useEffect(() => {
    if (!content) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { threshold: 0.45 });
    document.querySelectorAll('section.sec').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [content]);

  if (!content) return <div className="loading">Loading…</div>;

  const exportJson = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2) + '\n'], { type: 'application/json' }));
    a.download = 'content.json';
    a.click();
  };
  const importJson = async (f) => {
    if (!f) return;
    try { const j = JSON.parse(await f.text()); if (!Array.isArray(j.sections)) throw new Error('no sections'); setContent(j); } catch (e) { window.alert(`Not a brochure file: ${e.message}`); }
  };
  const reset = () => { if (window.confirm('Discard your edits and go back to the published version?')) { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } setContent(clone(published)); } };

  const secs = content.sections.map((s, i) => ({ s, i })).filter(({ s }) => edit || !s.hidden);
  const dirty = JSON.stringify(content) !== JSON.stringify(published);

  return (
    <Ctx.Provider value={{ edit, content, update, mutate }}>
      <NBrainProvider theme="dark" glow={0.5} motion={!reduced}>
        <div className="bg" aria-hidden="true">
          <ExperienceBackground mode="flow" enabled={!reduced} />
          <div className="bgshade" />
        </div>
        <header className="top">
          <a href="/" className="brandmark"><img src="img/wordmark-white.svg" alt="N’Brain" /></a>
          <a className="by" href="/">by N’Break</a>
        </header>
        <nav className="dots" aria-label="Sections">
          {secs.map(({ s }) => (
            <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'on' : ''} title={s.nav || s.id}><span>{s.nav || s.id}</span></a>
          ))}
        </nav>
        {edit && <EditBar onExport={exportJson} onImport={importJson} onReset={reset} dirty={dirty} />}
        <main>
          {secs.map(({ s, i }) => {
            const Body = BODIES[s.type];
            return (
              <section key={s.id} id={s.id} className={`sec t-${s.type} ${s.hidden ? 'hidden' : ''}`}>
                <SectionTools i={i} s={s} />
                <div className="bwrap">{Body ? <Body i={i} s={s} /> : <p>Unknown section type “{s.type}”.</p>}</div>
              </section>
            );
          })}
        </main>
        <footer className="foot">
          <img src="img/wordmark-white.svg" alt="N’Brain" />
          <span>N’Brain is developed by N’Break · <a href="/">n-break.com</a></span>
        </footer>
      </NBrainProvider>
    </Ctx.Provider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
