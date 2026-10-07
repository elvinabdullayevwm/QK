const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9NXQGYiTGbeQauEAIskkoZMIO6J38sGSPlJzPYvSEtu8S9W9nC2C4O8aYy1aJQBW1wQ/exec"; // Öz Google Apps Script Web App linkini bura yaz
let currentMuellim = {};
let currentLesson = {};
let studentsData = [];
let currentStep = 1;

function login() {
    let l = document.getElementById('loginInput').value;
    let p = document.getElementById('parolInput').value;
    fetch(`${SCRIPT_URL}?action=login&login=${l}&parol=${p}`)
    .then(res => res.json())
    .then(data => {
        if(data.status === "success") {
            currentMuellim = data;
            document.getElementById('muellimAdi').innerText = data.ad;
            document.getElementById('muellimFenn').innerText = data.fenn;
            document.getElementById('headerMuellimAd').innerText = data.ad;
            document.getElementById('headerMuellimFenn').innerText = data.fenn;
            document.getElementById('userInfoHeader').style.display = 'block';
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboardScreen').style.display = 'block';
            loadSchedule();
        } else {
            alert(data.message);
        }
    });
}

function reloadSchedule() {
    loadSchedule();
}

function loadSchedule() {
    let gunTipi = document.getElementById('gunTipiSelect').value;
    fetch(`${SCRIPT_URL}?action=getSchedule&muellimAdi=${encodeURIComponent(currentMuellim.ad)}&gunTipi=${gunTipi}`)
    .then(res => res.json())
    .then(res => {
        let container = document.getElementById('scheduleList');
        container.innerHTML = "";
        if(res.data.length === 0) {
            container.innerHTML = `<div class="alert alert-warning">Bu gün (${gunTipi}) üçün dərsiniz tapılmadı.</div>`;
            return;
        }
        res.data.forEach(d => {
            // Heç bir saat manipulyasiyası etmirik, serverdən necə gəlirsə birbaşa yazırıq
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
    document.getElementById('activeGroupTitle').innerText = `${lessonObj.fenn} | Saat: ${lessonObj.saat}`;
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('lessonScreen').style.display = 'block';

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
    document.getElementById('lessonScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    currentStep = 1;
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById('step1').classList.add('active');
}

function renderStudentsLists() {
    let attDiv = document.getElementById('studentsAttendanceList');
    let hwDiv = document.getElementById('studentsHomeworkList');
    let actDiv = document.getElementById('studentsActivityList');
    
    attDiv.innerHTML = "";
    hwDiv.innerHTML = "";
    actDiv.innerHTML = "";

    studentsData.forEach((s) => {
        // Addım 1: Davamiyyət
        attDiv.innerHTML += `
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                <span><b>${s.ad}</b></span>
                <select class="form-select w-50 att-status" data-ad="${s.ad}">
                    <option value="Gəldi">Gəldi</option>
                    <option value="Gəlmədi">Gəlmədi</option>
                </select>
            </div>
        `;

        // Addım 2: Hər şagird üçün fərdi ev tapşırığı xanaları
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

        // Addım 3: Sual-Cavab
        actDiv.innerHTML += `
            <div class="mb-2">
                <label class="small text-muted"><b>${s.ad}</b> - Aktivlik / Sual-Cavab</label>
                <input type="text" class="form-control act-input" data-ad="${s.ad}" placeholder="Məs: Fəal idi / 90 bal">
            </div>
        `;
    });
}

function nextStep() {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    currentStep++;
    document.getElementById(`step${currentStep}`).classList.add('active');
}

function prevStep() {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    currentStep--;
    document.getElementById(`step${currentStep}`).classList.add('active');
}

function finishLesson() {
    let payload = {
        muellim: currentMuellim.ad,
        fenn: currentLesson.fenn,
        saat: currentLesson.saat,
        qrup: "Matris Qrupu",
        evMovzu: document.getElementById('evMovzu').value,
        testNovu: document.getElementById('testNovu').value,
        testMovzulari: document.getElementById('testMovzulari').value,
        novbetiMovzu: document.getElementById('novbetiMovzu').value,
        qeyd: document.getElementById('qeyd').value,
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
            verilenTest: verilenInputs[i].value || "0",
            yazilanTest: yazilanInputs[i].value || "0",
            duzTest: duzInputs[i].value || "0",
            aktivlik: activities[i].value
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
