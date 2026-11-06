const q = new URLSearchParams(location.search), ref = q.get('ref');
const $ = id => document.getElementById(id);
const money = (amount, currency='USD') => new Intl.NumberFormat('en-US', { style:'currency', currency, maximumFractionDigits:2 }).format(Number(amount)||0);
const photos = { santorini:'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=85', bali:'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=85', dubai:'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=85', 'cinque terre':'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=85' };
function renderBooking(b) {
  $('packageTitle').textContent = `${b.to || b.from || 'Travel'} reservation`; $('bookingReference').textContent = b.reference;
  $('bookingType').textContent = ({flights:'Flight',hotels:'Hotel stay',cars:'Car rental',package:'Travel package'})[b.type] || b.type;
  $('bookingFrom').textContent = b.from || '—'; $('bookingTo').textContent = b.to || '—';
  $('bookingDates').textContent = [b.date, b.returnDate].filter(Boolean).join(' – ') || 'To be confirmed';
  $('bookingGuests').textContent = `${b.travellers || 1}`; $('paymentPackage').textContent = b.option || '—';
  $('paymentTotal').textContent = money(b.amount, b.currency); $('bookingStatus').textContent = String(b.status || 'awaiting_reception').replaceAll('_',' ').toUpperCase();
  const place = String(b.to || b.from || '').toLowerCase(); const image = Object.entries(photos).find(([key]) => place.includes(key))?.[1] || photos.santorini;
  $('paymentImage').style.backgroundImage = `url("${image}")`;
  window.bookingWhatsappMessage = `Hello TripsHorizon Reception, I would like to continue with my reservation.\n\nBooking reference: ${b.reference}\nType: ${b.type}\nFrom: ${b.from}\nTo: ${b.to || 'N/A'}\nDates: ${b.date || 'TBC'} to ${b.returnDate || 'TBC'}\nTravellers/guests: ${b.travellers}\nOption: ${b.option}\nEstimated amount: ${money(b.amount,b.currency)}\n\nPlease confirm availability, final price and the official payment instructions.`;
}
async function init() {
  if (!ref) { $('bookingReference').textContent = 'No reference provided'; $('whatsappHelp').textContent = 'Please submit the reservation form first.'; return; }
  try {
    const [bookingResponse, configResponse] = await Promise.all([fetch(`/api/bookings/${encodeURIComponent(ref)}`), fetch('/api/public-config')]);
    const bookingData = await bookingResponse.json(), config = await configResponse.json();
    if (!bookingResponse.ok) throw new Error(bookingData.error || 'Reservation not found.');
    renderBooking(bookingData.booking);
    const number = String(config.whatsappNumber || '').replace(/\D/g,'');
    if (number) {
      $('whatsappButton').href = `https://wa.me/${number}?text=${encodeURIComponent(window.bookingWhatsappMessage)}`;
      $('whatsappButton').removeAttribute('aria-disabled'); $('whatsappHelp').textContent = `You will chat with ${config.receptionName || 'TripsHorizon Reception'}. WhatsApp opens in a new tab.`;
      $('receptionIntro').textContent = `${config.receptionName || 'Our reception team'} will assist you personally with availability, final pricing and payment instructions.`;
    } else { $('whatsappButton').removeAttribute('href'); $('whatsappButton').setAttribute('aria-disabled','true'); $('whatsappHelp').textContent = 'WhatsApp reception is not configured yet. Please ask the site administrator to add the official number.'; }
  } catch (error) { $('bookingReference').textContent = 'Could not load'; $('whatsappHelp').textContent = error.message; }
}
$('whatsappButton').addEventListener('click', event => { if ($('whatsappButton').getAttribute('aria-disabled') === 'true') event.preventDefault(); });
init();
