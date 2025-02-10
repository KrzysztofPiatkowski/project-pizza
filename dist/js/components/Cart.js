import{settings, select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart{
  constructor(element){
    const thisCart = this;

    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions(element);
    //console.log('new Cart', thisCart);
  }

  getElements(element){
    const thisCart = this;
    thisCart.dom = {};
    thisCart.dom.wrapper = element;

    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);

    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    //console.log('thisCart.dom.productList:', thisCart.dom.productList);

    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);

    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);

    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);

  }

  initActions(){
    const thisCart = this;
    thisCart.dom.toggleTrigger.addEventListener('click', function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
    thisCart.dom.productList.addEventListener('updated', function(){
      thisCart.update();
    });
    thisCart.dom.productList.addEventListener('remove', function(){
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisCart.sendOrder();
    });
    
  }

  sendOrder(){
    const thisCart = this;

    const url = settings.db.url + '/' + settings.db.orders;

    const payload = {};
    payload.address = thisCart.dom.address.value;
    payload.phone = thisCart.dom.phone.value;
    payload.totalPrice = thisCart.totalPrice;
    payload.subtotalPrice = thisCart.subtotalPrice;
    payload.totalNumber = thisCart.totalNumber;
    payload.deliveryFee = thisCart.dom.deliveryFee.innerHTML;
    payload.products = [];

    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
    console.log(payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options);

    // fetch(url, options)
    // .then(function(response){
    //   return response.json();
    // }).then(function(parsedResponse){
    //   console.log('parsedResponse', parsedResponse);
    // });
  }


  add(menuProduct){
    const thisCart = this;
    //console.log('adding product', menuProduct);

    const generatedHTML = templates.cartProduct(menuProduct);
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);

    thisCart.dom.productList.appendChild(generatedDOM);

    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    //console.log('thisCart.products', thisCart.products);
    thisCart.update();
  }

  update(){
    const thisCart = this;

    const deliveryFee = settings.cart.defaultDeliveryFee;
    let totalNumber = 0;
    let subtotalPrice = 0;

    for (let product of thisCart.products){
      totalNumber+=product.amount;
      subtotalPrice+=product.price;
    }

    if(totalNumber>0){
      thisCart.totalPrice = subtotalPrice+deliveryFee;
    } else {
      thisCart.totalPrice = 0;
    }

    console.log('Delivery fee:', deliveryFee);
    console.log('Total number:', totalNumber);
    console.log('Subtotal price:', subtotalPrice);
    console.log('Total price:', thisCart.totalPrice);

    thisCart.dom.totalNumber.innerHTML = totalNumber;
    thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
    thisCart.dom.deliveryFee.innerHTML = totalNumber > 0 ? deliveryFee : 0;
    //thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
    thisCart.dom.totalPrice.forEach(elem => {
      elem.innerHTML = thisCart.totalPrice;
    });

    thisCart.subtotalPrice = subtotalPrice;
    thisCart.totalNumber = totalNumber;

  }

  remove(cartProduct) {
    const thisCart = this;
  
    // Usuniecie reprezentacji produktu z HTML-a
    cartProduct.dom.wrapper.remove();
  
    // Usuniecie produktu z tablicy thisCart.products
    const foundIndex = thisCart.products.indexOf(cartProduct);
    if (foundIndex !== -1) {
      thisCart.products.splice(foundIndex, 1);
    }
  
    // Przeliczenie sum po usunieciu produktu
    thisCart.update();
  }

}

export default Cart;