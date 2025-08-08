// driver.js
document.addEventListener('DOMContentLoaded', () => {
  const requestsList = document.getElementById('requestsList');
  const driverIdSpan = document.getElementById('driverId');

  // Assign a random driver ID for this tab
  const driverId = 'drv_' + Math.floor(Math.random()*90000 + 1000);
  driverIdSpan.textContent = driverId;

  // BroadcastChannel
  const bc = new BroadcastChannel('campusauto');

  // Map setup (same center as passenger)
  const center = [30.7333, 76.7794];
  const map = L.map('map').setView(center, 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Show some autos (including this driver)
  let autos = Array.from({length:5}).map((_,i) => {
    return {
      id: 'auto_' + (i+1),
      name: 'Auto #' + (i+1),
      lat: center[0] + (Math.random()-0.5)*0.006,
      lng: center[1] + (Math.random()-0.5)*0.006,
      marker: null,
      free: true
    };
  });
  // Add this driver's marker too
  const myAuto = {
    id: driverId,
    name: 'You (Driver)',
    lat: center[0] + 0.0006,
    lng: center[1] - 0.0008,
    marker: null,
    free: true
  };
  autos.push(myAuto);

  const carIcon = L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/61/61231.png', iconSize: [32,32], iconAnchor:[16,16]});
  function drawAutos(){
    autos.forEach(a => {
      if (!a.marker) {
        a.marker = L.marker([a.lat,a.lng], { icon: carIcon }).addTo(map).bindPopup(`${a.name}`);
      } else {
        a.marker.setLatLng([a.lat,a.lng]);
      }
    });
  }
  drawAutos();
  setInterval(() => {
    autos.forEach(a => { a.lat += (Math.random()-0.5)*0.0009; a.lng += (Math.random()-0.5)*0.0009; });
    drawAutos();
  }, 1600);

  // requests storage
  let requests = [];

  function renderRequests(){
    requestsList.innerHTML = '';
    if (requests.length === 0) {
      requestsList.innerHTML = '<div style="color:#6b7280">No requests yet</div>';
      return;
    }
    requests.forEach(r => {
      const div = document.createElement('div');
      div.className = 'req-item';
      div.innerHTML = `
        <div>
          <div style="font-weight:700">${r.id}</div>
          <div style="font-size:13px;color:#374151">Pickup: ${r.pickup} • Drop: ${r.drop}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn accept" data-id="${r.id}">Accept</button>
          <button class="btn outline decline" data-id="${r.id}">Decline</button>
        </div>
      `;
      requestsList.appendChild(div);
    });

    // wire accept buttons
    Array.from(document.querySelectorAll('.accept')).forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        acceptRequest(id);
      });
    });
    Array.from(document.querySelectorAll('.decline')).forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        requests = requests.filter(x => x.id !== id);
        renderRequests();
      });
    });
  }

  function acceptRequest(requestId){
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    // send acceptance message
    const driver = { id: driverId, name: `Driver_${driverId.slice(-4)}`, eta: Math.floor(Math.random()*60)+20 };
    bc.postMessage({ type: 'ride-accepted', payload: { requestId, driver } });
    // simulate arrival after some seconds
    setTimeout(() => {
      bc.postMessage({ type: 'driver-arrived', payload: { requestId, driver } });
    }, 7000);
    // remove request locally
    requests = requests.filter(r => r.id !== requestId);
    renderRequests();
  }

  // Listen for new ride
  bc.onmessage = (ev) => {
    const { type, payload } = ev.data;
    if (type === 'new-ride') {
      // add to requests
      requests.unshift(payload);
      renderRequests();
      // optional: play sound or flash
      // flash map with a circle at center
      const circle = L.circle([payload.lat || center[0], payload.lng || center[1]], { radius: 40, color:'#f97316', fill:false }).addTo(map);
      setTimeout(()=> map.removeLayer(circle), 1400);
    }
    if (type === 'cancel-ride') {
      requests = requests.filter(r => r.id !== payload.requestId);
      renderRequests();
    }
  };

});
