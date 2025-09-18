  /* ====== Small in-memory mock and UI wiring ====== */
  const loginBtn = document.getElementById('loginBtn');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const role = document.getElementById('role');
  const togglePwd = document.getElementById('togglePwd');
  const ssoBtn = document.getElementById('ssoBtn');
  const guest = document.getElementById('guest');

  const appShell = document.getElementById('screen-app');
  const loginScreen = document.getElementById('screen-login');
  const currentUser = document.getElementById('currentUser');
  const avatar = document.getElementById('avatar');
  const logoutBtn = document.getElementById('logoutBtn');
  const notifCount = document.getElementById('notifCount');

  const modal2fa = document.getElementById('modal-2fa');
  const modalOnboard = document.getElementById('modal-onboard');
  const modalReport = document.getElementById('modal-report');
  const modalProject = document.getElementById('modal-project');

  const projectsTableBody = document.querySelector('#projectsTable tbody');
  const procTableBody = document.querySelector('#procTable tbody');
  const reportsTableBody = document.querySelector('#reportsTable tbody');
  const anomalyList = document.getElementById('anomalyList');
  const alertsList = document.getElementById('alertsList');

  const screens = {
    dashboard: document.getElementById('view-dashboard'),
    projects: document.getElementById('view-projects'),
    map: document.getElementById('view-map'),
    reports: document.getElementById('view-reports'),
    anomalies: document.getElementById('view-anomalies'),
    settings: document.getElementById('view-settings')
  };

  // Simple mock data
  const mockProjects = [
    {id:'TTT-2025-0001',title:'Barangay Road Rehab',stage:'Construction',awardee:'Acme BuildCo',budget:12000000,progress:68,flag:'on-track'},
    {id:'TTT-2025-0002',title:'Waterworks Expansion',stage:'Procurement',awardee:'—',budget:8000000,progress:4,flag:'delayed'},
    {id:'TTT-2025-0003',title:'School Repair',stage:'Completed',awardee:'BuildIt',budget:2500000,progress:100,flag:'flagged'}
  ];

  const mockReports = [
    {id:'R-0001',cat:'Delay',loc:'Barangay San Isidro',status:'Open'},
    {id:'R-0002',cat:'Safety',loc:'Sitio Malaya',status:'In Progress'}
  ];

  const mockAnomalies = [
    {id:'A-001',score:92,reason:'Price anomaly: 35% above median',projects:['TTT-2025-0003']},
    {id:'A-002',score:66,reason:'Repeated contractor',projects:['TTT-2025-0001']}
  ];

  // Populate tables
  function renderProjects(){
    projectsTableBody.innerHTML=''; procTableBody.innerHTML='';
    mockProjects.forEach(p=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${p.id}</td><td>${p.title}</td><td>${p.stage}</td><td>₱${(p.budget).toLocaleString()}</td><td><button class='secondary-btn viewProj' data-id='${p.id}'>View</button></td>`;
      projectsTableBody.appendChild(tr);

      const tr2=document.createElement('tr');
      tr2.innerHTML=`<td>${p.id}</td><td>${p.title}</td><td>${p.stage}</td><td>${p.awardee}</td><td>₱${(p.budget).toLocaleString()}</td><td><button class='secondary-btn viewProj' data-id='${p.id}'>View</button></td>`;
      procTableBody.appendChild(tr2);
    });
  }

  function renderReports(){
    reportsTableBody.innerHTML='';
    mockReports.forEach(r=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${r.id}</td><td>${r.cat}</td><td>${r.loc}</td><td>${r.status}</td>`;
      reportsTableBody.appendChild(tr);
    });
  }

  function renderAnomalies(){
    anomalyList.innerHTML=''; alertsList.innerHTML='';
    mockAnomalies.forEach(a=>{
      const div=document.createElement('div');
      div.className='card'; div.style.padding='8px'; div.style.marginBottom='8px';
      div.innerHTML=`<div style='display:flex;justify-content:space-between;align-items:center'><div><strong>Score ${a.score}</strong><div class='tiny muted'>${a.reason}</div></div><div><button class='secondary-btn'>Acknowledge</button></div></div>`;
      anomalyList.appendChild(div);

      const alert=document.createElement('div'); alert.className='tiny muted'; alert.textContent=`${a.id}: ${a.reason}`; alertsList.appendChild(alert);
    });
  }

  renderProjects(); renderReports(); renderAnomalies();

  // Basic KPI fill
  document.getElementById('kpi-projects').textContent = mockProjects.length;
  document.getElementById('kpi-ontime').textContent = '82%';
  document.getElementById('kpi-spent').textContent = '₱' + (14000000).toLocaleString();
  document.getElementById('kpi-flagged').textContent = mockAnomalies.length;

  // Toggle password visibility
  togglePwd.addEventListener('click', ()=>{
    if(password.type==='password'){password.type='text';togglePwd.textContent='Hide';}else{password.type='password';togglePwd.textContent='Show'}
  });

  // Simple validation
  function validateLogin(){
    const ok = email.value.trim().length>3 && password.value.trim().length>0;
    loginBtn.disabled = !ok;
  }
  email.addEventListener('input',validateLogin); password.addEventListener('input',validateLogin);

  // Simulate SSO
  ssoBtn.addEventListener('click', ()=>{
    // show redirect modal briefly (here: 800ms) then open 2FA for higher roles
    ssoBtn.textContent='Redirecting…'; setTimeout(()=>{ssoBtn.textContent='Login with SSO / GovID'; // assume LGU officer for demo
      role.value='lgu'; startLogin({name:'Juan Dela Cruz',role:'lgu'});
    },800);
  });

  // Guest
  guest.addEventListener('click', (e)=>{e.preventDefault(); startLogin({name:'Guest Citizen',role:'citizen',guest:true});});

  // Login click
  loginBtn.addEventListener('click', ()=>{
    // fake auth check
    if(password.value.length<4){document.getElementById('pwdError').style.display='block';document.getElementById('pwdError').textContent='Password required (min 4 chars)';return}
    if(!email.value.includes('@')){document.getElementById('emailError').style.display='block';document.getElementById('emailError').textContent='Invalid email format';return}
    document.getElementById('emailError').style.display='none';document.getElementById('pwdError').style.display='none';
    startLogin({name:email.value,role:role.value||'citizen'});
  });

  function startLogin(user){
    // If role requires 2FA
    const needs2fa = ['lgu','auditor','admin'].includes(user.role);
    if(needs2fa){open2FA(user);}else{completeLogin(user)}
  }

  function open2FA(user){
    modal2fa.style.display='flex';
    // start 2min timer
    let time=120; const timerEl=document.getElementById('codeTimer');
    const int=setInterval(()=>{time--; const mm=Math.floor(time/60).toString().padStart(2,'0'); const ss=(time%60).toString().padStart(2,'0'); timerEl.textContent=mm+':'+ss; if(time<=0){clearInterval(int);document.getElementById('twoFaError').style.display='block';document.getElementById('twoFaError').textContent='Code expired — resend'}},1000);

    document.getElementById('verify2fa').onclick = ()=>{
      // simple accept when code boxes filled with 111111
      const code = Array.from([1,2,3,4,5,6]).map(i=>document.getElementById('code'+i).value||'').join('');
      if(code==='111111'){modal2fa.style.display='none';completeLogin(user);clearInterval(int);}else{document.getElementById('twoFaError').style.display='block';document.getElementById('twoFaError').textContent='Incorrect code'}
    }
  }

  function completeLogin(user){
    loginScreen.style.display='none'; appShell.style.display='block';
    currentUser.textContent = user.name||'User'; avatar.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%230D47A1"/><text x="50%" y="55%" font-size="28" text-anchor="middle" fill="white">'+(user.name?user.name.charAt(0).toUpperCase():'U')+'</text></svg>';

    // open onboarding for first-time non-guest
    if(!user.guest) setTimeout(()=>{modalOnboard.style.display='flex'},400);
  }

  // Simple nav
  document.querySelectorAll('.sidebar .nav-item').forEach(n=>n.addEventListener('click',()=>{
    const route = n.dataset.route; for(const s in screens){screens[s].style.display='none'}; screens[route].style.display='block';
  }));

  // Project view open
  document.addEventListener('click', (e)=>{
    if(e.target.classList.contains('viewProj')){
      const id = e.target.dataset.id; openProject(id);
    }
  });

  function openProject(id){
    const p = mockProjects.find(x=>x.id===id); if(!p) return;
    document.getElementById('projTitle').textContent = p.title; document.getElementById('projId').textContent = p.id; document.getElementById('projAgency').textContent = 'LGU Example';
    document.getElementById('projProgress').style.width = p.progress+'%'; document.getElementById('projOverview').textContent = p.stage + ' • ' + p.title;
    document.getElementById('projFin').textContent = 'Budget: ₱' + p.budget.toLocaleString();
    modalProject.style.display='flex';
  }

  document.getElementById('closeProject').addEventListener('click', ()=>{modalProject.style.display='none'});

  logoutBtn.addEventListener('click', ()=>{
    // check unsaved actions (very simple here)
    if(confirm('Logout now?')){ appShell.style.display='none';loginScreen.style.display='block'; }
  });

  // Onboarding
  document.getElementById('skipOnboard').addEventListener('click', ()=>{modalOnboard.style.display='none'});
  document.getElementById('saveOnboard').addEventListener('click', ()=>{modalOnboard.style.display='none'});

  // Report modal
  document.getElementById('reportIssueBtn').addEventListener('click', ()=>{modalReport.style.display='flex'});
  document.getElementById('fabReport').addEventListener('click', ()=>{modalReport.style.display='flex'});
  document.getElementById('cancelReport').addEventListener('click', ()=>{modalReport.style.display='none'});
  document.getElementById('submitReport').addEventListener('click', ()=>{
    const cat = document.getElementById('repCategory').value; const photo = document.getElementById('repPhoto').files.length>0; const desc = document.getElementById('repDesc').value.trim();
    if(!cat || !photo){alert('Please select a category and attach a photo (simulated)');return}
    const id = 'R-'+String(Math.floor(Math.random()*9000)+1000);
    mockReports.unshift({id,cat:cat,loc:'User location',status:'Open'});
    renderReports(); modalReport.style.display='none'; alert('Thanks! Your report ID '+id+' — We will review within 3 business days.');
  });

  // Create project button (demo)
  document.getElementById('createProjectBtn').addEventListener('click', ()=>{
    const id = 'TTT-2025-'+String(Math.floor(Math.random()*9000)+1000);
    mockProjects.unshift({id,title:'New project '+id,stage:'Planning',awardee:'—',budget:500000,progress:0,flag:'on-track'});
    renderProjects(); alert('Project created: '+id);
  });

  // Notifications demo
  let notif = 2; notifCount.textContent = notif;

  // Accessibility toggles
  document.getElementById('highContrastBtn').addEventListener('click', ()=>{
    const el = document.documentElement; const on = el.getAttribute('data-high-contrast')==='true'; el.setAttribute('data-high-contrast', String(!on));
    if(!on){document.body.style.background='#111';document.body.style.color='#fff';}else{document.body.style.background='var(--bg)';document.body.style.color='#101318'}
  });
  document.getElementById('largeTextBtn').addEventListener('click', ()=>{
    const el = document.documentElement; const on = el.getAttribute('data-large-text')==='true'; el.setAttribute('data-large-text', String(!on));
    if(!on){document.documentElement.style.setProperty('--headline-size','1.6rem');document.documentElement.style.setProperty('--body-size','1rem')}else{document.documentElement.style.setProperty('--headline-size','1.4rem');document.documentElement.style.setProperty('--body-size','0.875rem')}
  });

  // Close modals when clicking backdrop
  document.querySelectorAll('.modal-backdrop').forEach(m=>m.addEventListener('click',(e)=>{if(e.target===m){m.style.display='none'}}));

  // Keyboard-friendly 2FA inputs: auto-advance
  for(let i=1;i<=6;i++){ const el=document.getElementById('code'+i); el.addEventListener('input', (e)=>{ if(el.value.length>=1 && i<6) document.getElementById('code'+(i+1)).focus(); }); }

  // Wire up view switch for mobile nav
  document.querySelector('.bottom-nav').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && e.target.hasAttribute('data-route')) {
      const route = e.target.getAttribute('data-route');
      for (const s in screens) {
        screens[s].style.display = 'none';
      }
      if (screens[route]) {
        screens[route].style.display = 'block';
      }
    }
    // Optionally handle the fabMobile button (report modal)
    if (e.target.id === 'fabMobile') {
      document.getElementById('modal-report').style.display = 'flex';
    }
  });

  // Basic accessibility: focus login email on load
  email.focus();

  // Sidebar toggle for mobile
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');

