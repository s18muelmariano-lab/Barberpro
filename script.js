
const $ = (selector) => document.querySelector(selector);

const STORAGE_KEY = 'barberpro_demo_appointments';

const dateInput = $('#date');
const timeSelect = $('#time');

const today = new Date();

const localToday = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().slice(0, 10);

dateInput.min = localToday;
dateInput.value = localToday;

function readAppointments() {
    try {
        return JSON.parse(
            localStorage.getItem(STORAGE_KEY) || '[]'
        );
    } catch {
        return [];
    }
}

function saveAppointments(items) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items)
    );
}

function refreshTimes() {
    const date = dateInput.value;
    const barber = $('#barber').value;

    const occupied = readAppointments()
        .filter(a => a.date === date && a.barber === barber)
        .map(a => a.time);

    timeSelect.innerHTML =
        '<option value="">Selecione um horário</option>';

    const availableTimes = [
        '09:00', '09:30',
        '10:00', '10:30',
        '11:00', '11:30',
        '13:00', '13:30',
        '14:00', '14:30',
        '15:00', '15:30',
        '16:00', '16:30',
        '17:00', '17:30'
    ];

    availableTimes.forEach(time => {
        const option = document.createElement('option');

        option.value = time;

        option.textContent = occupied.includes(time)
            ? `${time} · ocupado`
            : time;

        option.disabled = occupied.includes(time);

        timeSelect.appendChild(option);
    });
}

function renderAppointments() {
    const list = $('#appointments-list');
    const items = readAppointments();

    list.innerHTML = '';

    if (!items.length) {
        list.innerHTML = `
            <div class="empty-state">
                Você ainda não possui agendamentos neste dispositivo.
            </div>
        `;
        return;
    }

    items.sort((a, b) =>
        (a.date + a.time).localeCompare(b.date + b.time)
    );

    items.forEach(item => {
        const article = document.createElement('article');
        article.className = 'appointment';

        const info = document.createElement('div');

        const title = document.createElement('strong');
        title.textContent = `${item.service} · ${item.customer}`;

        const detail = document.createElement('p');
        detail.textContent =
            `${item.date.split('-').reverse().join('/')} às ${item.time} · ${item.barber} · R$ ${item.price}`;

        info.append(title, detail);

        const cancel = document.createElement('button');
        cancel.className = 'cancel-btn';
        cancel.textContent = 'Cancelar';

        cancel.addEventListener('click', () => {
            const updatedItems = readAppointments()
                .filter(a => a.id !== item.id);

            saveAppointments(updatedItems);
            renderAppointments();
            refreshTimes();
        });

        article.append(info, cancel);
        list.append(article);
    });
}

dateInput.addEventListener('change', refreshTimes);
$('#barber').addEventListener('change', refreshTimes);

$('#booking-form').addEventListener('submit', event => {
    event.preventDefault();

    const customer = $('#customer').value.trim();
    const serviceParts = $('#service').value.split('|');
    const barber = $('#barber').value;
    const date = dateInput.value;
    const time = timeSelect.value;

    if (!customer || !serviceParts[0] || !barber || !date || !time) {
        return;
    }

    const items = readAppointments();

    const alreadyBooked = items.some(a =>
        a.date === date &&
        a.time === time &&
        a.barber === barber
    );

    if (alreadyBooked) {
        $('#booking-feedback').textContent =
            'Esse horário acabou de ser reservado. Escolha outro.';

        refreshTimes();
        return;
    }

    items.push({
        id: Date.now(),
        customer: customer,
        service: serviceParts[0],
        price: Number(serviceParts[1])
            .toFixed(2)
            .replace('.', ','),
        barber: barber,
        date: date,
        time: time
    });

    saveAppointments(items);

    $('#booking-feedback').textContent =
        'Agendamento registrado neste navegador! Pagamento presencial.';

    $('#booking-form').reset();

    dateInput.value = localToday;
    timeSelect.innerHTML =
        '<option value="">Escolha a data</option>';

    renderAppointments();
    refreshTimes();

    location.hash = '#meus-horarios';
});

$('#login-open').addEventListener('click', () => {
    $('#login-dialog').showModal();
});

$('#login-dialog .dialog-close').addEventListener('click', () => {
    $('#login-dialog').close();
});

refreshTimes();
renderAppointments();
