import {classNames, select, settings, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element){
    const thisBooking = this;
    thisBooking.element = element;

    //przechowanie wybranego stolika
    thisBooking.selectedTable = null;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData(){
    const thisBooking = this;

    console.log(`📡 Pobieram dane dla zakresu: ${thisBooking.datePicker.minDate} - ${thisBooking.datePicker.maxDate}`);

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    console.log('getData params', params);

    const urls = {
      booking:       settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
    };

    // console.log(' urls events Current', urls.eventsCurrent);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ]).then(function(allResponses){
      const bookingsResponse = allResponses[0];
      const eventsCurrentResponse = allResponses[1];
      const eventsRepeatResponse = allResponses[2];
      
      return Promise.all([
        bookingsResponse.json(),
        eventsCurrentResponse.json(),
        eventsRepeatResponse.json(),
    ]);
    }).then(function([bookings, eventsCurrent, eventsRepeat]){
      // console.log('Tablica bookings', bookings);
      // console.log('Tablica eventCurrent', eventsCurrent);
      // console.log('Tablica eventRepeat', eventsRepeat);
      thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
    });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
      for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
        thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
      }
      }
    }
    // console.log('Obiekt thisBooking.booked', thisBooking.booked);

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock=startHour; hourBlock < startHour + duration; hourBlock += 0.5){

      // console.log('loop', hourBlock);
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
  
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM(){
    const thisBooking = this;

    //console.log(`🛠 Aktualizacja DOM! Data: ${thisBooking.date}, Godzina: ${thisBooking.hour}`);

    thisBooking.date = thisBooking.datePicker.value;
    
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    //console.log(`📅 WYBRANA DATA: ${thisBooking.date}, ⏰ WYBRANA GODZINA: ${thisBooking.hour}`);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
        //console.log(` Stolik ${tableId} jest ZAJĘTY na ${thisBooking.date} o ${thisBooking.hour}`);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
        //console.log(` Stolik ${tableId} jest WOLNY na ${thisBooking.date} o ${thisBooking.hour}`);
      }
    }

    thisBooking.selectedTable = null;
    const selectedTable = thisBooking.dom.tablesWrapper.querySelector('.selected')
        if (selectedTable){
          selectedTable.classList.remove('selected');
          console.log('Usunąłem klasę selected z innego stolika');
        }
  }

  render(element){
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;

    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);

    thisBooking.dom.tablesWrapper = thisBooking.dom.wrapper.querySelector('.floor-plan');

    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector('.booking-form');

    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector('input[name="phone"]');
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector('input[name="address"]');
  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.peopleAmount.addEventListener('updated', function(){

    });

    thisBooking.dom.hoursAmount.addEventListener('updated', function(){

    });

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      //console.log(`🔄 Aktualizacja! Wybrana data: ${thisBooking.datePicker.value}`);
      thisBooking.updateDOM();
    })

    

    thisBooking.datePicker.dom.input.addEventListener('updated', function(){
      //console.log(`📡 Booking: Odebrano event 'updated', nowa data powinna być: ${thisBooking.datePicker.value}`);
    
      thisBooking.date = thisBooking.datePicker.value; // ✅ Ustawienie poprawnej wartości!
      //console.log(`📆 NOWA DATA W Booking.js: ${thisBooking.date}`);
    
      //console.log(`🛠 Aktualizacja DOM!`);
      thisBooking.updateDOM(); // 🔄 Aktualizacja DOM po zmianie daty
    });
    
    // thisBooking.dom.tablesWrapper.addEventListener('click', function(){
    //   thisBooking.initTables();
    // });

    thisBooking.dom.tablesWrapper.addEventListener('click', (event) => {
      thisBooking.initTables(event);
    });

    thisBooking.dom.form.addEventListener('submit', (event)=>{
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  sendBooking(){
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.bookings;

    const payload = {};
    payload.date = thisBooking.datePicker.value;
    payload.hour = thisBooking.hourPicker.value;
    payload.table = parseInt(thisBooking.selectedTable);
    payload.duration = parseInt(thisBooking.hoursAmount.value);
    payload.ppl = parseInt(thisBooking.peopleAmount.value);
    payload.starters = [];
    payload.phone = thisBooking.dom.phone.value;
    payload.address = thisBooking.dom.address.value;

    const starterCheckboxes = thisBooking.dom.wrapper.querySelectorAll('input[name="starter"]:checked');

    for(let i=0; i<starterCheckboxes.length; i++){
      payload.starters.push(starterCheckboxes[i].value);
    }

    console.log('Wysyłanie rezerwacji ', payload);

    
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };

  fetch(url, options)
    .then((response) => response.json())
    .then((responseData) => {
      console.log('Odpowiedź z serwra ', responseData);
      thisBooking.makeBooked(
        payload.date,
        payload.hour,
        payload.duration,
        payload.table
      );

      thisBooking.updateDOM();
    });

  }

  initTables(event){
    const thisBooking = this;

    if(!event.target.classList.contains('table')){
      return;
    }

    if(event.target.classList.contains('booked')){
      alert('Ten stolik jest niedostepny!');
      return;
    }

    if(event.target.classList.contains('selected')){
      event.target.classList.remove('selected');
      thisBooking.selectedTable = null;
      console.log('Odznaczyłem stolik, już nie jest zajęty');
      return;
    }

    const selectedTable = thisBooking.dom.tablesWrapper.querySelector('.selected')
        if (selectedTable){
          selectedTable.classList.remove('selected');
          console.log('Usunąłem klasę selected z innego stolika');
        }
    event.target.classList.add('selected');
    console.log('Dodałem klasę selected do nowego stlika');

    const tableId = event.target.getAttribute(settings.booking.tableIdAttribute);
    thisBooking.selectedTable = tableId ? parseInt(tableId) : null;
    console.log('Wybrany stolik ma id ', thisBooking.selectedTable);

  }

}


export default Booking;