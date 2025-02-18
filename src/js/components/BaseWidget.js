class BaseWidget{
  constructor(wrapperElement, initialValue){
    const thisWidget = this;

    thisWidget.dom = {};
    thisWidget.dom.wrapper = wrapperElement;

    thisWidget.correctValue = initialValue;
  }

  get value(){
    const thisWidget = this;

    return thisWidget.correctValue;
  }

  // set value(value){
  //   const thisWidget = this;

  //   const newValue = thisWidget.parseValue(value);

  //   /* TODO: Add validation */
  //   if(thisWidget.correctValue !== newValue && !isNaN(newValue) && thisWidget.isValid(newValue)){
  //     thisWidget.correctValue = newValue;
  //     thisWidget.announce();
  //   }
  //   //thisWidget.correctValue = newValue;
  //   thisWidget.renderValue();
  // }

  set value(value) {
    const thisWidget = this;
    const newValue = thisWidget.parseValue(value);
  
    //console.log(`🔄 BaseWidget: Nowa wartość ${newValue} (stara: ${thisWidget.correctValue})`);
  
    if (thisWidget.correctValue !== newValue && thisWidget.isValid(newValue)) {
      thisWidget.correctValue = newValue;
      thisWidget.announce();
    }
  
    thisWidget.renderValue();
  }
  
  setValue(value){
    const thisWidget = this;

    thisWidget.value = value;
  }

  parseValue(value) {
    // Jeśli wartość wygląda jak data (ma myślniki), zwróć ją jako string
    if (typeof value === 'string' && value.includes('-')) {
      return value;
    }
  
    // W przeciwnym razie spróbuj przekonwertować na liczbę
    return parseInt(value);
  }
  

  isValid(value){
    return !isNaN(value);
  }

  renderValue(){
    const thisWidget = this;

    thisWidget.dom.wrapper.innerHTML = thisWidget.value;
  }

  announce(){
    const thisWidget = this;

    const event = new CustomEvent('updated',{
      bubbles: true
    });
    thisWidget.dom.wrapper.dispatchEvent(event);
  }

}

export default BaseWidget;