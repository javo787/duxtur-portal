/**
 * Browser side of "continue as the person who is signed in to Duxtur Edu".
 *
 * Duxtur Edu is mounted on the same origin (duxtur.org/edu) and keeps its Firebase session in this origin's storage.
 * A page of the portal opens /edu/auth-bridge in a hidden frame; that page waits for Firebase to restore the session
 * and answers with a postMessage that holds the Firebase ID token. Both ends check the origin: the answer is only
 * ever posted to, and accepted from, this very origin, so no other site can ask for the token.
 *
 * The token is a request to the server, not a fact: the server verifies it before anybody is signed in.
 */

export const EDU_BRIDGE_PATH = '/edu/auth-bridge';
export const EDU_BRIDGE_MESSAGE = 'duxtur:edu-bridge';

export interface EduSession {
  idToken: string;
  /** Shown on the button only; the account's name comes from the server. */
  name: string;
  image: string;
}

/** What the frame says: signed in with a token, or not signed in. Anything else is ignored. */
export function parseBridgeMessage(data: unknown): { signedIn: false } | ({ signedIn: true } & EduSession) | null {
  if (!data || typeof data !== 'object') return null;
  const message = data as Record<string, unknown>;
  if (message.type !== EDU_BRIDGE_MESSAGE) return null;
  if (message.signedIn !== true) return { signedIn: false };
  if (typeof message.idToken !== 'string' || message.idToken.length === 0 || message.idToken.length > 8192) return null;
  return {
    signedIn: true,
    idToken: message.idToken,
    name: typeof message.name === 'string' ? message.name.slice(0, 100) : '',
    image: typeof message.image === 'string' && /^https:\/\//.test(message.image) ? message.image : '',
  };
}

const TIMEOUT_MS = 6000;
const REMEMBER_MS = 60 * 1000;

let pending: Promise<EduSession | null> | null = null;
let remembered: { at: number; session: EduSession | null } | null = null;

/**
 * Asks the Edu app for the session of this browser. One frame serves every caller on the page, and the answer is
 * kept for a minute so that a form and a button on the same page do not load Edu twice.
 * Resolves null when nobody is signed in to Edu here, or Edu does not answer in time.
 */
export function loadEduSession(): Promise<EduSession | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (remembered && Date.now() - remembered.at < REMEMBER_MS) return Promise.resolve(remembered.session);
  if (pending) return pending;

  pending = new Promise<EduSession | null>(resolve => {
    const frame = document.createElement('iframe');
    frame.src = EDU_BRIDGE_PATH;
    frame.title = 'Duxtur Edu';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden;';

    const finish = (session: EduSession | null) => {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      frame.remove();
      remembered = { at: Date.now(), session };
      pending = null;
      resolve(session);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.contentWindow) return;
      const message = parseBridgeMessage(event.data);
      if (!message) return;
      finish(message.signedIn ? { idToken: message.idToken, name: message.name, image: message.image } : null);
    };

    window.addEventListener('message', onMessage);
    const timer = setTimeout(() => finish(null), TIMEOUT_MS);
    document.body.appendChild(frame);
  });
  return pending;
}

/** Forget what the frame said (after signing out, or when the token was refused). */
export function forgetEduSession() {
  remembered = null;
}
