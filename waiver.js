// --- Signature Canvas ---
var canvas = document.getElementById('sigCanvas');
var ctx = canvas.getContext('2d');
var drawing = false;
var hasSigned = false;

function resizeCanvas() {
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * (window.devicePixelRatio || 1);
  canvas.height = rect.height * (window.devicePixelRatio || 1);
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1d1d1f';
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function getPos(e) {
  var rect = canvas.getBoundingClientRect();
  var t = e.touches ? e.touches[0] : e;
  return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

canvas.addEventListener('mousedown', function(e) { startDraw(e); });
canvas.addEventListener('mousemove', function(e) { draw(e); });
canvas.addEventListener('mouseup', function() { stopDraw(); });
canvas.addEventListener('mouseleave', function() { stopDraw(); });
canvas.addEventListener('touchstart', function(e) { e.preventDefault(); startDraw(e); }, { passive: false });
canvas.addEventListener('touchmove', function(e) { e.preventDefault(); draw(e); }, { passive: false });
canvas.addEventListener('touchend', function() { stopDraw(); });

function startDraw(e) {
  drawing = true;
  var pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}
function draw(e) {
  if (!drawing) return;
  hasSigned = true;
  var pos = getPos(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}
function stopDraw() { drawing = false; }

function clearSignature() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasSigned = false;
}

// --- Set default rental date to today ---
(function() {
  var d = new Date();
  var str = d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
  document.getElementById('rentalDate').value = str;
})();

// --- Phone formatting ---
document.getElementById('riderPhone').addEventListener('input', function(e) {
  var digits = e.target.value.replace(/\D/g, '').substring(0, 10);
  var formatted = '';
  if (digits.length > 0) formatted = '(' + digits.substring(0, 3);
  if (digits.length >= 3) formatted += ') ';
  if (digits.length > 3) formatted += digits.substring(3, 6);
  if (digits.length >= 6) formatted += '-' + digits.substring(6);
  e.target.value = formatted;
});

// --- Validation & Submit ---
function submitWaiver() {
  var msg = document.getElementById('statusMsg');
  msg.textContent = '';

  var name = document.getElementById('riderName').value.trim();
  var email = document.getElementById('riderEmail').value.trim();
  var phone = document.getElementById('riderPhone').value.trim();
  var date = document.getElementById('rentalDate').value;

  if (!name || !email || !phone || !date) {
    msg.textContent = 'Please fill in all fields.';
    return;
  }

  var checks = ['agreeTerms', 'agreeAge', 'agreeRisk'];
  for (var i = 0; i < checks.length; i++) {
    if (!document.getElementById(checks[i]).checked) {
      msg.textContent = 'Please check all boxes to continue.';
      return;
    }
  }

  if (!hasSigned) {
    msg.textContent = 'Please sign above to continue.';
    return;
  }

  // Build the record
  var sigData = canvas.toDataURL('image/png');
  var now = new Date();
  var record = {
    name: name,
    email: email,
    phone: phone,
    rentalDate: date,
    signedAt: now.toISOString(),
    signedAtLocal: now.toLocaleString(),
    signature: sigData
  };

  // Store locally
  var waivers = JSON.parse(localStorage.getItem('rnb_waivers') || '[]');
  waivers.push(record);
  localStorage.setItem('rnb_waivers', JSON.stringify(waivers));

  // Send waiver confirmation to Ride Newport Beach via email
  var dateStr = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  var subject = encodeURIComponent('Waiver Signed — ' + name);
  var body = encodeURIComponent(
    'Rental Waiver Signed\n\n' +
    'Name: ' + name + '\n' +
    'Email: ' + email + '\n' +
    'Phone: ' + phone + '\n' +
    'Rental Date: ' + dateStr + '\n' +
    'Signed At: ' + now.toLocaleString() + '\n\n' +
    'All terms accepted. Signature captured on file.'
  );
  // Open email in background — silent send via hidden iframe mailto
  var mailLink = document.createElement('a');
  mailLink.href = 'mailto:ridenewportbeach@gmail.com?subject=' + subject + '&body=' + body;
  mailLink.click();

  // Show confirmation
  document.getElementById('waiverForm').style.display = 'none';
  var conf = document.getElementById('confirmation');
  conf.style.display = 'block';
  document.getElementById('confirmDetails').textContent =
    name + ' — ' + dateStr;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  document.getElementById('confirmation').style.display = 'none';
  document.getElementById('waiverForm').style.display = 'block';
  document.getElementById('waiverForm').reset();
  clearSignature();
  document.getElementById('statusMsg').textContent = '';
  hasSigned = false;

  // Reset date to today
  var d = new Date();
  var str = d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
  document.getElementById('rentalDate').value = str;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
