const toast = document.getElementById('toast');
let toastTimer;
function notify(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),3400)}
const dateField=document.getElementById('dateField');
const today=new Date();
const localDate=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
dateField.min=localDate;
const tomorrow=new Date(today);tomorrow.setDate(tomorrow.getDate()+14);
dateField.value=new Date(tomorrow.getTime()-tomorrow.getTimezoneOffset()*60000).toISOString().slice(0,10);
let activeTab='flights';
const tabs=[...document.querySelectorAll('.tab')];
tabs.forEach(tab=>tab.addEventListener('click',()=>{
  tabs.forEach(t=>{t.classList.toggle('active',t===tab);t.setAttribute('aria-selected',String(t===tab))});
  activeTab=tab.dataset.tab;
  const from=document.getElementById('fromField'),to=document.getElementById('toField');
  const fromLabel=document.getElementById('fromLabel'),toLabel=document.getElementById('toLabel'),dateLabel=document.getElementById('dateLabel'),travellersLabel=document.getElementById('travellersLabel');
  if(activeTab==='hotels') {fromLabel.textContent='DESTINATION';toLabel.textContent='AREA (OPTIONAL)';dateLabel.textContent='CHECK-IN';travellersLabel.textContent='GUESTS';from.placeholder='City, area or hotel';from.value='Lisbon, Portugal';to.placeholder='Neighbourhood';to.value='';}
  else if(activeTab==='cars'){fromLabel.textContent='PICK-UP LOCATION';toLabel.textContent='DROP-OFF LOCATION';dateLabel.textContent='PICK-UP DATE';travellersLabel.textContent='DRIVERS';from.placeholder='Pick-up city';from.value='Lisbon Airport';to.placeholder='Drop-off location';to.value='Lisbon Airport';}
  else {fromLabel.textContent='FROM';toLabel.textContent='TO';dateLabel.textContent='DEPARTURE';travellersLabel.textContent='TRAVELLERS';from.placeholder='City or airport';from.value='New York (JFK)';to.placeholder='Where to?';to.value='Lisbon (LIS)';}
}));
document.getElementById('swapBtn').addEventListener('click',()=>{const a=document.getElementById('fromField'),b=document.getElementById('toField');const temp=a.value;a.value=b.value;b.value=temp});
document.getElementById('travelSearch').addEventListener('submit',e=>{e.preventDefault();const from=document.getElementById('fromField').value.trim(),to=document.getElementById('toField').value.trim(),date=dateField.value,travellers=document.getElementById('travellersField').value;const params=new URLSearchParams({type:activeTab,from,to,date,travellers});window.location.href=`reservation.html?${params.toString()}`;});
document.getElementById('newsletterForm').addEventListener('submit',e=>{e.preventDefault();const email=document.getElementById('emailField').value;notify(`Thanks! ${email} has been added to this demo sign-up flow.`);e.target.reset()});
document.getElementById('menuToggle').addEventListener('click',()=>{const nav=document.getElementById('mainNav');const open=nav.classList.toggle('open');document.getElementById('menuToggle').setAttribute('aria-expanded',String(open))});
document.getElementById('signInBtn').addEventListener('click',()=>notify('Sign-in and account creation will be added in the next development phase.'));
document.getElementById('joinBtn').addEventListener('click',()=>notify('Welcome! Account registration is planned for the next phase.'));
document.getElementById('currencyBtn').addEventListener('click',()=>notify('Currency selector is a planned feature. Prices shown are illustrative USD amounts.'));

// Car-rental showcase actions: route the selected example into the car search tab.
document.querySelectorAll('[data-car-search], .car-book').forEach(button=>button.addEventListener('click',e=>{
  e.preventDefault();
  const carName=button.dataset.car;
  const carsTab=document.querySelector('.tab[data-tab="cars"]');
  carsTab.click();
  document.getElementById('fromField').focus();
  if(carName){const params=new URLSearchParams({type:'cars',from:'Lisbon Airport',to:'Lisbon Airport',car:carName});window.location.href=`reservation.html?${params.toString()}`;}
  else document.getElementById('search').scrollIntoView({behavior:'smooth',block:'center'});
}));

// Gentle entrance transitions as content enters the viewport.
document.documentElement.classList.add('reveal-ready');
const revealTargets = document.querySelectorAll('.section-heading, .destination-card, .deal-banner, .stay-card, .car-card, .newsletter, .trust-row, .search-card');
revealTargets.forEach((element, index) => {
  element.classList.add('reveal');
  if (element.matches('.destination-card, .stay-card, .car-card')) element.classList.add(`reveal-delay-${(index % 3) + 1}`);
});
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
  revealTargets.forEach(element => revealObserver.observe(element));
} else {
  revealTargets.forEach(element => element.classList.add('is-visible'));
}

