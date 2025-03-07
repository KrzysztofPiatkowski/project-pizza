import{select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';



class Product {
  constructor(id, data) {
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();

    //console.log('new Product:', thisProduct)
  }

  renderInMenu() {
    const thisProduct = this;

    /* generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);
    //console.log('Wygenerowany HTML:', generatedHTML);

    /* create element using utils.createElementFromTML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    //console.log('Element DOM:', thisProduct.element);

    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);
    //console.log('Kontener Menu:', menuContainer);

    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);

    //console.log('Szukany element:',thisProduct.element);
    if (!thisProduct.element) {
      console.error("Błąd: thisProduct.element nie istnieje!");
      return;
    }
  }
  
  getElements(){
    const thisProduct = this;
  
    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAccordion() {
     const thisProduct = this;
  
    /* find the clickable trigger (the element that should react to clicking) */
    // const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
  
    /* START: add event listener to clickable trigger on event click */
    thisProduct.accordionTrigger.addEventListener('click', function(event) {  /* zmienilem clickableTrigger na thisProduct.accordionTrigger */
    /* prevent default action for event */
      event.preventDefault();
      event.stopPropagation();
  
    /* find active product (product that has active class) */
      const activeProduct = document.querySelector(`.${classNames.menuProduct.wrapperActive}`);
      //console.log(activeProduct);
  
    /* if there is active product and it's not thisProduct.element, remove class active from it */
    if(activeProduct && activeProduct !== thisProduct.element) {
      // Sprawdzamy, czy to rzeczywiście produkt, a nie cała strona
      if (activeProduct.classList.contains('product')) {
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }
  }
  
    /* toggle active class on thisProduct.element */
      if (thisProduct.element) {
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      }
  });
  }

  initOrderForm() {
    const thisProduct = this;
    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });
    
    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
    
    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });

    //console.log('Jestem w metodzie initOrderForm');
    
  }
  

  processOrder() {
    const thisProduct = this;
  
    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.form);
    //console.log('formData', formData);
  
    // set price to default price
    let price = thisProduct.data.price;
  
    // for every category (param)...
    for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
      //console.log('Pierwsza petla: ',paramId, param);
  
      // for every option in this category
      for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
        //console.log('Druga petla: ',optionId, option);

        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        const optionImage = thisProduct.imageWrapper.querySelector(`.${paramId}-${optionId}`);
        //console.log('Option Iamge: ', optionImage);

        if(optionImage) {
          if (optionSelected) {
          optionImage.classList.add(classNames.menuProduct.imageVisible);
          } else {
          optionImage.classList.remove(classNames.menuProduct.imageVisible);
        }
      }

        // check if there is param with a name of paramId in formData and if it includes optionId
        if(optionSelected) {
          // check if the option is not default
          if(!option.default) {
            // add option price to price variable
            price+=option.price;
            //thisProduct.images.classList.add(thisProduct.imageWrapper);
          } 
        } else {
            // check if the option is default
            if (option.default) {
              price-=option.price;
            } 
          }

        } 
      }

    thisProduct.priceSingle = price;
    //console.log('Cena jednostkowa to :',thisProduct.priceSingle);

    /* multiply price by amount */
    price *= thisProduct.amountWidget.value;

    // update calculated price in the HTML
    thisProduct.priceElem.innerHTML = price;
  }

  initAmountWidget(){
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
    });
  }

  addToCart() {
    const thisProduct = this;
 
    //  app.cart.add(thisProduct.prepareCartProduct());
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    }
    );
    thisProduct.element.dispatchEvent(event);
 }

  prepareCartProduct(){
    const thisProduct = this;

    const productSummary = {};
    productSummary.id = thisProduct.id;
    productSummary.name = thisProduct.data.name;
    productSummary.amount = thisProduct.amountWidget.value;
    productSummary.priceSingle = thisProduct.priceSingle;
    productSummary.price = thisProduct.amountWidget.value*thisProduct.priceSingle;
    productSummary.params = thisProduct.prepareCartProductParams();

    return productSummary;
  }

  prepareCartProductParams(){

    const thisProduct = this;

    const formData = utils.serializeFormToObject(thisProduct.form);
    const params = {};

    // for very category (param)
    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];

      // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
      params[paramId] = {
        label: param.label,
        options: {}
      }

      // for every option in this category
      for(let optionId in param.options) {
        const option = param.options[optionId];
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

        if(optionSelected) {
          // option is selected!
          params[paramId].options[optionId] = option.label;
        }
      }
    }

    return params;
  }

}

export default Product;