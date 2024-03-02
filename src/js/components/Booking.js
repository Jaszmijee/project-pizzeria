import {templates, select, settings, classNames} from "../settings.js";
import AmountWidget from "./AmountWidget.js";
import DatePicker from "./DatePicker.js";
import HourPicker from "./HourPicker.js";
import {utils} from "../utils.js";


class Booking {

    constructor(element) {  // eslint-disable-line no-unused-vars
        const thisBooking = this;
        thisBooking.selectedTable = null;
        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    getData() {
        const thisBooking = this;
        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.dom.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.dom.datePicker.maxDate);
        const params = {
            booking: [startDateParam, endDateParam,],
            eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam,],
            eventsRepeat: [settings.db.repeatParam, endDateParam,],
        }
        const urls = {
            booking: settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
            eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),

        };

        Promise.all([fetch(urls.booking), fetch(urls.eventsCurrent), fetch(urls.eventsRepeat)])
            .then(function (allResposnes) {
                const bookingResposne = allResposnes[0];
                const eventsCurrentResposne = allResposnes[1];
                const eventsRepeatResposne = allResposnes[2];

                return Promise.all([
                    bookingResposne.json(),
                    eventsCurrentResposne.json(),
                    eventsRepeatResposne.json(),
                ])
            })
            .then(function ([bookings, eventsCurrent, eventsRepeat]) {
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat)
            })
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;
        thisBooking.booked = {};

        for (let item of bookings) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }
        for (let item of eventsCurrent) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.dom.datePicker.minDate;
        const maxDate = thisBooking.dom.datePicker.maxDate;

        for (let item of eventsRepeat) {
            if (item.repeat === 'daily') {
                for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }

        thisBooking.updateDOM();
    }

    updateDOM() {
        const thisBooking = this;
        thisBooking.date = thisBooking.dom.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.dom.hourPicker.value);
        let allAvailable = false;

        if (typeof thisBooking.booked[thisBooking.date] === 'undefined'
            || typeof thisBooking.booked[thisBooking.date][thisBooking.hour] === 'undefined') {
            allAvailable = true;
        }

        for (let table of thisBooking.dom.tables) {
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if (!isNaN(tableId)) {
                tableId = parseInt(tableId)
            }

            if (!allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)) {
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
        thisBooking.resetSelectedTables();
    }

    resetSelectedTables() {
        const thisBooking = this;
        for (let table of thisBooking.dom.tables) {
            if (!table.selectedTable) {
                table.classList.remove(classNames.booking.tableSelected);
            }
        }
    }

    makeBooked(date, hour, duration, table) {
        const thisBooking = this;
        if (typeof thisBooking.booked[date] === 'undefined') {
            thisBooking.booked[date] = {};
        }
        const startHour = utils.hourToNumber(hour);


        for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
            if (typeof thisBooking.booked[date][hourBlock] === 'undefined') {
                thisBooking.booked[date][hourBlock] = [];
            }
            thisBooking.booked[date][hourBlock].push(table)
        }
    }


    render(element) {
        const thisBooking = this;
        const generatedHTML = templates.bookingWidget();
        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
        thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);

        thisBooking.dom.datePicker = document.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = document.querySelector(select.widgets.hourPicker.wrapper);
        thisBooking.dom.tables = document.querySelectorAll(select.booking.tables);
        thisBooking.dom.startersCheckboxes = document.querySelectorAll(select.booking.starters);

        thisBooking.dom.form = document.querySelector(select.booking.form);
        thisBooking.dom.phone = document.querySelector(select.booking.phone);
        thisBooking.dom.address = document.querySelector(select.booking.address);
    }


    selectTable(event) {
        const thisBooking = this;
        event.preventDefault();
        const clickedElement = event.target;

        if (clickedElement.classList.contains('table') && !clickedElement.classList.contains(classNames.booking.tableBooked)) {
            clickedElement.classList.toggle(classNames.booking.tableSelected);
            for (let otherTable of thisBooking.dom.tables) {
                if (otherTable !== clickedElement) {
                    otherTable.classList.remove(classNames.booking.tableSelected);
                }
            }
        }
        thisBooking.selectedTable = clickedElement;
        console.log('thisBooking.selectedTable', thisBooking.selectedTable)
    }

    initWidgets() {
        const thisBooking = this;
        thisBooking.dom.peopleAmount.addEventListener('click', function () {
        });
        thisBooking.dom.hoursAmount.addEventListener('', function () {
        });
        thisBooking.dom.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.dom.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.dom.datePicker = new DatePicker(thisBooking.dom.datePicker)
        thisBooking.dom.hourPicker = new HourPicker(thisBooking.dom.hourPicker)

        thisBooking.dom.wrapper.addEventListener('updated', function () {
            thisBooking.updateDOM();
        })
        thisBooking.dom.tables.forEach(function (table) {
            if (!table.classList.contains(classNames.booking.tableBooked)) {
                table.addEventListener('click', function (event) {
                    thisBooking.selectTable(event);
                });
            }
        });

        thisBooking.dom.form.addEventListener('submit', function (event) {
            event.preventDefault();
            thisBooking.sendBooking();

        })

    }

    sendBooking() {
        const thisBooking = this;
        const url = settings.db.url + '/' + settings.db.bookings;
        const selectedStarters = [];
        for (let starterCheckbox of thisBooking.dom.startersCheckboxes) {
            if (starterCheckbox.checked) {
                selectedStarters.push(starterCheckbox.value);
            }
        }

        const payload = {
            date: thisBooking.date,
            hour: utils.numberToHour(thisBooking.hour),
            table: thisBooking.selectedTable ? parseInt(thisBooking.selectedTable.dataset.table) : null,
            duration: thisBooking.dom.hoursAmount.value,
            ppl: parseInt(thisBooking.dom.peopleAmount.value),
            starters: selectedStarters,
            phone: thisBooking.dom.phone.value,
            address: thisBooking.dom.address.value,
        };


        const options = {
            method: 'POST', headers: {
                'Content-Type': 'application/json',
            }, body: JSON.stringify(payload),
        };

        fetch(url, options)
            .then(function (response) {
                return response.json();
            })
            .then(function (parsedResponse) {
                thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table)
                console.log('Booking confirmed', parsedResponse)
            });
    }
}

export default Booking;