// Floating TripsHorizon quick-answer assistant.
const chatLauncher = document.getElementById('thChatLauncher');
const chatPanel = document.getElementById('thChatPanel');
const chatClose = document.getElementById('thChatClose');
const chatMessages = document.getElementById('thChatMessages');
const chatForm = document.getElementById('thChatForm');
const chatInput = document.getElementById('thChatInput');
function setChatOpen(open) {
  chatPanel.classList.toggle('open', open);
  chatLauncher.setAttribute('aria-expanded', String(open));
  if (open) setTimeout(() => chatInput.focus(), 180);
}
function addChatMessage(text, who='bot') {
  const message = document.createElement('div');
  message.className = `th-chat-message ${who}`;
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function getQuickAnswer(raw) {
  const q = raw.toLowerCase();
  if (/\b(hello|hi|hey|good morning|good afternoon|good evening)\b/.test(q))
    return 'Hello! 😊 Tell me what kind of adventure you have in mind. I can point you towards flights, places to stay, car rentals or destination inspiration.';
  if (/flight|airline|airport|fly|ticket/.test(q))
    return 'For flights, choose the Flights tab in the search panel, enter your departure city and destination, then select your travel date and traveller count. Tap Search to continue. Flight results are demo-only for now; live airline inventory is not connected yet.';
  if (/hotel|stay|accommodation|resort|room/.test(q))
    return 'Looking for a place to stay? Choose the Stays tab in the search panel and enter your destination. You can also browse our sample stays further down this page. Their displayed rates are examples, not live availability.';
  if (/car|rent|vehicle|drive|suv/.test(q))
    return 'Ready for the road? Visit the Cars section to compare our example City Explorer, Open-Road SUV and Electric Escape. Choose Cars in the search panel to enter a pick-up location and date. Rental inventory and prices are illustrative until a supplier is connected.';
  if (/destination|where|place|country|city|visit|travel idea|inspiration/.test(q))
    return 'For destination inspiration, explore Santorini, Bali, Dubai and Cinque Terre in our Explore section. Share your travel month, budget and the kind of trip you enjoy, and I can suggest a direction. These are general suggestions, not live travel advisories.';
  if (/plan|itinerary|trip|holiday|vacation|budget/.test(q))
    return 'Let’s shape your trip! Start with your destination, travel dates, approximate budget and who is travelling. I can help organise a sample itinerary and point you to the flight, stay and car search sections. What destination are you considering?';
  if (/cancel|refund|change|booking|reservation|payment/.test(q))
    return 'Bookings, cancellations and refunds are not active in this prototype yet, so no payment or reservation can be made here. Once booking partners and secure payment services are connected, this assistant can guide customers through those steps.';
  if (/support|contact|human|agent|help/.test(q))
    return 'I can answer basic questions about the demo website. For a real booking or urgent travel issue, please contact the travel provider directly until TripsHorizon support is fully set up.';
  if (/price|cost|cheap|deal|discount/.test(q))
    return 'You can browse the Deals section and compare the sample hotel and car prices shown on this page. Please treat all displayed prices as illustrative: live rates, taxes and availability are not connected yet.';
  return 'I can help with trip planning, destination ideas, flights, hotels and car rentals. Try asking “Help me plan a trip”, “How do I search flights?” or “I need to rent a car”.';
}
const chatHistory = [];
async function sendChatQuestion(question) {
  const cleaned = question.trim();
  if (!cleaned) return;
  addChatMessage(cleaned, 'user');
  chatHistory.push({ role: 'user', content: cleaned });
  chatInput.value = '';
  chatInput.disabled = true;
  const sendButton = chatForm.querySelector('button[type="submit"]');
  if (sendButton) sendButton.disabled = true;
  const typing = document.createElement('div');
  typing.className = 'th-chat-message bot th-chat-typing';
  typing.textContent = 'Thinking…';
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory.slice(-12) })
    });
    if (!response.ok) throw new Error(`Assistant service returned ${response.status}`);
    const data = await response.json();
    if (!data.reply) throw new Error('No assistant reply received');
    typing.remove();
    addChatMessage(data.reply, 'bot');
    chatHistory.push({ role: 'assistant', content: data.reply });
  } catch (error) {
    typing.remove();
    const answer = getQuickAnswer(cleaned) + '\n\nFor live AI answers, start the TripsHorizon server and add your OpenAI API key using the setup instructions in README.md.';
    addChatMessage(answer, 'bot');
    chatHistory.push({ role: 'assistant', content: answer });
  } finally {
    chatInput.disabled = false;
    if (sendButton) sendButton.disabled = false;
    chatInput.focus();
  }
}
chatLauncher.addEventListener('click', () => setChatOpen(!chatPanel.classList.contains('open')));
chatClose.addEventListener('click', () => setChatOpen(false));
chatForm.addEventListener('submit', event => {
  event.preventDefault();
  sendChatQuestion(chatInput.value);
});
document.querySelectorAll('#thChatQuick [data-question]').forEach(button => {
  button.addEventListener('click', () => sendChatQuestion(button.dataset.question));
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && chatPanel.classList.contains('open')) setChatOpen(false);
});
