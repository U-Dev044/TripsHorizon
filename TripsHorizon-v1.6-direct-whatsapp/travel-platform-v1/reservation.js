const params = new URLSearchParams(window.location.search);
const state = {
  type: ['flights', 'hotels', 'cars'].includes(params.get('type')) ? params.get('type') : 'flights',
  from: params.get('from') || 'New York (JFK)',
  to: params.get('to') || 'Lisbon (LIS)',
  date: params.get('date') || '',
  returnDate: params.get('returnDate') || '',
  travellers: Math.min(6, Math.max(1, Number.parseInt(params.get('travellers') || '1', 10) || 1)),
  car: params.get('car') || '',
  selected: null
};
const $ = (id) => document.getElementById(id);
const today = new Date();
const dateString = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const addDays = (date, days) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + days); return dateString(d); };
if (!state.date) state.date = addDays(dateString(today), 14);
if (!state.returnDate || state.returnDate <= state.date) state.returnDate = addDays(state.date, 7);
const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const prettyDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not selected';
const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const nightsOrDays = () => Math.max(1, Math.round((new Date(`${state.returnDate}T12:00:00`) - new Date(`${state.date}T12:00:00`)) / 86400000));
const countLabel = () => `${state.travellers} ${state.travellers === 1 ? 'traveller' : 'travellers'}`;

function configureLabels() {
  const config = {
    flights: { heading: 'Flight options', from: 'FROM', to: 'TO', date: 'DEPARTURE', return: 'RETURN', guests: 'TRAVELLERS', title: 'Flight options for your journey', summary: 'Flight journey' },
    hotels: { heading: 'Places to stay', from: 'DESTINATION', to: 'AREA / HOTEL', date: 'CHECK-IN', return: 'CHECK-OUT', guests: 'GUESTS', title: 'Stay options for your trip', summary: 'Stay details' },
    cars: { heading: 'Car rental options', from: 'PICK-UP LOCATION', to: 'DROP-OFF LOCATION', date: 'PICK-UP DATE', return: 'DROP-OFF DATE', guests: 'DRIVERS', title: 'Cars for your journey', summary: 'Car rental' }
  }[state.type];
  $('searchHeading').textContent = config.heading;
  $('resFromLabel').textContent = config.from;
  $('resToLabel').textContent = config.to;
  $('resDateLabel').textContent = config.date;
  $('resReturnLabel').textContent = config.return;
  $('resGuestsLabel').textContent = config.guests;
  $('resultsTitle').textContent = config.title;
  $('summaryTitle').textContent = config.summary;
  $('summaryFromLabel').textContent = config.from;
  $('summaryToLabel').textContent = config.to;
  $('resFrom').value = state.from;
  $('resTo').value = state.to;
  $('resDate').value = state.date;
  $('resReturn').value = state.returnDate;
  $('resGuests').value = String(state.travellers);
  $('resDate').min = dateString(today);
  $('resReturn').min = state.date;
  $('resFrom').placeholder = state.type === 'hotels' ? 'City, area or hotel' : 'City or airport';
  $('resTo').placeholder = state.type === 'hotels' ? 'Optional area or hotel name' : 'City or airport';
  $('resTo').required = state.type !== 'hotels';
}

