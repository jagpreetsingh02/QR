import { Icon } from '../../components/Icon';
import type { IconName } from '../../components/Icon';
import { Reveal } from '../Reveal';

const STEPS: Array<[IconName, string, string]> = [
  ['wifi', 'You type', 'Network name and password, in a form on this page.'],
  ['sparkle', 'This tab encodes', 'The payload and the QR modules are computed in your browser.'],
  ['download', 'Your device saves', 'PNG or SVG is written straight to your downloads.'],
];

const FACTS: Array<[IconName, string]> = [
  ['cloud-off', 'No server, no upload, no analytics.'],
  ['lock', 'Payloads never go into the URL, so links stay safe to share.'],
  ['history', 'Recent codes live in this browser’s storage. Clear them any time.'],
];

export function PrivacySection() {
  return (
    <section className="lp-section lp-privacy" id="privacy" aria-labelledby="privacy-title">
      <div className="container">
        <Reveal className="lp-section__head">
          <h2 id="privacy-title" className="type-display-l">
            Your Wi-Fi password never leaves this tab.
          </h2>
          <p className="type-body-l">There is no backend to send it to. The whole product is the page you are reading.</p>
        </Reveal>

        <div className="lp-privacy__diagram">
          <div className="lp-tab" aria-label="Everything happens inside this browser tab" role="group">
            <div className="lp-tab__bar" aria-hidden="true">
              <span />
              <span />
              <span />
              <b>qr-studio · this tab</b>
            </div>
            <ol className="lp-tab__flow">
              {STEPS.map(([icon, title, body]) => (
                <li key={title}>
                  <span className="lp-tab__icon">
                    <Icon name={icon} size={22} />
                  </span>
                  <strong>{title}</strong>
                  <span>{body}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="lp-privacy__server" aria-hidden="true">
            <span className="lp-privacy__wire" />
            <span className="lp-privacy__cloud">
              <Icon name="cloud-off" size={30} />
              <span>No server</span>
            </span>
          </div>
        </div>

        <ul className="lp-privacy__facts">
          {FACTS.map(([icon, text]) => (
            <li key={text}>
              <Icon name={icon} size={20} />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
