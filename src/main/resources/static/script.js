// script.js - connect to /ws-ridematex, subscribe /topic/new-ride/{driverId}
// clicking Accept sends to /app/ride-acceptance { driverId, bookingId }

(function () {
  const serverUrlEl = document.getElementById('serverUrl');
  const driverIdEl = document.getElementById('driverId');
  const connectBtn = document.getElementById('connectBtn');
  const disconnectBtn = document.getElementById('disconnectBtn');
  const connStatus = document.getElementById('connStatus');
  const notificationsList = document.getElementById('notificationsList');
  const logEl = document.getElementById('log');
  const clearLogBtn = document.getElementById('clearLog');
  const subInfo = document.getElementById('subInfo');

  let stompClient = null;
  let subscription = null;

  function log(msg, level = 'info') {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.textContent = `[${time}] ${msg}`;
    if (level === 'error') entry.style.color = '#fca5a5';
    if (level === 'success') entry.style.color = '#86efac';
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
    try { console[level === 'error' ? 'error' : 'log'](msg); } catch(e){}
  }

  function setStatus(connected) {
    if (connected) {
      connStatus.className = 'status connected';
      connStatus.textContent = '🟢 Connected';
    } else {
      connStatus.className = 'status disconnected';
      connStatus.textContent = '⚫ Disconnected';
    }
  }

  function clearNotifications() {
    notificationsList.innerHTML = '<div class="empty">No notifications yet</div>';
  }

  function addNotification(obj) {
    const empty = notificationsList.querySelector('.empty');
    if (empty) empty.remove();

    const el = document.createElement('div');
    el.className = 'notif';

    const booking = obj.bookingId ?? obj.booking_id ?? 'N/A';
    const lat = obj.pickupLocationLatitude ?? obj.pickup_location_latitude ?? '';
    const lon = obj.pickupLocationLongitude ?? obj.pickup_location_longitude ?? '';

    // Unique element id to update after accept
    const elId = 'notif-' + Date.now() + '-' + Math.floor(Math.random()*1000);

    el.innerHTML = `
      <strong>Booking ${escapeHtml(booking)}</strong>
      <div class="meta">${lat || lon ? 'Pickup: ' + escapeHtml(lat) + ', ' + escapeHtml(lon) : ''}</div>
      <div class="raw">${escapeHtml(JSON.stringify(obj))}</div>
      <div class="actions">
        <button class="btn-accept" data-booking="${escapeHtml(booking)}">Accept</button>
        <button class="btn-reject" data-booking="${escapeHtml(booking)}">Reject</button>
      </div>
      <div class="meta" style="margin-top:8px">Received: ${new Date().toLocaleTimeString()}</div>
    `;
    el.id = elId;
    notificationsList.insertBefore(el, notificationsList.firstChild);

    // Attach handlers
    const acceptBtn = el.querySelector('.btn-accept');
    const rejectBtn = el.querySelector('.btn-reject');

    acceptBtn.addEventListener('click', async () => {
      const bookingId = acceptBtn.getAttribute('data-booking');
      const driverId = (driverIdEl.value || '').trim();
      if (!driverId) { log('Driver ID required to accept', 'error'); return; }
      acceptBtn.disabled = true;
      acceptBtn.textContent = 'Accepting...';
      log(`Sending acceptance: driver=${driverId}, booking=${bookingId}`);
      try {
        // send STOMP message to /app/ride-acceptance
        if (!stompClient || !stompClient.connected) {
          throw new Error('Not connected');
        }
        const payload = {
          driverId: parseInt(driverId, 10),
          bookingId: parseInt(bookingId, 10)
        };
        stompClient.send('/app/ride-acceptance', {}, JSON.stringify(payload));
        log('Ride acceptance sent', 'success');

        // Immediately update UI (optimistic)
        acceptBtn.textContent = 'Accepted';
        acceptBtn.disabled = true;
        rejectBtn.disabled = true;
        el.style.opacity = '0.9';
        el.style.borderLeftColor = '#10b981';
      } catch (err) {
        acceptBtn.disabled = false;
        acceptBtn.textContent = 'Accept';
        log('Failed to send acceptance: ' + (err && err.message ? err.message : err), 'error');
      }
    });

    rejectBtn.addEventListener('click', () => {
      // simple client-side remove for reject
      el.remove();
      log('Rejected booking ' + booking);
    });

    // Keep list bounded
    while (notificationsList.children.length > 50) notificationsList.removeChild(notificationsList.lastChild);
  }

  function escapeHtml(s) {
    return ('' + s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function connectAndSubscribe() {
    const base = (serverUrlEl.value || '').replace(/\/+$/, '');
    const id = (driverIdEl.value || '').trim();

    if (!base) { log('Please enter server base URL', 'error'); return; }
    if (!id) { log('Please enter driverId', 'error'); return; }

    const endpoint = base + '/ws-ridematex';
    log('Connecting to ' + endpoint);
    setStatus(false);
    subInfo.textContent = 'Subscribing...';

    try {
      const socket = new SockJS(endpoint);
      stompClient = Stomp.over(socket);
      stompClient.debug = null;

      stompClient.connect({}, frame => {
        setStatus(true);
        log('Connected to STOMP server', 'success');

        const topic = '/topic/new-ride/' + encodeURIComponent(id);
        log('Subscribing to ' + topic);
        subInfo.textContent = 'Subscribed to: ' + topic;

        subscription = stompClient.subscribe(topic, message => {
          try {
            const body = message && message.body ? JSON.parse(message.body) : {};
            addNotification(body);
            log('Received notification for driver ' + id, 'success');
          } catch (e) {
            log('Failed to parse message body: ' + (e && e.message ? e.message : e), 'error');
          }
        });

        connectBtn.classList.add('hidden');
        disconnectBtn.classList.remove('hidden');
      }, rawErr => {
        setStatus(false);
        let msg;
        try {
          if (typeof rawErr === 'string') msg = rawErr;
          else if (rawErr && rawErr.headers && rawErr.headers.message) msg = rawErr.headers.message;
          else if (rawErr && rawErr.message) msg = rawErr.message;
          else msg = JSON.stringify(rawErr);
        } catch (e) { msg = String(rawErr); }
        log('STOMP connection error: ' + msg, 'error');
        subInfo.textContent = 'Not subscribed';
      });
    } catch (e) {
      setStatus(false);
      log('Connection attempt failed: ' + (e && e.message ? e.message : e), 'error');
      subInfo.textContent = 'Not subscribed';
    }
  }

  function disconnect() {
    try {
      if (subscription) { subscription.unsubscribe(); subscription = null; }
      if (stompClient && stompClient.connected) {
        stompClient.disconnect(() => {
          setStatus(false);
          log('Disconnected', 'info');
          subInfo.textContent = 'Not subscribed';
        });
      } else {
        setStatus(false);
        subInfo.textContent = 'Not subscribed';
      }
    } catch (e) {
      log('Error while disconnecting: ' + (e && e.message ? e.message : e), 'error');
    } finally {
      connectBtn.classList.remove('hidden');
      disconnectBtn.classList.add('hidden');
    }
  }

  // DOM binds
  connectBtn.addEventListener('click', connectAndSubscribe);
  disconnectBtn.addEventListener('click', disconnect);
  clearLogBtn.addEventListener('click', () => { logEl.innerHTML = ''; });

  // initial
  clearNotifications();
  setStatus(false);
  subInfo.textContent = 'Not subscribed';
  log('Frontend ready');
})();