// Only show hamburger on mobile (after login)
function updateMenuToggleVisibility() {
  if (window.innerWidth <= 900 && appShell.style.display === 'block') {
    menuToggle.style.display = 'block';
  } else {
    menuToggle.style.display = 'none';
    sidebar.classList.remove('open');
  }
}
window.addEventListener('resize', updateMenuToggleVisibility);
updateMenuToggleVisibility();

menuToggle.addEventListener('click', function(e) {
  e.stopPropagation();
  sidebar.classList.toggle('open');
});

// Close sidebar when clicking outside
document.addEventListener('click', function(e) {
  if (
    window.innerWidth <= 900 &&
    sidebar.classList.contains('open') &&
    !sidebar.contains(e.target) &&
    !menuToggle.contains(e.target)
  ) {
    sidebar.classList.remove('open');
  }
});

// Show/hide hamburger after login/logout
function showAppShell() {
  loginScreen.style.display = 'none';
  appShell.style.display = 'block';
  updateMenuToggleVisibility();
}
function showLoginScreen() {
  appShell.style.display = 'none';
  loginScreen.style.display = 'block';
  updateMenuToggleVisibility();
}

// Replace these lines in completeLogin and logoutBtn click:
function completeLogin(user){
  showAppShell();
  currentUser.textContent = user.name||'User';
  avatar.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%230D47A1"/><text x="50%" y="55%" font-size="28" text-anchor="middle" fill="white">'+(user.name?user.name.charAt(0).toUpperCase():'U')+'</text></svg>';
  if(!user.guest) setTimeout(()=>{modalOnboard.style.display='flex'},400);
}
logoutBtn.addEventListener('click', ()=>{
  if(confirm('Logout now?')){ showLoginScreen(); }
});