function getOptions() {
  if (state.type === 'hotels') return [
    { id: 'stay-1', name: 'The Palm House Retreat', tag: 'GUEST FAVOURITE', detail: 'Boutique resort · Breakfast available · Free cancellation on selected rates', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=85', price: 149, unit: 'per night', features: '★ 4.9 guest rating · Pool · Wi-Fi' },
    { id: 'stay-2', name: 'Azure Coast Hotel', tag: 'GREAT LOCATION', detail: 'Sea-view hotel · Flexible room choices · Restaurant and pool', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=85', price: 185, unit: 'per night', features: '★ 4.8 guest rating · Sea view · Wi-Fi' },
    { id: 'stay-3', name: 'The City Chapter', tag: 'CITY BREAK PICK', detail: 'Design hotel · Central location · Easy access to local highlights', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=85', price: 128, unit: 'per night', features: '★ 4.7 guest rating · City centre · Wi-Fi' }
  ];
  if (state.type === 'cars') return [
    { id: 'car-1', name: 'City Explorer', tag: 'CITY FAVOURITE', detail: 'Compact · Automatic · Easy parking for city streets and short trips', image: 'https://getrentacar.com/storage/cache/images/960-640-100-fit-693569.jpeg', price: 39, unit: 'per day', features: '5 seats · 2 bags · A/C' },
    { id: 'car-2', name: 'Open-Road SUV', tag: 'ADVENTURE READY', detail: 'Mid-size SUV · Automatic · Extra room for luggage and friends', image: 'https://www.nissanrent.com/media/2024/05/NRAC_Nissan-Rogue_1080x650.jpg', price: 58, unit: 'per day', features: '5 seats · 3 bags · A/C' },
    { id: 'car-3', name: 'Electric Escape', tag: 'LOW-EMISSION PICK', detail: 'Electric · Automatic · Quiet drive for modern city exploring', image: 'https://www.sustainabletourism.nz/assets/Uploads/GO-Rentals-Tesla.jpg', price: 72, unit: 'per day', features: '5 seats · 2 bags · EV' }
  ];
  return [
    { id: 'flight-1', name: 'Economy · Value fare', tag: 'LOWEST SAMPLE FARE', detail: '1 stop · Typical journey time varies by route · Economy cabin', image: '✈', price: 389, unit: 'per traveller', features: 'Carry-on included · Checked bag varies' },
    { id: 'flight-2', name: 'Economy · Flexible fare', tag: 'FLEXIBLE OPTION', detail: 'Nonstop or 1 stop depending on route · More flexible change conditions', image: '✈', price: 512, unit: 'per traveller', features: 'Carry-on included · Change terms vary' },
    { id: 'flight-3', name: 'Premium Economy', tag: 'EXTRA COMFORT', detail: 'More space and added comfort · Route and carrier dependent', image: '✈', price: 845, unit: 'per traveller', features: 'Enhanced seat · Baggage terms vary' }
  ];
}

function calculate(option) {
  if (state.type === 'flights') return option.price * state.travellers;
  return option.price * nightsOrDays();
}
function renderResults() {
  const options = getOptions();
  $('resultsCount').textContent = `${options.length} sample options`;
  $('resultsList').innerHTML = options.map(option => {
    const total = calculate(option);
    const image = state.type === 'flights'
      ? `<div class="result-image flight-art" aria-hidden="true">${option.image}</div>`
      : `<img class="result-image" src="${safe(option.image)}" alt="Example ${safe(option.name)}" loading="lazy">`;
    const selected = state.selected?.id === option.id;
    return `<article class="result-card ${selected ? 'selected' : ''}" data-option="${safe(option.id)}">
      ${image}
      <div class="result-content"><span class="result-tag">${safe(option.tag)}</span><h3>${safe(option.name)}</h3><p>${safe(option.detail)}</p><div class="result-features">${safe(option.features)}</div></div>
      <div class="result-price"><div><strong>${money(total)}</strong><small>${state.type === 'flights' ? `estimated total · ${countLabel()}` : `${money(option.price)} × ${nightsOrDays()} ${state.type === 'hotels' ? 'nights' : 'days'}`}</small></div><button class="select-option" type="button" data-select="${safe(option.id)}">${selected ? 'Selected ✓' : 'Choose option'}</button></div>
    </article>`;
  }).join('');
  document.querySelectorAll('[data-select]').forEach(button => button.addEventListener('click', () => {
    state.selected = options.find(option => option.id === button.dataset.select);
    updateSummary();
    renderResults();
  }));
  if (state.car) {
    const match = options.find(option => option.name.toLowerCase() === state.car.toLowerCase());
    if (match && !state.selected) { state.selected = match; updateSummary(); renderResults(); }
    state.car = '';
  }
}
function updateSummary() {
  $('summaryFrom').textContent = state.from || 'Not selected';
  $('summaryTo').textContent = state.to || (state.type === 'hotels' ? 'Any area' : 'Not selected');
  $('summaryDate').textContent = `${prettyDate(state.date)} – ${prettyDate(state.returnDate)}`;
  $('summaryGuests').textContent = countLabel();
  $('summaryOption').textContent = state.selected?.name || 'Choose an option';
  $('summaryTotal').textContent = state.selected ? money(calculate(state.selected)) : '$0';
  $('summaryPerPerson').textContent = state.selected ? (state.type === 'flights' ? 'Estimated total for all travellers' : `Estimated ${state.type === 'hotels' ? 'stay' : 'rental'} total`) : 'Select an option to calculate your estimate.';
  $('continueButton').disabled = !state.selected;
}

$('resSwap').addEventListener('click', () => { const from = $('resFrom'); const to = $('resTo'); [from.value, to.value] = [to.value, from.value]; });
$('resDate').addEventListener('change', () => { $('resReturn').min = $('resDate').value; if ($('resReturn').value <= $('resDate').value) $('resReturn').value = addDays($('resDate').value, 1); });
$('reservationSearchForm').addEventListener('submit', event => {
  event.preventDefault();
  state.from = $('resFrom').value.trim(); state.to = $('resTo').value.trim(); state.date = $('resDate').value; state.returnDate = $('resReturn').value; state.travellers = Number($('resGuests').value); state.selected = null;
  const next = new URLSearchParams({ type: state.type, from: state.from, to: state.to, date: state.date, returnDate: state.returnDate, travellers: String(state.travellers) });
  window.history.replaceState({}, '', `reservation.html?${next.toString()}`);
  updateSummary(); renderResults();
  $('resultsList').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('continueButton').addEventListener('click', async () => {
  if (!state.selected) return;

  // DEMO WHATSAPP NUMBER: change this fallback number to your own country code + number (digits only).
  // The Admin dashboard number is used when available; this fallback keeps the demo button working.
  const DEMO_WHATSAPP_NUMBER = '12025550147';
  let whatsappNumber = DEMO_WHATSAPP_NUMBER;
  try {
    const configResponse = await fetch('/api/public-config');
    if (configResponse.ok) {
      const config = await configResponse.json();
      if (config.whatsappNumber) whatsappNumber = String(config.whatsappNumber).replace(/[^0-9]/g, '');
    }
  } catch {}

  const typeLabel = { flights: 'Flight', hotels: 'Hotel', cars: 'Car rental' }[state.type];
  const message = [
    'Hello TripsHorizon Reception! I would like to continue with this trip enquiry:',
    `Service: ${typeLabel}`,
    `From / destination: ${state.from || 'Not specified'}`,
    `To / area: ${state.to || 'Not specified'}`,
    `Dates: ${prettyDate(state.date)} to ${prettyDate(state.returnDate)}`,
    `Travellers / guests / drivers: ${state.travellers}`,
    `Selected option: ${state.selected.name}`,
    `Estimated total: ${money(calculate(state.selected))}`,
    'Please confirm availability, final pricing and the next steps.'
  ].join('\\n');

  window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
});
$('travellerForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!state.selected) return;
  const button = $('travellerForm').querySelector('button[type="submit"]');
  button.disabled = true; button.textContent = 'Creating reservation request…';
  const payload = { type: state.type, name: $('fullName').value.trim(), email: $('emailAddress').value.trim(), phone: $('phoneNumber').value.trim(), from: state.from, to: state.to, date: state.date, returnDate: state.returnDate, travellers: state.travellers, option: state.selected.name, amount: calculate(state.selected), currency: 'USD' };
  try {
    const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'We could not save your reservation request.');
    window.location.href = `payment.html?${new URLSearchParams({ ref: data.booking.reference })}`;
  } catch (error) {
    const box = $('reservationConfirmation'); box.hidden = false; box.textContent = `${error.message} Please check your connection and try again.`;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' }); button.disabled = false; button.textContent = 'Create reservation request →';
  }
});

configureLabels();
updateSummary();
renderResults();
