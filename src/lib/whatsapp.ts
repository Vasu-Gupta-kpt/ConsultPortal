// Builds a WhatsApp "click-to-chat" link (wa.me). This is NOT the WhatsApp
// Business API -- no message is sent automatically. The link opens
// WhatsApp with the message pre-filled for whoever clicks it to send
// themselves. See the notes in src/lib/actions/peer-practice.ts for how
// this is surfaced (a "Message on WhatsApp" button after a request/accept,
// not a background push notification).
export function buildWhatsAppLink(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
