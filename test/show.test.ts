import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseShowDetails } from '../src/services/show.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

describe('parseShowDetails', () => {
  it('parses show details correctly', () => {
    const html = readFileSync(join(fixturesDir, 'show-detail.html'), 'utf-8');
    const details = parseShowDetails(html);

    expect(details.dj).toBe('DJ Deceitful');
    expect(details.showDate).toBe('3/29/24');
    expect(details.showTime).toBe('8:00 AM - 10:00 AM');
    expect(details.startTime.getFullYear()).toBe(2024);
    expect(details.startTime.getMonth()).toBe(2); // March
    expect(details.startTime.getDate()).toBe(29);
    expect(details.startTime.getHours()).toBe(8);
    expect(details.startTime.getMinutes()).toBe(0);
  });

  it('handles missing DJ gracefully', () => {
    const html = `
      <html>
      <body>
        <table>
          <tr>
            <th class="redlabel">3/29/24<br>8:00 AM - 10:00 AM<br>Weekly View</th>
          </tr>
        </table>
      </body>
      </html>
    `;
    const details = parseShowDetails(html);
    expect(details.dj).toBe('');
    expect(details.showDate).toBe('3/29/24');
    expect(details.showTime).toBe('8:00 AM - 10:00 AM');
  });

  it('extracts PM show times correctly', () => {
    const html = `
      <html>
      <body>
        <table>
          <tr>
            <th class="redlabel">1/15/24<br>6:00 PM - 8:00 PM<br>Weekly View</th>
            <th class="redlabel">Disc Jockey: Night Owl</th>
          </tr>
        </table>
      </body>
      </html>
    `;
    const details = parseShowDetails(html);
    expect(details.showTime).toBe('6:00 PM - 8:00 PM');
    expect(details.startTime.getHours()).toBe(18); // 6 PM = 18:00
    expect(details.dj).toBe('Night Owl');
  });
});
