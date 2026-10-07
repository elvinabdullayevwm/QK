


const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwT6gMW2Bb2sVdd8TMxCr7rmxMvsGL-_Qx7iXc4RoRVFcvc6KHg4hsdJwun6lPAOjXK0g/exec"; // Öz Google Apps Script Web App linkini bura yaz
let currentMuellim = {};
let currentLesson = {};
let studentsData = [];
let currentStep = 1;

function login() {
    let l = document.getElementById('modalLoginInput').value.trim();
    let p = document.getElementById('modalParolInput').value.trim();
    
    if(!l || !p) {
        alert("Zəhmət olmasa login və şifrəni daxil edin!");
        return;
    }
    
    fetch(`${SCRIPT_URL}?action=login&login=${encodeURIComponent(l)}&parol=${encodeURIComponent(p)}`)
    .then(res => res.json())
    .then(data => {
        if(data.status === "success") {
            currentMuellim = data;
            
            // Ana səhifəni və bölmələri gizlədib paneli açırıq
            document.getElementById('hero').style.display = 'none';
            document.getElementById('mainContainer').style.display = 'none'; // Bütün ana səhifə elementləri buradadır

            // Müəllim panelini yaratmaq və ya göstərmək üçün dinamik konteyner yaradırıq
            showMuellimDashboard();

            let modalEl = document.getElementById('loginModal');
            let modal = bootstrap.Modal.getInstance(modalEl);
            if(modal) modal.hide();

            loadSchedule();
        } else {
            alert(data.message);
        }
    })
    .catch(err => {
        alert("Giriş xətası: " + err);
    });
}

