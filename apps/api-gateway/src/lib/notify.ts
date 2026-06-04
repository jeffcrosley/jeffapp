const CALLMEBOT_URL = 'https://api.callmebot.com/signal/send.php';

interface NotifyTarget {
  phone: string;
  apikey: string;
}

export async function sendSignalNotification(
  target: NotifyTarget,
  message: string
): Promise<void> {
  try {
    const params = new URLSearchParams({
      phone: target.phone,
      apikey: target.apikey,
      text: message,
    });
    await fetch(`${CALLMEBOT_URL}?${params.toString()}`);
  } catch {
    console.warn('Signal notification failed — continuing');
  }
}

const COLOR_EMOJI: Record<string, string> = {
  green: '🟢',
  yellow: '🟡',
  red: '🔴',
  tap_out: '🛑',
};

const COLOR_LABEL: Record<string, string> = {
  green: 'is feeling good',
  yellow: 'needs a moment',
  red: 'is having a rough time',
  tap_out: 'is tapping out',
};

export function formatStatusMessage(senderName: string, color: string): string {
  const emoji = COLOR_EMOJI[color] ?? '⚪';
  const label = COLOR_LABEL[color] ?? color;
  return `${emoji} ${senderName} ${label}`;
}

export function formatAckMessage(
  ackerName: string,
  originalColor: string
): string {
  const emoji = COLOR_EMOJI[originalColor] ?? '⚪';
  return `✅ ${ackerName} acknowledged your ${emoji}`;
}
