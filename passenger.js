// passenger.js
// Uses BroadcastChannel 'campusauto' to broadcast new-ride requests.
// Also displays moving autos on the map (simulated).

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const requestBtn = document.getElementById('requestBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const statusText = document.getElementById('statusText');
  const autosList = document.getElementById('autosList');
  const pickupInput = document.getElementById('pickupInput');
  const dropInput = document.getElementById('dropInput');

  // Broadcast channel
  const bc = new BroadcastChannel('campusauto');

  // Map center - sample campus coords (adjust as you like)
  const center = [30.7333, 76.7794];

  const map = L.map('map', { zoomControl: true }).setView(center, 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // simulated autos array
  let autos = Array.from({length:6}).map((_,i) => {
    return {
      id: 'auto_' + (i+1),
      name: 'Auto #' + (i+1),
      lat: center[0] + (Math.random()-0.5)*0.006,
      lng: center[1] + (Math.random()-0.5)*0.006,
      marker: null,
      free: true
    }
  });

  // create markers
  const carIcon = L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/743/743922.png', iconSize: [32,32], iconAnchor:[16,16] });
  function drawAutos(){
    autosList.innerHTML = '';
    autos.forEach(a => {
      if (!a.marker) {
        a.marker = L.marker([a.lat,a.lng], { icon: carIcon }).addTo(map).bindPopup(`${a.name}`);
      } else {
        a.marker.setLatLng([a.lat,a.lng]);
      }
      const li = document.createElement('li');
      li.style.padding = '6px 0';
      li.innerHTML = `<strong>${a.name}</strong> — ${a.free ? '<span style="color:green">Free</span>' : '<span style="color:orange">Busy</span>'}`;
      autosList.appendChild(li);
    });
  }
  drawAutos();

  // animate autos slightly
  function moveAutos(){
    autos.forEach(a => {
      a.lat += (Math.random()-0.5)*0.0008;
      a.lng += (Math.random()-0.5)*0.0008;
    });
    drawAutos();
  }
  setInterval(moveAutos, 1400);

  // active request state
  let activeRequest = null;

  requestBtn.addEventListener('click', () => {
    if (activeRequest) return;
    const id = 'r_' + Date.now();
    activeRequest = {
      id,
      pickup: pickupInput.value || 'Main Gate',
      drop: dropInput.value || 'Hostel',
      createdAt: Date.now(),
      status: 'pending'
    };
    // broadcast
    bc.postMessage({ type: 'new-ride', payload: activeRequest });
    statusText.innerHTML = `Requested — waiting for driver to accept (id: ${id})`;
    requestBtn.disabled = true;
    cancelBtn.disabled = false;
  });

  cancelBtn.addEventListener('click', () => {
    if (!activeRequest) return;
    bc.postMessage({ type: 'cancel-ride', payload: { requestId: activeRequest.id } });
    statusText.innerHTML = 'No active request';
    activeRequest = null;
    requestBtn.disabled = false;
    cancelBtn.disabled = true;
  });
  // initially disable cancel
  cancelBtn.disabled = true;

  // listen for driver messages
  bc.onmessage = (ev) => {
    const { type, payload } = ev.data;
    if (type === 'ride-accepted' && activeRequest && payload.requestId === activeRequest.id) {
      activeRequest.status = 'accepted';
      activeRequest.driver = payload.driver;
      statusText.innerHTML = `Accepted by ${payload.driver.name}. ETA: ${payload.driver.eta}s`;
    }
    if (type === 'driver-arrived' && activeRequest && payload.requestId === activeRequest.id) {
      activeRequest.status = 'arrived';
      statusText.innerHTML = `Driver arrived (${payload.driver.name}). Enjoy your ride!`;
      // auto-clear after short delay
      setTimeout(() => {
        activeRequest = null;
        statusText.innerHTML = 'No active request';
        requestBtn.disabled = false;
        cancelBtn.disabled = true;
      }, 5000);
    }
  };

});
