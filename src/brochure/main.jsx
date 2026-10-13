import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowUpRight, Check, FileText, Info, Link2, Sparkles } from 'lucide-react';
import { NBrainProvider } from '../../vendor/nbrain-ui/src/components/system/provider';
import { Badge, Button, Card, Separator, ToggleGroup } from '../../vendor/nbrain-ui/src/components/ui/primitives';
import { AgentCore } from '../../vendor/nbrain-ui/src/components/nbrain/production';
import { ExperienceBackground } from '../backgrounds/ExperienceBackground';
import '@fontsource-variable/inter';
import '@fontsource-variable/oxanium';
import '@fontsource/ibm-plex-mono/400.css';
import './brochure.css'; /* pulls in the library styles as a cascade layer, see its top */

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
const isExternal = (href = '') => /^https?:\/\//.test(href);

const Ctx = createContext({ edit: false, update: () => {}, mutate: () => {} });
const useEd = () => useContext(Ctx);

/* An editable text field: plain text in the page, contenteditable in edit mode.
   `accent` draws every line after the first in the accent colour (titles written "First line\nSecond line"). */
function F({ path, as: Tag = 'span', multiline = false, accent = false, className = '', fallback = '' }) {
  const { edit, content, update } = useEd();
  const value = getIn(content, path) ?? fallback;
  if (!edit) {
    if (value === '') return null;
    if (accent && value.includes('\n')) {
      const [first, ...rest] = value.split('\n');
      return <Tag className={className}>{first}{rest.map((l, k) => <React.Fragment key={k}><br /><span className="accent">{l}</span></React.Fragment>)}</Tag>;
    }
    return <Tag className={`${className} ${multiline ? 'pre' : ''}`}>{value}</Tag>;
  }
  return (
    <Tag
      className={`${className} ed ${multiline || accent ? 'pre' : ''}`}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      data-empty={value === '' ? 'true' : undefined}
      onKeyDown={(e) => { if (e.key === 'Enter' && !(multiline || accent)) { e.preventDefault(); e.currentTarget.blur(); } }}
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

/* Iterate an array in the content, with edit tools on every item and an add button after the last.
   `template` = items may all be removed (plain strings); `addTemplate` = what ＋ appends. */
function Each({ path, as: Tag = 'div', className = '', itemClass = '', label, template, addTemplate, children }) {
  const { content } = useEd();
  const arr = getIn(content, path) || [];
  const Item = Tag === 'ol' || Tag === 'ul' ? 'li' : 'div';
  return (
    <>
      <Tag className={className}>
        {arr.map((item, k) => (
          <Item key={k} className={`it ${typeof itemClass === 'function' ? itemClass(item, k) : itemClass}`}>
            {children(item, k, [...path, k])}
            <Tools arrayPath={path} index={k} label={label} template={template} />
          </Item>
        ))}
      </Tag>
      <AddButton arrayPath={path} label={label} template={addTemplate} />
    </>
  );
}

/* An image whose file can be replaced (a path or URL, or a file embedded in the content).
   kind: "illus" (dark smoked-glass concept art), "shot" (a real frame), "diagram" (a dark SVG). */
function Fig({ path, kind = 'illus', ratio, overlay = false, className = '' }) {
  const { edit, content, update } = useEd();
  const fig = getIn(content, path) || {};
  const file = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [fig.src]);
  const embed = (f) => {
    if (!f) return;
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const k = Math.min(1, 1400 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      update([...path, 'src'], c.toDataURL('image/jpeg', 0.82));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };
  const style = ratio ? { aspectRatio: ratio } : undefined;
  return (
    <figure className={`fig fig-${kind} ${overlay ? 'fig-overlay' : ''} ${className}`}>
      <div className="fig-frame">
        {fig.src && !failed
          ? <img src={fig.src} alt={fig.alt || ''} loading={edit ? 'eager' : 'lazy'} decoding="async" style={style} onError={() => setFailed(true)} />
          : <div className="fig-missing" style={style} role="img" aria-label={fig.alt || ''}><span>{fig.alt || 'No image'}</span></div>}
        {edit && (
          <div className="picbar">
            <button onClick={() => { const v = window.prompt('Image path or URL', fig.src && !fig.src.startsWith('data:') ? fig.src : ''); if (v) update([...path, 'src'], v.trim()); }}>URL…</button>
            <button onClick={() => file.current?.click()}>Upload…</button>
            <button onClick={() => { const v = window.prompt('Alternative text (for screen readers)', fig.alt || ''); if (v != null) update([...path, 'alt'], v.trim()); }}>Alt…</button>
            <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { embed(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        )}
        {overlay && (fig.caption || edit) && <figcaption className="fig-chip"><F path={[...path, 'caption']} /></figcaption>}
      </div>
      {!overlay && (fig.caption || edit) && <figcaption className="fig-cap"><F path={[...path, 'caption']} /></figcaption>}
    </figure>
  );
}

/* A link styled as a library button. Internal anchors scroll; external links open a new tab. */
function LinkButton({ path, variant = 'silver', size = 'md' }) {
  const { edit, content, update } = useEd();
  const cta = getIn(content, path);
  if (!cta) return null;
  const ext = isExternal(cta.href);
  return (
    <span className="ctawrap">
      <a
        className={`nb-button button-${size} button-${cta.variant || variant}`}
        href={cta.href}
        {...(edit ? { onClick: (e) => e.preventDefault() } : ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        <F path={[...path, 'label']} />
      </a>
      {edit && <button className="mini" onClick={() => { const v = window.prompt('Link', cta.href); if (v) update([...path, 'href'], v.trim()); }}>link: {cta.href.replace(/^https?:\/\//, '').slice(0, 28)}</button>}
    </span>
  );
}

function Ctas({ path }) {
  const { content } = useEd();
  const list = getIn(content, path) || [];
  return (
    <div className="ctas">
      {list.map((_, k) => <span key={k} className="it"><LinkButton path={[...path, k]} /><Tools arrayPath={path} index={k} label="button" template /></span>)}
      <AddButton arrayPath={path} label="button" template={{ label: 'Button', href: '#top', variant: 'outline' }} />
    </div>
  );
}

const Kicker = ({ path, className = '' }) => <F path={path} as="p" className={`eyebrow kick ${className}`} />;

/* Section heading: kicker, title (second line accented), lead. */
function Head({ i, size = 'h2', className = '', lead = true }) {
  const p = ['sections', i];
  return (
    <header className={`head ${className}`}>
      <Kicker path={[...p, 'kicker']} />
      <F path={[...p, 'title']} as={size} accent className="title" />
      {lead && <F path={[...p, 'lead']} as="p" className="lead" multiline />}
    </header>
  );
}

function Paras({ path, className = 'body' }) {
  return (
    <Each path={path} className={className} label="paragraph" template addTemplate="New paragraph.">
      {(_, k, ip) => <F path={ip} as="p" multiline />}
    </Each>
  );
}

const Fine = ({ path, className = '' }) => <F path={path} as="p" className={`fine ${className}`} multiline />;

/* ─── Section bodies ─────────────────────────────────────────────────────────── */

function Hero({ i }) {
  const p = ['sections', i];
  return (
    <div className="pw hero">
      <div className="hero-head">
        <Kicker path={[...p, 'kicker']} />
        <F path={[...p, 'title']} as="h1" accent className="title" />
      </div>
      <div className="hero-copy">
        <F path={[...p, 'lead']} as="p" className="lead" multiline />
        <Ctas path={[...p, 'ctas']} />
        <F path={[...p, 'micro']} as="p" className="micro" />
      </div>
      <div className="hero-visual"><Fig path={[...p, 'figure']} /></div>
    </div>
  );
}

function Points({ i }) {
  const p = ['sections', i];
  return (
    <div className="pw">
      <div className="g-points">
        <Head i={i} className="sticky" />
        <div>
          <Each path={[...p, 'items']} className="numbered" label="point" addTemplate={{ n: '04 / NEW', title: 'Title', text: 'Text' }}>
            {(_, k, ip) => (
              <>
                <F path={[...ip, 'n']} as="p" className="eyebrow idx" />
                <F path={[...ip, 'title']} as="h3" />
                <F path={[...ip, 'text']} as="p" multiline />
              </>
            )}
          </Each>
        </div>
      </div>
      <F path={[...p, 'answer']} as="p" className="answer" multiline />
    </div>
  );
}

function Idea({ i }) {
  const p = ['sections', i];
  const d = [...p, 'diagram'];
  const [phase, setPhase] = useState('now');
  return (
    <div className="pw">
      <div className="g-idea">
        <div className="idea-copy">
          <Kicker path={[...p, 'kicker']} />
          <F path={[...p, 'title']} as="h2" accent className="title big" />
          <F path={[...p, 'lead']} as="p" className="lead" multiline />
          <F path={[...p, 'statement']} as="p" className="statement" multiline />
        </div>
        <Card glass className="timecard" role="group" aria-label="Illustrative technology change">
          <div className="time-top">
            <F path={[...d, 'heading']} as="p" className="eyebrow" />
            <ToggleGroup
              label="Illustrative technology change"
              value={phase}
              onChange={setPhase}
              items={[{ value: 'now', label: <F path={[...d, 'now']} /> }, { value: 'later', label: <F path={[...d, 'later']} /> }]}
            />
          </div>
          <div className="constant">
            <AgentCore size="sm" active />
            <div>
              <F path={[...d, 'constant']} as="strong" />
              <F path={[...d, 'constantSub']} as="small" />
            </div>
          </div>
          <div className="time-link"><span aria-hidden="true">↕</span><F path={[...d, 'link']} /><span aria-hidden="true">↕</span></div>
          <Each path={[...d, 'plugs']} className={`plugs phase-${phase}`} itemClass="plug" label="connection" addTemplate={{ type: 'Type', now: 'Current', later: 'New' }}>
            {(_, k, ip) => (
              <>
                <F path={[...ip, 'type']} as="span" className="eyebrow" />
                <span key={phase} className="plug-name" aria-live="polite"><F path={[...ip, phase]} /></span>
              </>
            )}
          </Each>
          <Fine path={[...d, 'foot']} />
        </Card>
      </div>
      <Each path={[...p, 'facets']} className="facets" itemClass="facet" label="facet" addTemplate={{ icon: '◇', title: 'Title', text: 'Text' }}>
        {(_, k, ip) => (
          <>
            <F path={[...ip, 'icon']} as="span" className="facet-icon" />
            <div>
              <F path={[...ip, 'title']} as="h3" />
              <F path={[...ip, 'text']} as="p" multiline />
            </div>
          </>
        )}
      </Each>
    </div>
  );
}

function Double({ i }) {
  const p = ['sections', i];
  return (
    <div className="pw">
      <Head i={i} />
      <Fig path={[...p, 'figure']} kind="diagram" className="wide" />
      <Paras path={[...p, 'body']} className="body cols2" />
      <Each path={[...p, 'steps']} className="steps" itemClass="step" label="step" addTemplate={{ n: '04 / NEW', title: 'Title', text: 'Text' }}>
        {(_, k, ip) => (
          <>
            <span className="step-dot" aria-hidden="true" />
            <F path={[...ip, 'n']} as="p" className="eyebrow idx" />
            <F path={[...ip, 'title']} as="h3" />
            <F path={[...ip, 'text']} as="p" multiline />
          </>
        )}
      </Each>
    </div>
  );
}

function Layers({ i }) {
  const p = ['sections', i];
  return (
    <div className="pw">
      <Head i={i} />
      <div className="split split-wide">
        <Fig path={[...p, 'figure']} />
        <div>
          <Each path={[...p, 'layers']} className="rail" itemClass="rail-item" label="layer" addTemplate={{ n: '04 / NEW', title: 'Title', text: 'Text' }}>
            {(_, k, ip) => (
              <>
                <F path={[...ip, 'n']} as="p" className="eyebrow idx" />
                <F path={[...ip, 'title']} as="h3" />
                <F path={[...ip, 'text']} as="p" multiline />
              </>
            )}
          </Each>
        </div>
      </div>
      <Each path={[...p, 'planes']} className="planes" label="plane" addTemplate={{ title: 'Title', text: 'Text' }}>
        {(_, k, ip) => (
          <Card glass className={`plane plane-${k}`}>
            <span className="plane-icon" aria-hidden="true">{k === 0 ? <Sparkles size={18} /> : <Activity size={18} />}</span>
            <F path={[...ip, 'title']} as="h3" />
            <F path={[...ip, 'text']} as="p" multiline />
          </Card>
        )}
      </Each>
      <Fine path={[...p, 'note']} />
    </div>
  );
}

/* Text beside one picture. Optional: body paragraphs, an ordered flow, accent points, document items, small print. */
function Split({ i, s }) {
  const p = ['sections', i];
  return (
    <div className="pw">
      <div className={`split ${s.reverse ? 'reverse' : ''} ${s.compact ? 'compact' : ''}`}>
        <div className="copy">
          <Head i={i} size={s.compact ? 'h3' : 'h2'} lead={s.lead !== undefined} />
          {s.body && <Paras path={[...p, 'body']} />}
          {s.flow && (
            <Each path={[...p, 'flow']} as="ol" className="flow" label="step" addTemplate={{ title: 'Title', text: 'Text' }}>
              {(_, k, ip) => <><F path={[...ip, 'title']} as="strong" /><F path={[...ip, 'text']} as="p" multiline /></>}
            </Each>
          )}
          {s.points && (
            <Each path={[...p, 'points']} className="points" itemClass="point" label="point" addTemplate={{ title: 'Title', text: 'Text' }}>
              {(_, k, ip) => <><F path={[...ip, 'title']} as="strong" /><F path={[...ip, 'text']} as="p" multiline /></>}
            </Each>
          )}
          {s.items && (
            <Each path={[...p, 'items']} className="docs" itemClass="doc" label="item" addTemplate={{ title: 'Title', text: 'Text' }}>
              {(_, k, ip) => (
                <>
                  <span className="doc-icon" aria-hidden="true"><FileText size={18} /></span>
                  <div><F path={[...ip, 'title']} as="h3" /><F path={[...ip, 'text']} as="p" multiline /></div>
                </>
              )}
            </Each>
          )}
          {s.note !== undefined && <Fine path={[...p, 'note']} />}
        </div>
        <Fig path={[...p, 'figure']} />
      </div>
      {s.caption !== undefined && <Fine path={[...p, 'caption']} className="after" />}
    </div>
  );
}

function Review({ i }) {
  const p = ['sections', i];
  return (
    <div className="pw">
      <Head i={i} />
      <Card glass className="window">
        <div className="window-bar" aria-hidden="true"><i /><i /><i /></div>
        <Fig path={[...p, 'shot']} kind="shot" />
      </Card>
      <div className="split even">
        <Fig path={[...p, 'figure']} />
        <div>
          <Each path={[...p, 'modes']} className="modes" itemClass="mode" label="mode" addTemplate={{ role: 'ROLE', title: 'Title', text: 'Text' }}>
            {(_, k, ip) => (
              <>
                <Badge tone="blue"><F path={[...ip, 'role']} /></Badge>
                <F path={[...ip, 'title']} as="h3" />
                <F path={[...ip, 'text']} as="p" multiline />
              </>
            )}
          </Each>
        </div>
      </div>
    </div>
  );
}

function Widgets({ i }) {
  const p = ['sections', i];
  const c = [...p, 'compose'];
  return (
    <div className="pw">
      <Head i={i} />
      <div className="split even">
        <Fig path={[...p, 'figure']} />
        <div className="shelf">
          <Kicker path={[...p, 'shelf', 'kicker']} />
          <F path={[...p, 'shelf', 'title']} as="h3" className="h3-lg" />
          <Each path={[...p, 'shelf', 'chips']} className="chips" itemClass="chip-it" label="widget" template addTemplate="New widget">
            {(_, k, ip) => <Badge className="chip"><F path={ip} /></Badge>}
          </Each>
        </div>
      </div>
      <div className="compose">
        <Kicker path={[...c, 'kicker']} />
        <Each path={[...c, 'options']} className="options" label="option" addTemplate={{ tag: 'TAG', title: 'Title', text: 'Text' }}>
          {(_, k, ip) => (
            <Card glass className="option">
              <Badge tone={k === 1 ? 'blue' : 'neutral'}><F path={[...ip, 'tag']} /></Badge>
              <F path={[...ip, 'title']} as="h3" />
              <F path={[...ip, 'text']} as="p" multiline />
            </Card>
          )}
        </Each>
        <div className="common"><Link2 size={16} aria-hidden="true" /><F path={[...c, 'common']} as="p" multiline /></div>
      </div>
      <Fine path={[...p, 'mini']} />
    </div>
  );
}

function Cases({ i }) {
  const p = ['sections', i];
  return (
    <div className="pw">
      <Head i={i} />
      <Each path={[...p, 'cases']} className="cases" label="use case" addTemplate={{ no: '05 / NEW', title: 'Title', scenario: 'Scenario', steps: ['Step'], result: 'Outcome: …', figure: { src: '', alt: '', caption: 'Caption' } }}>
        {(c, k, ip) => (
          <Card className="case">
            <Fig path={[...ip, 'figure']} kind="shot" overlay ratio="16 / 9" />
            <div className="case-body">
              <F path={[...ip, 'no']} as="p" className="eyebrow idx" />
              <F path={[...ip, 'title']} as="h3" className="h3-lg" />
              <F path={[...ip, 'scenario']} as="p" className="scenario" multiline />
              <Each path={[...ip, 'steps']} as="ol" className="case-steps" label="step" template addTemplate="New step">
                {(_, j, sp) => <F path={sp} />}
              </Each>
              <p className="result"><Check size={16} aria-hidden="true" /><F path={[...ip, 'result']} /></p>
            </div>
          </Card>
        )}
      </Each>
    </div>
  );
}

function Crafts({ i }) {
  const p = ['sections', i];
  return (
    <div className="pw">
      <Head i={i} />
      <Each path={[...p, 'items']} className="crafts" itemClass="craft" label="craft" addTemplate={{ n: '09', title: 'Title', text: 'Text' }}>
        {(_, k, ip) => (
          <>
            <F path={[...ip, 'n']} as="span" className="craft-n" />
            <F path={[...ip, 'title']} as="h3" />
            <F path={[...ip, 'text']} as="p" multiline />
          </>
        )}
      </Each>
      <Fine path={[...p, 'note']} />
    </div>
  );
}

function Paths({ i }) {
  const p = ['sections', i];
  return (
    <div className="pw">
      <Head i={i} />
      <F path={[...p, 'caption']} as="p" className="divider-cap" />
      <Each path={[...p, 'paths']} className="duo" label="path" addTemplate={{ tag: 'PATH', title: 'Title', text: 'Text', figure: { src: '', alt: '', caption: '' } }}>
        {(_, k, ip) => (
          <Card glass className="tall">
            <Fig path={[...ip, 'figure']} className="flush" />
            <div className="tall-body">
              <Badge tone={k === 0 ? 'warning' : 'blue'}><F path={[...ip, 'tag']} /></Badge>
              <F path={[...ip, 'title']} as="h3" className="h3-lg" />
              <F path={[...ip, 'text']} as="p" multiline />
            </div>
          </Card>
        )}
      </Each>
      <Fine path={[...p, 'mini']} />
    </div>
  );
}

function Values({ i, s }) {
  const p = ['sections', i];
  const { edit, update } = useEd();
  return (
    <div className="pw">
      <Head i={i} />
      <Each path={[...p, 'values']} className="rows" label="value" addTemplate={{ sigil: '◇', kicker: 'Kicker', title: 'Title', main: 'Text', items: ['Item'], figure: { src: '', alt: '', caption: '' } }}>
        {(_, k, ip) => (
          <Card glass className="tall">
            <Fig path={[...ip, 'figure']} className="flush" />
            <div className="tall-body">
              <div className="value-head"><F path={[...ip, 'sigil']} as="span" className="sigil" /><Kicker path={[...ip, 'kicker']} /></div>
              <F path={[...ip, 'title']} as="h3" className="h3-lg" />
              <F path={[...ip, 'main']} as="p" multiline />
              <Each path={[...ip, 'items']} as="ul" className="checks" label="item" template addTemplate="New item">
                {(_, j, sp) => <><Check size={15} aria-hidden="true" /><F path={sp} /></>}
              </Each>
            </div>
          </Card>
        )}
      </Each>
      <p className="fine">
        <F path={[...p, 'foot']} /> <F path={[...p, 'context']} />{' '}
        {(s.links || []).map((l, k) => (
          <React.Fragment key={k}>
            {k > 0 && ' · '}
            <a href={l.href} target="_blank" rel="noopener noreferrer" onClick={edit ? (e) => e.preventDefault() : undefined}><F path={[...p, 'links', k, 'label']} /></a>
            {edit && <button className="mini" onClick={() => { const v = window.prompt('Link', l.href); if (v) update([...p, 'links', k, 'href'], v.trim()); }}>link</button>}
          </React.Fragment>
        ))}.
      </p>
    </div>
  );
}

function Memory({ i }) {
  const p = ['sections', i];
  return (
    <div className="pw">
      <Head i={i} />
      <div className="split split-wide">
        <Fig path={[...p, 'figure']} />
        <F path={[...p, 'answer']} as="p" className="answer side" multiline />
      </div>
      <Each path={[...p, 'benefits']} className="cols3" itemClass="benefit" label="benefit" addTemplate={{ title: 'Title', text: 'Text' }}>
        {(_, k, ip) => <><F path={[...ip, 'title']} as="h3" /><F path={[...ip, 'text']} as="p" multiline /></>}
      </Each>
      <Fine path={[...p, 'note']} />
    </div>
  );
}

function Bundles({ i }) {
  const p = ['sections', i];
  return (
    <div className="pw">
      <div className="g-bundles">
        <Head i={i} />
        <div>
          <Each path={[...p, 'chips']} className="bundles" itemClass={(_, k) => `bundle ${k === 0 ? 'first' : ''}`} label="bundle" template addTemplate="New bundle">
            {(_, k, ip) => <F path={ip} />}
          </Each>
        </div>
      </div>
    </div>
  );
}

function Plans({ i }) {
  const p = ['sections', i];
  return (
    <div className="pw">
      <Head i={i} />
      <Each path={[...p, 'plans']} className="plans" label="plan" addTemplate={{ type: 'Type', title: 'Plan', price: '€0', unit: '/ month', desc: 'Description', items: ['Item'], foot: 'Indicative' }}>
        {(pl, k, ip) => (
          <Card glass className={`plan ${pl.featured ? 'featured' : ''}`}>
            <F path={[...ip, 'type']} as="p" className="eyebrow kick" />
            <F path={[...ip, 'title']} as="h3" className="h3-lg" />
            <p className="price"><F path={[...ip, 'price']} className="amount" /> <F path={[...ip, 'unit']} as="small" /></p>
            <F path={[...ip, 'desc']} as="p" className="desc" multiline />
            <Separator />
            <Each path={[...ip, 'items']} as="ul" className="checks" label="item" template addTemplate="New item">
              {(_, j, sp) => <><Check size={15} aria-hidden="true" /><F path={sp} /></>}
            </Each>
            <p className="plan-foot"><Info size={14} aria-hidden="true" /><F path={[...ip, 'foot']} /></p>
          </Card>
        )}
      </Each>
      <p className="fine caveat"><Info size={15} aria-hidden="true" /><F path={[...p, 'caption']} multiline /></p>
    </div>
  );
}

function Closing({ i }) {
  const p = ['sections', i];
  return (
    <div className="pw closing">
      <img className="closing-mark" src="img/mark-illuminated.webp" alt="" width="520" height="468" loading="lazy" />
      <Head i={i} />
      <Ctas path={[...p, 'ctas']} />
    </div>
  );
}

const BODIES = { hero: Hero, points: Points, idea: Idea, double: Double, layers: Layers, split: Split, review: Review, widgets: Widgets, cases: Cases, crafts: Crafts, paths: Paths, values: Values, memory: Memory, bundles: Bundles, plans: Plans, closing: Closing };

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
      <button onClick={() => mutate((c) => { const a = clone(c.sections); a.splice(i + 1, 0, { ...clone(s), id: `${s.id}-copy` }); return { ...c, sections: a }; })}>Duplicate</button>
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
      <Button size="sm" variant="silver" onClick={onExport}>Export content.json</Button>
      <Button size="sm" onClick={() => file.current?.click()}>Import</Button>
      <input ref={file} type="file" accept="application/json" hidden onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ''; }} />
      <Button size="sm" onClick={() => window.print()}>Print / PDF</Button>
      <Button size="sm" variant="ghost" onClick={onReset}>Reset</Button>
      <a className="nb-button button-sm button-ghost" href={location.pathname}>Exit</a>
    </div>
  );
}

function TopBar({ content, active, edit }) {
  const stop = edit ? (e) => e.preventDefault() : undefined;
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a href="#top" className="brand" aria-label="N’Brain — back to top" onClick={stop}>
          <img src="img/mark-white.svg" alt="" width="26" height="26" />
          <img src="img/wordmark-white.svg" alt="" className="brand-word" width="112" height="15" />
        </a>
        <a className="by" href="/">by N’Break</a>
        <nav className="navlinks" aria-label="Brochure">
          {(content.nav || []).map((n, k) => (
            <a key={k} href={n.href} className={active === n.href ? 'on' : ''} aria-current={active === n.href ? 'true' : undefined} onClick={stop}>
              <F path={['nav', k, 'label']} />
            </a>
          ))}
        </nav>
        {content.navCta && (
          <a className="nb-button button-sm button-silver navcta" href={content.navCta.href} onClick={stop}>
            <F path={['navCta', 'label']} />
          </a>
        )}
      </div>
    </header>
  );
}

/* Print: one 16:9 page (1920×1080) per section. Before printing, each section is measured at page width and scaled
   down with `zoom` when its content is taller than a page; the scale is removed after printing. */
function fitForPrint() {
  const root = document.documentElement;
  document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
  root.classList.add('print-measure');
  document.querySelectorAll('section.sec > .sec-inner').forEach((inner) => {
    inner.style.zoom = '';
    const h = inner.scrollHeight;
    const room = 1080 - 140;
    inner.style.zoom = h > room ? String(Math.max(0.3, room / h)) : '';
  });
  root.classList.remove('print-measure');
}
function unfitForPrint() { document.querySelectorAll('section.sec > .sec-inner').forEach((el) => { el.style.zoom = ''; }); }

function App() {
  const edit = new URLSearchParams(location.search).has('edit');
  const [published, setPublished] = useState(null);
  const [content, setContent] = useState(null);
  const [activeId, setActiveId] = useState('top');
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const q = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);

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

  /* Which section is at reading height (for the nav highlight). */
  useEffect(() => {
    if (!content) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActiveId(e.target.id)), { rootMargin: '-30% 0px -65% 0px' });
    document.querySelectorAll('section.sec').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [content]);

  /* Sections fade in once as they arrive (never with reduced motion, never in edit mode). */
  useEffect(() => {
    if (!content) return;
    const els = document.querySelectorAll('section.sec:not(.in)');
    if (reduced || edit || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return; }
    document.documentElement.classList.add('reveal');
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [content, reduced, edit]);

  useEffect(() => {
    window.addEventListener('beforeprint', fitForPrint);
    window.addEventListener('afterprint', unfitForPrint);
    return () => { window.removeEventListener('beforeprint', fitForPrint); window.removeEventListener('afterprint', unfitForPrint); };
  }, []);

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
  /* The nav item to highlight: the last one whose target is at or before the current section. */
  const order = content.sections.map((s) => s.id);
  const cur = order.indexOf(activeId);
  const active = (content.nav || []).reduce((best, n) => { const j = order.indexOf(n.href.slice(1)); return j !== -1 && j <= cur ? n.href : best; }, null);

  return (
    <Ctx.Provider value={{ edit, content, update, mutate }}>
      <NBrainProvider theme="dark" glow={0.5} motion={!reduced}>
        <div className="bg" aria-hidden="true">
          <ExperienceBackground mode="flow" enabled={!reduced} />
          <div className="bgshade" />
        </div>
        <a className="skip" href="#problem">Skip to content</a>
        <TopBar content={content} active={active} edit={edit} />
        {edit && <EditBar onExport={exportJson} onImport={importJson} onReset={reset} dirty={dirty} />}
        <main className={edit ? 'editing' : ''}>
          {secs.map(({ s, i }) => {
            const Body = BODIES[s.type];
            return (
              <section key={`${s.id}-${i}`} id={s.id} className={`sec t-${s.type} ${s.band ? 'band' : ''} ${s.hidden ? 'hidden' : ''}`}>
                <SectionTools i={i} s={s} />
                <div className="sec-inner">{Body ? <Body i={i} s={s} /> : <p className="pw">Unknown section type “{s.type}”.</p>}</div>
              </section>
            );
          })}
        </main>
        <footer className="foot">
          <div className="pw foot-inner">
            <F path={['footer', 'disclaimer']} as="p" className="foot-disc" />
            <div className="foot-row">
              <F path={['footer', 'line']} as="p" className="eyebrow" />
              <F path={['footer', 'validation']} as="p" />
            </div>
            <p className="foot-by">N’Brain is developed by N’Break · <a href="/">n-break.com <ArrowUpRight size={12} aria-hidden="true" /></a></p>
          </div>
        </footer>
      </NBrainProvider>
    </Ctx.Provider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
