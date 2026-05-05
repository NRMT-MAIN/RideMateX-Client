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
    try { console[level === 'error' ? 'error' : 'log'](msg); } catch (_) {}
  }

  function setStatus(connected) {
    connStatus.className = 'status ' + (connected ? 'connected' : 'disconnected');
    connStatus.textContent = connected ? '🟢 Connected' : '⚫ Disconnected';
  }

  function clearNotifications() {
    notificationsList.innerHTML = '<div class="empty">No notifications yet</div>';
  }

  function escapeHtml(s) {
    return ('' + s).replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[c]));
  }

  function sendRideAcceptance(driverId, bookingId) {
    if (!stompClient || !stompClient.connected) {
      log('Not connected to server', 'error');
      return;
    }

    const payload = {
      bookingId: String(bookingId),
      driverId: Number(driverId)
    };

    stompClient.send('/app/ride-acceptance', {}, JSON.stringify(payload));
    log(`Sent acceptance: ${JSON.stringify(payload)}`, 'success');
  }

  function renderRideRequest(notification) {
    const empty = notificationsList.querySelector('.empty');
    if (empty) empty.remove();

    const driverId = (driverIdEl.value || '').trim();
    const bookingId = notification.bookingId;

    const card = document.createElement('div');
    card.className = 'notif';

    card.innerHTML = `
      <strong>Booking ${escapeHtml(bookingId)}</strong>
      <div class="meta">
        Pickup: ${escapeHtml(notification.pickupLocationLatitude || 'N/A')}, ${escapeHtml(notification.pickupLocationLongitude || 'N/A')}
      </div>
      <div class="raw">${escapeHtml(JSON.stringify(notification))}</div>
      <div class="actions">
        <button class="btn-accept">Accept</button>
        <button class="btn-reject">Reject</button>
      </div>
      <div class="meta">${new Date().toLocaleTimeString()}</div>
    `;

    const acceptBtn = card.querySelector('.btn-accept');
    const rejectBtn = card.querySelector('.btn-reject');

    acceptBtn.addEventListener('click', () => {
      if (!driverId) {
        log('Driver ID is required', 'error');
        return;
      }

      acceptBtn.disabled = true;
      acceptBtn.textContent = 'Accepting...';

      try {
        sendRideAcceptance(driverId, bookingId);
        acceptBtn.textContent = 'Accepted';
        rejectBtn.disabled = true;
        card.style.borderLeftColor = '#10b981';
        card.style.opacity = '0.9';
      } catch (err) {
        acceptBtn.disabled = false;
        acceptBtn.textContent = 'Accept';
        log('Failed to send acceptance: ' + err.message, 'error');
      }
    });

    rejectBtn.addEventListener('click', () => {
      card.remove();
      log(`Rejected booking ${bookingId}`, 'info');
    });

    notificationsList.prepend(card);
  }

  function connectAndSubscribe() {
    const base = (serverUrlEl.value || '').replace(/\/+$/, '');
    const driverId = (driverIdEl.value || '').trim();

    if (!base) { log('Please enter server base URL', 'error'); return; }
    if (!driverId) { log('Please enter driver ID', 'error'); return; }

    const endpoint = base + '/ws-ridematex';
    log('Connecting to ' + endpoint);
    setStatus(false);
    subInfo.textContent = 'Subscribing...';

    try {
      const socket = new SockJS(endpoint);
      stompClient = Stomp.over(socket);
      stompClient.debug = null;

      stompClient.connect({}, () => {
        setStatus(true);
        log('Connected to STOMP server', 'success');

        const topic = '/topic/new-ride/' + encodeURIComponent(driverId);
        log('Subscribing to ' + topic);
        subInfo.textContent = 'Subscribed to: ' + topic;

        subscription = stompClient.subscribe(topic, message => {
          try {
            const data = message && message.body ? JSON.parse(message.body) : {};
            renderRideRequest(data);
            log('Received ride request for driver ' + driverId, 'success');
          } catch (e) {
            log('Failed to parse ride request: ' + e.message, 'error');
          }
        });

        connectBtn.classList.add('hidden');
        disconnectBtn.classList.remove('hidden');
      }, err => {
        setStatus(false);
        const msg = typeof err === 'string'
          ? err
          : (err && err.headers && err.headers.message) || (err && err.message) || JSON.stringify(err);
        log('STOMP connection error: ' + msg, 'error');
        subInfo.textContent = 'Not subscribed';
      });
    } catch (e) {
      setStatus(false);
      log('Connection attempt failed: ' + e.message, 'error');
      subInfo.textContent = 'Not subscribed';
    }
  }

  function disconnect() {
    try {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
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
      log('Error while disconnecting: ' + e.message, 'error');
    } finally {
      connectBtn.classList.remove('hidden');
      disconnectBtn.classList.add('hidden');
    }
  }

  connectBtn.addEventListener('click', connectAndSubscribe);
  disconnectBtn.addEventListener('click', disconnect);
  clearLogBtn.addEventListener('click', () => { logEl.innerHTML = ''; });

  clearNotifications();
  setStatus(false);
  subInfo.textContent = 'Not subscribed';
  log('Frontend ready');
})();