function showMuellimDashboard() {
    let container = document.getElementById('muellimPanelContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'muellimPanelContainer';
        container.className = 'container my-5';
        document.body.appendChild(container);
    }
    
    container.innerHTML = `
        <div id="dashboardScreen">
            <div class="card p-3 mb-4 bg-white shadow-sm">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h4 class="text-primary mb-0">Xoş gəldiniz, ${currentMuellim.ad}</h4>
                        <p class="text-muted small mb-0">Fənn: <b>${currentMuellim.fenn}</b></p>
                    </div>
                    <div class="col-md-4 text-end">
                        <label class="fw-bold small me-2">Gün Tipi:</label>
                        <select id="gunTipiSelect" class="form-select w-50 d-inline-block" onchange="reloadSchedule()">
                            <option value="Tək">Tək günlər</option>
                            <option value="Cüt">Cüt günlər</option>
                        </select>
                    </div>
                </div>
            </div>
            <h5 class="border-bottom pb-2 mb-3 text-secondary">Aktiv Dərs Cədvəliniz</h5>
            <div id="scheduleList" class="row"></div>
        </div>

        <div id="lessonScreen" style="display:none;">
            <div class="card p-4 bg-white shadow-sm">
                <div class="border-bottom pb-3 mb-4">
                    <h4 id="activeGroupTitle" class="text-primary mb-0"></h4>
                </div>
                
                <!-- Addım 1: Davamiyyət -->
                <div class="step" id="step1">
                    <h5 class="text-secondary mb-3">Addım 1: Şagird Davamiyyəti</h5>
                    <div id="studentsAttendanceList" class="my-3"></div>
                    <div class="d-flex justify-content-between mt-4">
                        <button class="btn btn-outline-secondary px-4" onclick="backToDashboard()">Cədvələ qayıt</button>
                        <button class="btn btn-primary px-4" onclick="nextStep(1)">Tamamla və Növbəti (Test Statistikası)</button>
                    </div>
                </div>

                <!-- Addım 2: Test Statistikası (Verilən, İşlənilən, Doğru) -->
                <div class="step" id="step2" style="display:none;">
                    <h5 class="text-secondary mb-3">Addım 2: Ev Tapşırığı / Test Statistikası</h5>
                    <div class="mb-3">
                        <label class="form-label small fw-bold">Mövzu</label>
                        <input type="text" id="statMovzu" class="form-control" placeholder="Mövzu adı">
                    </div>
                    <div id="studentsStatList" class="my-3"></div>
                    <div class="d-flex justify-content-between mt-4">
                        <button class="btn btn-outline-secondary px-4" onclick="prevStep(2)">Geri</button>
                        <button class="btn btn-primary px-4" onclick="nextStep(2)">Tamamla və Növbəti (Aktivlik & Emosional Durum)</button>
                    </div>
                </div>

                <!-- Addım 3: Aktivlik və Emosional Durum -->
                <div class="step" id="step3" style="display:none;">
                    <h5 class="text-secondary mb-3">Addım 3: Emosional Durum və Sual-Cavab Aktivliyi</h5>
                    <div id="studentsActivityList" class="my-3"></div>
                    <div class="d-flex justify-content-between mt-4">
                        <button class="btn btn-outline-secondary px-4" onclick="prevStep(3)">Geri</button>
                        <button class="btn btn-primary px-4" onclick="nextStep(3)">Tamamla və Növbəti (Əlavə Yoxlama)</button>
                    </div>
                </div>

                <!-- Addım 4: Əlavə Yoxlama (Diaqnostik, Sınaq, OTK, DIM və s.) -->
                <div class="step" id="step4" style="display:none;">
                    <h5 class="text-secondary mb-3">Addım 4: Əlavə Yoxlama</h5>
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label class="form-label small fw-bold">Yoxlama Növü</label>
                            <select id="elaveYoxlamaNovu" class="form-select">
                                <option value="Diaqnostik">Diaqnostik</option>
                                <option value="Ümumi Sınaq">Ümumi Sınaq</option>
                                <option value="OTK">OTK</option>
                                <option value="DIM">DIM</option>
                            </select>
                        </div>
                        <div class="col-md-8">
                            <label class="form-label small fw-bold">Mövzu / Sınaq Adı</label>
                            <input type="text" id="elaveMovzu" class="form-control" placeholder="Mövzu və ya sınaq kodu">
                        </div>
                    </div>
                    <div id="studentsExtraList" class="my-3"></div>
                    <div class="d-flex justify-content-between mt-4">
                        <button class="btn btn-outline-secondary px-4" onclick="prevStep(4)">Geri</button>
                        <button class="btn btn-primary px-4" onclick="nextStep(4)">Tamamla və Növbəti (Ev Tapşırığı & Qeyd)</button>
                    </div>
                </div>

                <!-- Addım 5: Ev Tapşırığı və Qeyd -->
                <div class="step" id="step5" style="display:none;">
                    <h5 class="text-secondary mb-3">Addım 5: Növbəti Ev Tapşırığı və Ümumi Qeyd</h5>
                    <div id="studentsHwFinalList" class="my-3"></div>
                    <div class="d-flex justify-content-between mt-4">
                        <button class="btn btn-outline-secondary px-4" onclick="prevStep(5)">Geri</button>
                        <button class="btn btn-success px-4" onclick="finishLesson()">Dərsi Bitir və Yadda Saxla</button>
                    </div>
                </div>

            </div>
        </div>
    `;
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
        if(!container) return;
        container.innerHTML = "";
        if(res.data.length === 0) {
            container.innerHTML = `<div class="alert alert-warning">Bu gün (${gunTipi}) üçün dərsiniz tapılmadı.</div>`;
            return;
        }
        res.data.forEach(d => {
            container.innerHTML += `
                <div class="col-md-4 mb-3">
                    <div class="card p-3 schedule-card bg-white shadow-sm">
                        <h6 class="text-primary fw-bold">Fənn: ${d.fenn}</h6>
                        <p class="mb-2 text-secondary"><b>Saat:</b> ${d.saat}</p>
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
    
    // Şagirdlərin adlarından yalnız ilk 10 sətri götürürük
    let count = 0;
    rawNames.forEach(name => {
        let trimmed = name.trim();
        if(trimmed !== "" && count < 10) {
            studentsData.push({ad: trimmed, soyad: ""});
            count++;
        }
    });

    renderAllSteps();
    
    document.querySelectorAll('.step').forEach(s => s.style.display = 'none');
    document.getElementById('step1').style.display = 'block';
    currentStep = 1;
}

function backToDashboard() {
    document.getElementById('lessonScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
}

function renderAllSteps() {
    let attDiv = document.getElementById('studentsAttendanceList');
    let statDiv = document.getElementById('studentsStatList');
    let actDiv = document.getElementById('studentsActivityList');
    let extraDiv = document.getElementById('studentsExtraList');
    let hwFinalDiv = document.getElementById('studentsHwFinalList');
    
    attDiv.innerHTML = "";
    statDiv.innerHTML = "";
    actDiv.innerHTML = "";
    extraDiv.innerHTML = "";
    hwFinalDiv.innerHTML = "";

    studentsData.forEach((s) => {
        // Addım 1
        attDiv.innerHTML += `
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                <span><b>${s.ad}</b></span>
                <select class="form-select w-50 att-status" data-ad="${s.ad}">
                    <option value="Gəldi">Gəldi</option>
                    <option value="Gəlmədi">Gəlmədi</option>
                </select>
            </div>
        `;

        // Addım 2: Test Statistikası
        statDiv.innerHTML += `
            <div class="card p-3 mb-3 bg-light">
                <h6 class="text-primary fw-bold mb-2">${s.ad}</h6>
                <div class="row">
                    <div class="col-md-4 mb-2">
                        <label class="small text-muted">Verilən test sayı</label>
                        <input type="number" class="form-control stat-verilen" data-ad="${s.ad}" placeholder="0">
                    </div>
                    <div class="col-md-4 mb-2">
                        <label class="small text-muted">İşlənilən test sayı</label>
                        <input type="number" class="form-control stat-islenen" data-ad="${s.ad}" placeholder="0">
                    </div>
                    <div class="col-md-4 mb-2">
                        <label class="small text-muted">Doğru test sayı</label>
                        <input type="number" class="form-control stat-dogru" data-ad="${s.ad}" placeholder="0">
                    </div>
                </div>
            </div>
        `;

        // Addım 3: Emosional durum & Aktivlik
        actDiv.innerHTML += `
            <div class="card p-3 mb-3 bg-light">
                <h6 class="text-primary fw-bold mb-2">${s.ad}</h6>
                <div class="row">
                    <div class="col-md-6 mb-2">
                        <label class="small text-muted">Emosional durum</label>
                        <input type="text" class="form-control act-emosianal" data-ad="${s.ad}" placeholder="Məs: Sakit, həvəsli...">
                    </div>
                    <div class="col-md-6 mb-2">
                        <label class="small text-muted">Sual-cavab doğruluq faizi (%)</label>
                        <input type="number" class="form-control act-faiz" data-ad="${s.ad}" placeholder="Məs: 85">
                    </div>
                </div>
            </div>
        `;

        // Addım 4: Əlavə Yoxlama
        extraDiv.innerHTML += `
            <div class="card p-3 mb-3 bg-light">
                <h6 class="text-primary fw-bold mb-2">${s.ad}</h6>
                <div class="row">
                    <div class="col-md-6 mb-2">
                        <label class="small text-muted">İşlənilən test sayı</label>
                        <input type="number" class="form-control extra-islenen" data-ad="${s.ad}" placeholder="0">
                    </div>
                    <div class="col-md-6 mb-2">
                        <label class="small text-muted">Doğru cavab sayı</label>
                        <input type="number" class="form-control extra-dogru" data-ad="${s.ad}" placeholder="0">
                    </div>
                </div>
            </div>
        `;

        // Addım 5: Ev Tapşırığı və Qeyd
        hwFinalDiv.innerHTML += `
            <div class="card p-3 mb-3 bg-light">
                <h6 class="text-primary fw-bold mb-2">${s.ad}</h6>
                <div class="row">
                    <div class="col-md-6 mb-2">
                        <label class="small text-muted">Ev tapşırığı</label>
                        <input type="text" class="form-control hw- tapsiriq" data-ad="${s.ad}" placeholder="Ev tapşırığı">
                    </div>
                    <div class="col-md-6 mb-2">
                        <label class="small text-muted">Qeyd</label>
                        <input type="text" class="form-control hw-qeyd" data-ad="${s.ad}" placeholder="Xüsusi qeyd">
                    </div>
                </div>
            </div>
        `;
    });
}

function nextStep(fromStep) {
    document.getElementById(`step${fromStep}`).style.display = 'none';
    currentStep = fromStep + 1;
    document.getElementById(`step${currentStep}`).style.display = 'block';
}

function prevStep(fromStep) {
    document.getElementById(`step${fromStep}`).style.display = 'none';
    currentStep = fromStep - 1;
    document.getElementById(`step${currentStep}`).style.display = 'block';
}

function finishLesson() {
    let payload = {
        muellim: currentMuellim.ad,
        fenn: currentLesson.fenn,
        saat: currentLesson.saat,
        qrup: "Matris Qrupu",
        statMovzu: document.getElementById('statMovzu').value,
        elaveNovu: document.getElementById('elaveYoxlamaNovu').value,
        elaveMovzu: document.getElementById('elaveMovzu').value,
        sagirdler: []
    };

    let statuses = document.querySelectorAll('.att-status');
    let sVerilen = document.querySelectorAll('.stat-verilen');
    let sIslenen = document.querySelectorAll('.stat-islenen');
    let sDogru = document.querySelectorAll('.stat-dogru');
    
    let aEmosional = document.querySelectorAll('.act-emosianal');
    let aFaiz = document.querySelectorAll('.act-faiz');

    let eIslenen = document.querySelectorAll('.extra-islenen');
    let eDogru = document.querySelectorAll('.extra-dogru');

    let hTapsiriq = document.querySelectorAll('.hw-tapsiriq');
    let hQeyd = document.querySelectorAll('.hw-qeyd');

    statuses.forEach((el, i) => {
        payload.sagirdler.push({
            ad: el.getAttribute('data-ad'),
            status: el.value,
            verilenTest: sVerilen[i] ? sVerilen[i].value : "",
            islenenTest: sIslenen[i] ? sIslenen[i].value : "",
            dogruTest: sDogru[i] ? sDogru[i].value : "",
            emosional: aEmosional[i] ? aEmosional[i].value : "",
            faiz: aFaiz[i] ? aFaiz[i].value : "",
            elaveIslenen: eIslenen[i] ? eIslenen[i].value : "",
            elaveDogru: eDogru[i] ? eDogru[i].value : "",
            tapsiriq: hTapsiriq[i] ? hTapsiriq[i].value : "",
            qeyd: hQeyd[i] ? hQeyd[i].value : ""
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
            alert("Xəta: " + res.message);
        }
    })
    .catch(err => {
        alert("Bağlantı xətası: " + err);
    });
}

function handleRegister(event) {
    event.preventDefault();
    let inputs = event.target.querySelectorAll('input, select');
    let payload = {
        action: "register",
        adSoyad: inputs[0].value,
        sinif: inputs[1].value,
        bolge: inputs[2].value,
        xidmet: inputs[3].value,
        telefon: inputs[4].value
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(res => {
        if(res.status === "success") {
            alert("Müraciətiniz uğurla qeydə alındı!");
            event.target.reset();
        } else {
            alert("Xəta: " + res.message);
        }
    });
}
