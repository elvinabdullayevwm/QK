
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9NXQGYiTGbeQauEAIskkoZMIO6J38sGSPlJzPYvSEtu8S9W9nC2C4O8aYy1aJQBW1wQ/exec"; // Öz Google Apps Script Web App linkini bura yaz
let currentMuellim = {};
let currentLesson = {};
let studentsData = [];
let currentStep = 1;

function login() {
    let lInput = document.getElementById('loginInput');
    let pInput = document.getElementById('parolInput');
    
    if (!lInput || !pInput) return;
    
    let l = lInput.value;
    let p = pInput.value;
    
    fetch(`${SCRIPT_URL}?action=login&login=${l}&parol=${p}`)
    .then(res => res.json())
    .then(data => {
        if(data.status === "success") {
            currentMuellim = data;
            
            // Elementlərin olub- olmadığını yoxlayaraq dəyər veririk
            let mAdi = document.getElementById('muellimAdi');
            let mFenn = document.getElementById('muellimFenn');
            let hAd = document.getElementById('headerMuellimAd');
            let hFenn = document.getElementById('headerMuellimFenn');
            let uHeader = document.getElementById('userInfoHeader');
            let loginScreen = document.getElementById('loginScreen');
            let dashScreen = document.getElementById('dashboardScreen');
            
            if(mAdi) mAdi.innerText = data.ad;
            if(mFenn) mFenn.innerText = data.fenn;
            if(hAd) hAd.innerText = data.ad;
            if(hFenn) hFenn.innerText = data.fenn;
            if(uHeader) uHeader.style.display = 'block';
            if(loginScreen) loginScreen.style.display = 'none';
            if(dashScreen) dashScreen.style.display = 'block';
            
            // Modalı bağlayırıq (əgər açıqdısa)
            let modalEl = document.getElementById('loginModal');
            if(modalEl) {
                let modal = bootstrap.Modal.getInstance(modalEl);
                if(modal) modal.hide();
            }

            if(typeof loadSchedule === 'function') loadSchedule();
        } else {
            alert(data.message);
        }
    })
    .catch(err => {
        alert("Giriş zamanı xəta baş verdi: " + err);
    });
}

function reloadSchedule() {
    loadSchedule();
}

function loadSchedule() {
    let gunTipiSelect = document.getElementById('gunTipiSelect');
    if (!gunTipiSelect) return;
    
    let gunTipi = gunTipiSelect.value;
    fetch(`${SCRIPT_URL}?action=getSchedule&muellimAdi=${encodeURIComponent(currentMuellim.ad)}&gunTipi=${gunTipi}`)
    .then(res => res.json())
    .then(res => {
        let container = document.getElementById('scheduleList');
        if(!container) return;
        
        container.innerHTML = "";
        if(res.data.length === 0) {
            container.innerHTML = `<div class="alert alert-warning">Bu gün (${gunTipi}) üçün dərsiniz tapılmadı.</div>`;
            return;
        }
        res.data.forEach(d => {
            let displaySaat = d.saat;

            container.innerHTML += `
                <div class="col-md-4 mb-3">
                    <div class="card p-3 schedule-card bg-white">
                        <h6 class="text-primary fw-bold">Fənn: ${d.fenn}</h6>
                        <p class="mb-2 text-secondary"><b>Saat:</b> ${displaySaat}</p>
                        <button class="btn btn-outline-primary btn-sm w-100" onclick='startLesson(${JSON.stringify(d)})'>Dərsə Start Ver</button>
                    </div>
                </div>
            `;
        });
    });
}

function startLesson(lessonObj) {
    currentLesson = lessonObj;
    let titleEl = document.getElementById('activeGroupTitle');
    if(titleEl) titleEl.innerText = `${lessonObj.fenn} | Saat: ${lessonObj.saat}`;
    
    let dashScreen = document.getElementById('dashboardScreen');
    let lessonScreen = document.getElementById('lessonScreen');
    if(dashScreen) dashScreen.style.display = 'none';
    if(lessonScreen) lessonScreen.style.display = 'block';

    let rawNames = lessonObj.sagirdlerMetni.split(/\r\n|\r|\n/);
    studentsData = [];
    
    rawNames.forEach(name => {
        let trimmed = name.trim();
        if(trimmed !== "") {
            studentsData.push({ad: trimmed, soyad: ""});
        }
    });

    renderStudentsLists();
}

function backToDashboard() {
    let lessonScreen = document.getElementById('lessonScreen');
    let dashScreen = document.getElementById('dashboardScreen');
    if(lessonScreen) lessonScreen.style.display = 'none';
    if(dashScreen) dashScreen.style.display = 'block';
    currentStep = 1;
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    let step1 = document.getElementById('step1');
    if(step1) step1.classList.add('active');
}

