import BaseWidget from '../components/BaseWidget.js';
import utils from '../utils.js';
import {select, settings} from '../settings.js';

class DatePicker extends BaseWidget{
  constructor(wrapper){
    super(wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisWidget.initPlugin();
  }
  initPlugin(){
    const thisWidget = this;

    thisWidget.minDate = new Date();
    thisWidget.maxDate = utils.addDays(thisWidget.minDate, settings.datePicker.maxDaysInFuture);

    // eslint-disable-next-line no-undef
    flatpickr(thisWidget.dom.input, {
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      locale: {
        firstDayOfWeek: 1
      },
      disable: [
        function(date) {
          return (date.getDay() === 1); // Wyłącz poniedziałki
        }
      ],
      onChange: (selectedDates, dateStr) => {
        const thisWidget = this;
      
        //console.log(`📅 Flatpickr wybrał nową datę: ${dateStr}`);
      
        // 🔄 WYMUSZONA AKTUALIZACJA
        thisWidget.value = dateStr; 
        thisWidget.dom.input.value = dateStr; // Ręczna aktualizacja inputa Flatpickr
        thisWidget.dom.input.dispatchEvent(new Event('change')); // Wymuszenie eventu zmiany
      
        //console.log(`🔄 Nowa wartość thisWidget.value: ${thisWidget.value}`);
      
        // 📢 Wysyłamy event 'updated'
        thisWidget.announce();
      },
    });
  }

  announce() {
    const thisWidget = this;
    //console.log(`📢 DatePicker: Wysłano event 'updated' z wartością: ${thisWidget.value}`);
    const event = new Event('updated', {
      bubbles: true
    });
    thisWidget.dom.input.dispatchEvent(event);
  }
  


  parseValue(value) {
    console.log(`📆 parseValue() otrzymało:`, value);
    return String(value); // ✅ Wymuszenie konwersji na string
  }

  isValid(){
    return true;
  }

  renderValue(){

  }
}

export default DatePicker;
