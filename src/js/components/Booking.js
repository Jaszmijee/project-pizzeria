import {templates, select, settings} from "../settings.js";
import AmountWidget from "./AmountWidget.js";
import DatePicker from "./DatePicker.js";
import HourPicker from "./HourPicker.js";
import {utils} from "../utils.js";


class Booking {

    constructor(element) {  // eslint-disable-line no-unused-vars
        const thisBooking = this;
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
                console.log('bookings', bookings);
                console.log('eventsCurrent', eventsCurrent);
                console.log('eventsRepeat', eventsRepeat);
            })

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
    }
}

export default Booking;