function renderStudentsLists() {
    let attDiv = document.getElementById('studentsAttendanceList');
    let hwDiv = document.getElementById('studentsHomeworkList');
    let actDiv = document.getElementById('studentsActivityList');
    
    if(attDiv) attDiv.innerHTML = "";
    if(hwDiv) hwDiv.innerHTML = "";
    if(actDiv) actDiv.innerHTML = "";

    studentsData.forEach((s) => {
        if(attDiv) {
            attDiv.innerHTML += `
                <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                    <span><b>${s.ad}</b></span>
                    <select class="form-select w-50 att-status" data-ad="${s.ad}">
                        <option value="Gəldi">Gəldi</option>
                        <option value="Gəlmədi">Gəlmədi</option>
                    </select>
                </div>
            `;
        }

        if(hwDiv) {
            hwDiv.innerHTML += `
                <div class="card p-3 mb-3 bg-light">
                    <h6 class="text-primary fw-bold mb-2">${s.ad}</h6>
                    <div class="row">
                        <div class="col-md-4 mb-2">
                            <label class="small text-muted">Verilən test sayı</label>
                            <input type="number" class="form-control hw-verilen" data-ad="${s.ad}" placeholder="0">
                        </div>
                        <div class="col-md-4 mb-2">
                            <label class="small text-muted">Yazılan test sayı</label>
                            <input type="number" class="form-control hw-yazilan" data-ad="${s.ad}" placeholder="0">
                        </div>
                        <div class="col-md-4 mb-2">
                            <label class="small text-muted">Düz çıxan test sayı</label>
                            <input type="number" class="form-control hw-duz" data-ad="${s.ad}" placeholder="0">
                        </div>
                    </div>
                </div>
            `;
        }

        if(actDiv) {
            actDiv.innerHTML += `
                <div class="mb-2">
                    <label class="small text-muted"><b>${s.ad}</b> - Aktivlik / Sual-Cavab</label>
                    <input type="text" class="form-control act-input" data-ad="${s.ad}" placeholder="Məs: Fəal idi / 90 bal">
                </div>
            `;
        }
    });
}

function nextStep() {
    let currentStepEl = document.getElementById(`step${currentStep}`);
    if(currentStepEl) currentStepEl.classList.remove('active');
    currentStep++;
    let nextStepEl = document.getElementById(`step${currentStep}`);
    if(nextStepEl) nextStepEl.classList.add('active');
}

function prevStep() {
    let currentStepEl = document.getElementById(`step${currentStep}`);
    if(currentStepEl) currentStepEl.classList.remove('active');
    currentStep--;
    let prevStepEl = document.getElementById(`step${currentStep}`);
    if(prevStepEl) prevStepEl.classList.add('active');
}

function finishLesson() {
    let evMovzuEl = document.getElementById('evMovzu');
    let testNovuEl = document.getElementById('testNovu');
    let testMovzulariEl = document.getElementById('testMovzulari');
    let novbetiMovzuEl = document.getElementById('novbetiMovzu');
    let qeydEl = document.getElementById('qeyd');

    let payload = {
        muellim: currentMuellim.ad,
        fenn: currentLesson.fenn,
        saat: currentLesson.saat,
        qrup: "Matris Qrupu",
        evMovzu: evMovzuEl ? evMovzuEl.value : "",
        testNovu: testNovuEl ? testNovuEl.value : "",
        testMovzulari: testMovzulariEl ? testMovzulariEl.value : "",
        novbetiMovzu: novbetiMovzuEl ? novbetiMovzuEl.value : "",
        qeyd: qeydEl ? qeydEl.value : "",
        sagirdler: []
    };

    let statuses = document.querySelectorAll('.att-status');
    let verilenInputs = document.querySelectorAll('.hw-verilen');
    let yazilanInputs = document.querySelectorAll('.hw-yazilan');
    let duzInputs = document.querySelectorAll('.hw-duz');
    let activities = document.querySelectorAll('.act-input');

    statuses.forEach((el, i) => {
        payload.sagirdler.push({
            ad: el.getAttribute('data-ad'),
            soyad: "",
            status: el.value,
            verilenTest: verilenInputs[i] ? (verilenInputs[i].value || "0") : "0",
            yazilanTest: yazilanInputs[i] ? (yazilanInputs[i].value || "0") : "0",
            duzTest: duzInputs[i] ? (duzInputs[i].value || "0") : "0",
            aktivlik: activities[i] ? activities[i].value : ""
        });
    });

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(res => {
        if(res.status === "success") {
            alert("Dərs uğurla yekunlaşdı və məlumatlar Google Sheet-ə yazıldı!");
            location.reload();
        } else {
            alert("Xəta baş verdi: " + res.message);
        }
    })
    .catch(err => {
        alert("Sorğu zamanı xəta baş verdi: " + err);
    });
}

function handleRegister(event) {
    event.preventDefault();
    
    let payload = {
        action: "register",
        adSoyad: event.target.querySelector('input[type="text"]').value,
        sinif: event.target.querySelector('select').value,
        telefon: event.target.querySelector('input[type="tel"]').value
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(res => {
        if(res.status === "success") {
            alert("Müraciətiniz uğurla qeydə alındı və Google Sheets-ə göndərildi! Tezliklə sizinlə əlaqə saxlanılacaq.");
            event.target.reset();
        } else {
            alert("Xəta baş verdi: " + res.message);
        }
    })
    .catch(err => {
        alert("Bağlantı xətası: " + err);
    });
}
