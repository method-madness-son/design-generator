import type { NdArtKind } from '@/types/tee';

/**
 * Port of the Design Bot reference css-reference/tabs-open-windows.html.
 * Laid out at 640 px, then scaled so --px, the 24 px shadow, and the window
 * widths stay in the same proportion on the tee print box.
 */
const TABS_CSS = `
.tabs-open{
  --ink:#111; --paper:#fff;
  --pink:#E0529A; --teal:#4FB3B0; --yellow:#F5C842;
  --px:6px;
  --font-pixel:var(--font-theme-jersey-10),var(--font-press-start-2p),monospace;
  width:640px; height:640px; display:grid; place-items:center;
  background:transparent; font-family:var(--font-pixel); color:var(--ink); font-weight:400;
}
.tabs-open.on-dark{ --ink:#F5EEE1; --paper:transparent; }
.tabs-open *{box-sizing:border-box}
.tabs-open .win{
  position:relative; background:var(--paper); color:var(--ink);
  border:var(--px) solid var(--ink);
  clip-path:polygon(
    0 var(--px), var(--px) var(--px), var(--px) 0,
    calc(100% - var(--px)) 0, calc(100% - var(--px)) var(--px), 100% var(--px),
    100% calc(100% - var(--px)), calc(100% - var(--px)) calc(100% - var(--px)), calc(100% - var(--px)) 100%,
    var(--px) 100%, var(--px) calc(100% - var(--px)), 0 calc(100% - var(--px)));
  image-rendering:pixelated;
}
.tabs-open .titlebar{display:flex; justify-content:space-between; align-items:center;
  padding:calc(var(--px)*1.2) calc(var(--px)*2); font-size:44px; font-weight:400; letter-spacing:.02em}
.tabs-open .body{padding:calc(var(--px)*3) calc(var(--px)*4) calc(var(--px)*4); font-weight:400}
.tabs-open .err{width:440px}
.tabs-open .err .titlebar{border-bottom:var(--px) solid var(--ink)}
.tabs-open .err .close{width:48px; height:48px; background:var(--pink); border:var(--px) solid var(--ink);
  display:grid; place-items:center; color:var(--ink)}
.tabs-open .err .body{font-size:72px; line-height:1.05}
.tabs-open .err .n{display:inline-block; position:relative}
.tabs-open .err .n::after{content:""; position:absolute; left:0; right:0; bottom:-2px; height:var(--px); background:var(--pink)}
.tabs-open .warn-wrap{position:relative; width:480px}
.tabs-open .warn-wrap::before{
  content:""; position:absolute; inset:0; transform:translate(24px,24px); background:var(--teal);
  clip-path:polygon(0 var(--px),var(--px) var(--px),var(--px) 0,calc(100% - var(--px)) 0,calc(100% - var(--px)) var(--px),100% var(--px),100% calc(100% - var(--px)),calc(100% - var(--px)) calc(100% - var(--px)),calc(100% - var(--px)) 100%,var(--px) 100%,var(--px) calc(100% - var(--px)),0 calc(100% - var(--px)))}
.tabs-open .warn{position:relative}
.tabs-open .warn .titlebar{background:var(--ink); color:var(--paper); margin:calc(var(--px)*-1) calc(var(--px)*-1) 0}
.tabs-open.on-dark .warn .titlebar{color:#111}
.tabs-open.on-dark .warn-wrap::before{
  transform:none; inset:auto; left:24px; top:24px; width:100%; height:100%;
  background:none; clip-path:none; box-sizing:content-box;
  border-right:24px solid var(--teal); border-bottom:24px solid var(--teal);
}
.tabs-open .warn .body{font-size:62px; line-height:1.05}
.tabs-open .btns{display:flex; gap:calc(var(--px)*3); margin-top:calc(var(--px)*4)}
.tabs-open .btn{flex:1; text-align:center; font-size:44px; font-weight:400; padding:calc(var(--px)*.5) 0; border:var(--px) solid var(--ink); background:var(--paper)}
.tabs-open .btn.nope{background:var(--yellow); color:#111; border-color:var(--ink)}
`;

function PixelX() {
  return (
    <svg viewBox="0 0 5 5" width="28" height="28" aria-hidden="true">
      <path
        d="M0 0h1v1H0zm4 0h1v1H4zM1 1h1v1H1zm2 0h1v1H3zM2 2h1v1H2zM1 3h1v1H1zm2 0h1v1H3zM0 4h1v1H0zm4 0h1v1H4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TabsOpenWindow({ kind, dark, size }: { kind: NdArtKind; dark: boolean; size: number }) {
  const scale = size / 640;
  return (
    <div style={{ width: size, height: size, overflow: 'hidden' }}>
      <div
        className={dark ? 'tabs-open on-dark' : 'tabs-open'}
        style={{ width: 640, height: 640, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <style>{TABS_CSS}</style>
        {kind === 'warning-box' ? (
          <div className="warn-wrap">
            <div className="win warn">
              <div className="titlebar">
                <span>Warning</span>
                <PixelX />
              </div>
              <div className="body">
                42 tabs open.
                <br />
                Close some?
                <div className="btns">
                  <div className="btn">Yes</div>
                  <div className="btn nope">Nope</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="win err">
            <div className="titlebar">
              <span>Error</span>
              <span className="close">
                <PixelX />
              </span>
            </div>
            <div className="body">
              Brain has
              <br />
              <span className="n">42</span> tabs
              <br />
              open!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
