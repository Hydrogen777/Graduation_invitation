(() => {
  const ev = window.GRADUATION || {};
  const $ = (s, r = document) => r.querySelector(s);
  const all = (s, r = document) => [...r.querySelectorAll(s)];
  const fill = (s, v) => all(s).forEach(el => { el.textContent = v; });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const TZ = 'Asia/Ho_Chi_Minh';

  /* ---------- Chuyển động bật / tắt ---------- */
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = media.matches;
  const canMove = () => !paused && !media.matches;
  const motionButtons = all('.motion-toggle');
  const updateMotion = () => {
    document.body.classList.toggle('motion-paused', paused);
    motionButtons.forEach(b => { b.setAttribute('aria-pressed', String(paused)); b.textContent = paused ? 'Bật chuyển động' : 'Dừng chuyển động'; });
  };
  motionButtons.forEach(b => b.addEventListener('click', () => { paused = !paused; updateMotion(); }));
  media.addEventListener('change', e => { paused = e.matches; updateMotion(); });
  updateMotion();

  /* ---------- Thông báo nhỏ ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  const toast = msg => {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  };

  /* ---------- Pháo giấy (canvas) ---------- */
  const fx = (() => {
    const c = $('#fx'), ctx = c.getContext('2d');
    const colors = ['#f2c75c', '#12355b', '#f4f7f9', '#cfe0ec', '#d9a93a', '#ffffff'];
    let W = 0, H = 0, parts = [], raf = 0, last = 0;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    addEventListener('resize', size); size();
    const add = (x, y, vx, vy) => parts.push({ x, y, vx, vy, w: 6 + Math.random() * 9, h: 4 + Math.random() * 8, r: Math.random() * 6.3, vr: (Math.random() - .5) * .5, c: colors[Math.random() * colors.length | 0], round: Math.random() < .25, life: 0, max: 2200 + Math.random() * 1600 });
    const loop = t => {
      const dt = Math.min(34, t - last) || 16; last = t;
      ctx.clearRect(0, 0, W, H);
      parts = parts.filter(p => p.life < p.max && p.y < H + 40);
      for (const p of parts) {
        p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .0012 * dt; p.vx *= .996; p.r += p.vr * dt / 16;
        ctx.globalAlpha = Math.min(1, (p.max - p.life) / 500);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2.4, 0, 6.3); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 1.6)) + 1);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      raf = parts.length ? requestAnimationFrame(loop) : 0;
      if (!raf) { ctx.clearRect(0, 0, W, H); c.style.display = 'none'; }
    };
    const start = () => { c.style.display = 'block'; if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    return {
      burst(x, y, n = 100) {
        if (!canMove()) return;
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.3, s = .35 + Math.random() * .95;
          add(x, y, Math.cos(a) * s, Math.sin(a) * s);
        }
        start();
      },
      rain(ms = 1800) {
        if (!canMove()) return;
        const end = performance.now() + ms;
        const t = setInterval(() => {
          for (let i = 0; i < 5; i++) add(Math.random() * W, -12, (Math.random() - .5) * .12, .08 + Math.random() * .18);
          start(); if (performance.now() > end) clearInterval(t);
        }, 60);
      }
    };
  })();

  /* ---------- Tung mũ ---------- */
  const tossCap = (origin, { dark = false, pop = 70, land = true } = {}) => {
    const r = origin.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    fx.burst(cx, cy, pop);
    if (!canMove()) return Promise.resolve();
    const cap = document.createElement('div');
    cap.className = 'flying-cap' + (dark ? ' dark' : '');
    cap.innerHTML = '<svg viewBox="0 0 480 300" width="100%" aria-hidden="true"><use href="#cap"/></svg>';
    document.body.append(cap);
    const w = 110, up = Math.min(cy - 30, Math.max(220, innerHeight * .5));
    const drift = (Math.random() - .5) * 160;
    const x0 = cx - w / 2, y0 = cy - 35;
    const anim = cap.animate([
      { transform: `translate(${x0}px,${y0}px) rotate(-10deg) scale(.7)`, offset: 0 },
      { transform: `translate(${x0 + drift * .6}px,${y0 - up}px) rotate(380deg) scale(1.5)`, offset: .5, easing: 'cubic-bezier(.4,0,.9,.6)' },
      { transform: `translate(${x0 + drift}px,${y0 + 40}px) rotate(720deg) scale(.9)`, opacity: 1, offset: .95 },
      { transform: `translate(${x0 + drift}px,${y0 + 40}px) rotate(740deg) scale(.9)`, opacity: 0, offset: 1 }
    ], { duration: 1400, easing: 'cubic-bezier(.2,.7,.3,1)' });
    return anim.finished.catch(() => {}).then(() => { cap.remove(); if (land) fx.burst(cx + drift, cy, 30); });
  };
  all('.toss').forEach(b => b.addEventListener('click', () => {
    const hero = b.classList.contains('hero-cap');
    tossCap(b, { dark: b.classList.contains('statement-art') });
    if (hero) { b.style.visibility = 'hidden'; setTimeout(() => { b.style.visibility = ''; }, 1400); }
  }));

  /* ---------- Ngày giờ, nội dung ---------- */
  fill('[data-name]', ev.name || 'Hoài Minh');
  document.title = `Thiệp mời tốt nghiệp · ${ev.name}`;
  const fixed = ev.startsAt ? new Date(ev.startsAt) : null;
  const hasTime = !!(fixed && !Number.isNaN(fixed.getTime()));
  const target = hasTime ? fixed : new Date(`${ev.date}T00:00:00+07:00`);
  const dayDate = hasTime ? fixed : new Date(`${ev.date}T12:00:00+07:00`);
  const fmt = (o, d = dayDate) => new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, ...o }).format(d);
  const part = type => Number(new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: TZ }).formatToParts(dayDate).find(p => p.type === type).value);
  const year = part('year'), month = part('month'), day = part('day');
  $('#month-title').textContent = `Tháng ${month}`;
  $('#calendar-year').textContent = String(year);
  $('#date-note').textContent = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  fill('[data-date]', fmt({ day: '2-digit', month: '2-digit', year: 'numeric' }));
  if (hasTime) {
    const endAt = ev.endsAt ? new Date(ev.endsAt) : null;
    const t = d => fmt({ hour: '2-digit', minute: '2-digit' }, d);
    fill('[data-time]', endAt && endAt > fixed ? `${t(fixed)} – ${t(endAt)}` : t(fixed));
  }
  if (ev.venue) fill('[data-venue]', ev.venue);
  if (ev.address) fill('[data-address]', ev.address);
  if (ev.mapUrl && /^https:\/\//.test(ev.mapUrl)) { const l = $('#map-link'); l.href = ev.mapUrl; l.hidden = false; }

  /* ---------- Lịch ---------- */
  const todayParts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: TZ }).formatToParts(new Date());
  const tp = t => Number(todayParts.find(p => p.type === t).value);
  const sameMonth = tp('year') === year && tp('month') === month;
  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const rows = Math.ceil((offset + days) / 7);
  const body = $('#month-days');
  let openBtn;
  const nudges = ['Ngày này chưa có gì đâu.', 'Gần rồi, tìm ngày có cái mũ nha.', 'Thử ngày có cái mũ xem?', 'Mình hẹn ngày khác cơ.'];
  let nudgeI = 0;
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < 7; c++) {
      const td = document.createElement('td'); const n = r * 7 + c - offset + 1;
      if (n > 0 && n <= days) {
        td.textContent = n;
        if (sameMonth && n < tp('day')) td.classList.add('past');
        if (sameMonth && n === tp('day')) td.classList.add('today');
        if (n === day) {
          td.className = 'is-event'; td.textContent = '';
          openBtn = document.createElement('button');
          openBtn.type = 'button'; openBtn.id = 'open-invitation'; openBtn.className = 'event-day';
          openBtn.setAttribute('aria-label', `Ngày ${day} tháng ${month}: mở thiệp mời tốt nghiệp`);
          openBtn.innerHTML = `<span class="day">${day}</span><span class="hint">Mở thiệp</span><svg viewBox="0 0 480 300" aria-hidden="true"><use href="#cap"/></svg>`;
          td.append(openBtn);
        } else {
          td.addEventListener('click', () => {
            td.classList.remove('pop'); void td.offsetWidth; td.classList.add('pop');
            toast(nudges[nudgeI++ % nudges.length]);
            openBtn.classList.remove('nudge'); void openBtn.offsetWidth; openBtn.classList.add('nudge');
          });
        }
      } else td.className = 'empty-cell';
      tr.append(td);
    }
    body.append(tr);
  }
  const daysLeft = () => Math.ceil((target - Date.now()) / 86400000);
  const dl = daysLeft();
  $('#days-left').textContent = dl > 0 ? `Còn ${dl} ngày` : dl === 0 ? 'Hôm nay!' : 'Đã diễn ra';

  /* ---------- Đếm ngược ---------- */
  const cdEls = { d: $('[data-cd=d]'), h: $('[data-cd=h]'), m: $('[data-cd=m]'), s: $('[data-cd=s]') };
  const cdNote = $('#cd-note');
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    const diff = Math.max(0, target - Date.now());
    const v = { d: Math.floor(diff / 864e5), h: Math.floor(diff / 36e5) % 24, m: Math.floor(diff / 6e4) % 60, s: Math.floor(diff / 1e3) % 60 };
    for (const k in v) {
      const t = k === 'd' ? String(v[k]).padStart(2, '0') : pad(v[k]);
      if (cdEls[k].textContent !== t) {
        cdEls[k].textContent = t;
        if (canMove() && k !== 'd') cdEls[k].animate([{ transform: 'translateY(35%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    }
    cdNote.textContent = diff > 0 ? (v.d > 0 ? `Còn ${v.d} ngày nữa là tới rồi!` : 'Còn vài giờ nữa thôi!') : (daysLeft() === 0 ? 'Hôm nay rồi, gặp nhau nha!' : 'Cảm ơn bạn đã tới chung vui với mình!');
  };
  tick(); setInterval(tick, 1000);

  /* ---------- Lưu vào lịch (.ics) ---------- */
  $('#calendar-save').addEventListener('click', () => {
    const stamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc = s => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const ymd = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('');
    const end = ev.endsAt && new Date(ev.endsAt) > target ? new Date(ev.endsAt) : new Date(+target + 7200000);
    const next = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10).replace(/-/g, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Graduation invitation//VI', 'BEGIN:VEVENT', `UID:graduation-${+target}@invitation.local`, `DTSTAMP:${stamp(new Date())}`,
      hasTime ? `DTSTART:${stamp(target)}` : `DTSTART;VALUE=DATE:${ymd}`, hasTime ? `DTEND:${stamp(end)}` : `DTEND;VALUE=DATE:${next}`,
      `SUMMARY:${esc('Lễ tốt nghiệp của ' + ev.name)}`, `LOCATION:${esc([ev.venue, ev.address].filter(Boolean).join(', '))}`, 'END:VEVENT', 'END:VCALENDAR', ''];
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'hen-o-le-tot-nghiep.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Đã tải file lịch rồi, mở ra là thêm vào lịch được.');
  });

  /* ---------- Tên khách, hồi âm, chia sẻ ---------- */
  const input = $('#guest-name'), feedback = $('#feedback');
  const calLead = $('#calendar-view .lead'), calLeadText = calLead.textContent;
  const setGuest = v => { const n = v.trim().slice(0, 60); fill('[data-guest]', n || 'bạn'); calLead.textContent = n ? `${n} ơi, ${calLeadText.charAt(0).toLowerCase()}${calLeadText.slice(1)}` : calLeadText; return n; };
  input.value = setGuest(new URLSearchParams(location.search).get('guest') || '');
  input.addEventListener('input', () => setGuest(input.value));
  const shareUrl = () => { const u = new URL(location.href); const n = input.value.trim(); n ? u.searchParams.set('guest', n) : u.searchParams.delete('guest'); u.hash = ''; return u.href; };
  const copy = async text => { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } };
  $('#copy-link').addEventListener('click', async () => {
    if (location.protocol === 'file:') { feedback.textContent = 'Đăng lên GitHub Pages xong thì bạn copy link gửi thiệp được nha.'; return; }
    feedback.textContent = (await copy(shareUrl())) ? 'Đã copy link thiệp, gửi cho ai bạn muốn mời nha!' : 'Link thiệp: ' + shareUrl();
  });
  if (navigator.share && location.protocol !== 'file:') {
    const sb = $('#share-link'); sb.hidden = false;
    sb.addEventListener('click', () => navigator.share({ title: 'Thiệp mời tốt nghiệp', text: `${ev.name} mời bạn qua chung vui lễ tốt nghiệp ngày 26/11/2026`, url: shareUrl() }).catch(() => {}));
  }
  const contact = String(ev.rsvpUrl || '').trim();
  const phone = /^\+?[\d\s.]{8,15}$/.test(contact) ? contact.replace(/[\s.]/g, '') : '';
  const rsvpLink = phone ? `https://zalo.me/${phone.replace(/^\+84/, '0')}` : (/^https:\/\//.test(contact) ? contact : '');
  if (phone) {
    const pretty = phone.replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3');
    const cp = $('#contact-phone'); cp.href = `tel:${phone}`; cp.textContent = pretty; $('#contact-row').hidden = false;
    const call = document.createElement('a');
    call.className = 'text-link'; call.href = `tel:${phone}`;
    call.textContent = `Gọi ${phone.replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3')}`;
    $('.rsvp-links').prepend(call);
  }
  all('[data-rsvp]').forEach(btn => btn.addEventListener('click', async () => {
    const yes = btn.dataset.rsvp === 'yes';
    const name = input.value.trim() || 'một người bạn';
    const msg = yes ? `Mình là ${name}, mình sẽ qua chung vui lễ tốt nghiệp của ${ev.name} ngày 26/11 nha. Gặp bạn sau!`
                    : `Mình là ${name}, tiếc quá, mình không qua được lễ tốt nghiệp của ${ev.name}. Chúc bạn ngày thật vui nha!`;
    if (yes) { const r = btn.getBoundingClientRect(); fx.burst(r.left + r.width / 2, r.top, 90); }
    if (ev.rsvpEmail && !rsvpLink) { location.href = `mailto:${ev.rsvpEmail}?subject=${encodeURIComponent('Hồi âm lễ tốt nghiệp')}&body=${encodeURIComponent(msg)}`; feedback.textContent = 'Đang mở mail để bạn gửi nè.'; return; }
    const ok = await copy(msg);
    if (rsvpLink) { feedback.textContent = ok ? 'Đã copy lời nhắn, dán vào khung chat rồi gửi nha.' : msg; window.open(rsvpLink, '_blank', 'noopener'); return; }
    feedback.textContent = ok ? 'Đã copy lời nhắn, dán vào Zalo hoặc Messenger gửi Minh nha!' : 'Gửi Minh lời nhắn này nha: ' + msg;
  }));

  /* ---------- Nghiêng theo con trỏ ---------- */
  const heroBody = $('.hero-body'), tilt = $('#tilt');
  let tiltRaf = 0;
  heroBody.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || !canMove()) return;
    cancelAnimationFrame(tiltRaf);
    tiltRaf = requestAnimationFrame(() => {
      const r = heroBody.getBoundingClientRect();
      tilt.style.setProperty('--tx', ((e.clientX - r.left) / r.width - .5).toFixed(3));
      tilt.style.setProperty('--ty', ((e.clientY - r.top) / r.height - .5).toFixed(3));
    });
  });
  heroBody.addEventListener('pointerleave', () => { tilt.style.setProperty('--tx', 0); tilt.style.setProperty('--ty', 0); });

  /* ---------- Hiện dần khi cuộn ---------- */
  const reveal = all('[data-r]');
  if (!('IntersectionObserver' in window)) document.documentElement.classList.add('no-reveal');
  else {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { threshold: .12 });
    reveal.forEach((el, i) => { el.style.setProperty('--delay', `${i % 3 * 80}ms`); io.observe(el); });
  }

  /* ---------- Hiệu ứng khi cuộn ---------- */
  const bar = document.createElement('div'); bar.id = 'progress'; bar.setAttribute('aria-hidden', 'true'); document.body.append(bar);
  const pars = all('[data-par]');
  let scrollRaf = 0;
  const onScroll = () => {
    scrollRaf = 0;
    if (document.body.classList.contains('state-calendar')) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--prog', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
    if (!canMove()) return;
    pars.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
      el.style.setProperty('--p', p.toFixed(3));
    });
  };
  addEventListener('scroll', () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(onScroll); }, { passive: true });
  addEventListener('resize', onScroll);

  /* ---------- Mở thiệp: mũ bay, pháo giấy, xé lịch, mở thiệp ---------- */
  const calView = $('#calendar-view'), invView = $('#invite-view'), sheet = $('#sheet');
  let opened = false, busy = false;
  const showInvite = async wipe => {
    invView.hidden = false;
    if (wipe) {
      invView.classList.add('wipe');
      fx.rain(900);
      await invView.animate([{ clipPath: 'circle(0% at 50% 55%)' }, { clipPath: 'circle(150% at 50% 55%)' }], { duration: 1000, easing: 'cubic-bezier(.65,0,.2,1)' }).finished.catch(() => {});
      invView.classList.remove('wipe');
    }
    calView.hidden = true; document.body.className = 'state-invite' + (paused ? ' motion-paused' : '');
    scrollTo(0, 0); $('#title').focus({ preventScroll: true });
    try { history.replaceState(null, '', location.pathname + location.search + '#thiep'); } catch {}
  };
  const open = async () => {
    if (opened || busy) return; busy = true;
    if (!canMove()) { opened = true; busy = false; showInvite(false); return; }
    openBtn.disabled = true;
    openBtn.querySelector('svg').style.visibility = 'hidden';
    tossCap(openBtn, { pop: 90, land: false });
    await wait(380);
    calView.classList.add('tearing'); sheet.classList.add('tear');
    await wait(1250);
    await showInvite(true);
    opened = true; busy = false; openBtn.disabled = false;
  };
  openBtn.addEventListener('click', open);

  $('#replay')?.addEventListener('click', () => {
    opened = false; sheet.classList.remove('tear'); calView.classList.remove('tearing');
    calView.hidden = false; invView.hidden = true; openBtn.querySelector('svg').style.visibility = '';
    document.body.className = 'state-calendar' + (paused ? ' motion-paused' : '');
    scrollTo(0, 0); openBtn.focus({ preventScroll: true });
    try { history.replaceState(null, '', location.pathname + location.search); } catch {}
  });

  if (location.hash === '#thiep' || new URLSearchParams(location.search).has('open')) { opened = true; showInvite(false); }
  all('.invite nav a').forEach(a => a.addEventListener('click', () => { document.body.classList.add('nav-jump'); }));
})();
