/**
 * Encodes the HyperFrames master render into the landing page's web video and poster.
 *   cd video/promo && npx hyperframes render -o renders/master.mp4 && cd ../.. && npm run demo-encode
 */
import { execFileSync } from 'node:child_process';

const master = 'video/promo/renders/master.mp4';
const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', master, ...args], { stdio: 'inherit' });
ff(['-vf', 'scale=1600:900:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-movflags', '+faststart', '-an', 'public/demo/qr-studio-demo.mp4']);
ff(['-vf', 'scale=1600:900:flags=lanczos', '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1', '-an', 'public/demo/qr-studio-demo.webm']);
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '26.8', '-i', master, '-frames:v', '1', '-vf', 'scale=1600:900', '-q:v', '4', 'public/demo/qr-studio-demo.jpg'], { stdio: 'inherit' });
console.log('wrote public/demo/qr-studio-demo.{mp4,webm,jpg}');
