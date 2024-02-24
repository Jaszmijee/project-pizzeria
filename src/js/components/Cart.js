import {settings, select, templates, classNames} from "../settings.js";
import {utils} from "../utils.js";
import CartProduct from "./CartProduct.js";

class Cart {
    constructor(element) {
        const thisCart = this;
        thisCart.products = [];
        thisCart.totalPriceTop = 0;
        thisCart.totalPriceBottom = thisCart.totalPriceTop;
        thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
        thisCart.totalNumber = 0;
        thisCart.subtotalPrice = 0;
        thisCart.getElements(element);
    }

    getElements(element) {
        const thisCart = this;
        thisCart.dom = {};
        thisCart.dom.wrapper = element;
        thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
        thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);

        thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
        thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
        thisCart.dom.totalPriceTop = thisCart.dom.wrapper.querySelector(select.cart.totalPrice_top);
        thisCart.dom.totalPriceBottom = thisCart.dom.wrapper.querySelector(select.cart.totalPrice_bottom);
        thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);

        thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
        thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
        thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    }

    initActions() {
        const thisCart = this;
        thisCart.dom.toggleTrigger.addEventListener('click', function (event) {
            event.preventDefault();
            thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
            thisCart.dom.productList.addEventListener('updated', function () {
                thisCart.update();
            })
        });
        thisCart.dom.form.addEventListener('submit', function (event) {
            event.preventDefault();
            thisCart.sendOrder();
        })
    }

    add(menuProduct) {
        const thisCart = this;

        /* Generate HTML based on the cartProduct template */
        const generatedHTML = templates.cartProduct(menuProduct);

        /* Create DOM element from HTML */
        const generatedDOM = utils.createDOMFromHTML(generatedHTML);

        /* Add the element to productList in the cart */
        thisCart.dom.productList.appendChild(generatedDOM);

        // Create and store an instance of CartProduct
        const cartProduct = new CartProduct(menuProduct, generatedDOM);
        thisCart.products.push(cartProduct);
        thisCart.update();
    }

    update() {
        const thisCart = this;

        thisCart.totalNumber = 0;
        thisCart.subtotalPrice=0;
        thisCart.totalPriceTop=0;
        thisCart.totalPriceBottom=0;

        for (let product of thisCart.products) {
            thisCart.totalNumber += product.amount;
            thisCart.subtotalPrice += product.price;
        }
        thisCart.totalPriceTop = (thisCart.totalNumber !== 0) ? thisCart.subtotalPrice + thisCart.deliveryFee : 0;
        thisCart.totalPriceBottom = thisCart.totalPriceTop;

        thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
        thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
        thisCart.dom.totalPriceTop.innerHTML = thisCart.totalPriceTop;
        thisCart.dom.totalPriceBottom.innerHTML = thisCart.totalPriceBottom;
        thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;

        console.log('deliveryFee', thisCart.deliveryFee)
        console.log('totalNumber', thisCart.totalNumber)
        console.log('subtotalPrice', thisCart.subtotalPrice)
        console.log('totalPrice', thisCart.totalPriceTop)
    }



    sendOrder() {
        const thisCart = this;
        const url = settings.db.url + '/' + settings.db.orders;

        const payload = {
            address: thisCart.dom.address.value,
            phone: thisCart.dom.phone.value,
            totalPrice: thisCart.totalPriceTop,
            subtotalPrice: thisCart.dom.subtotalPrice.innerHTML,
            totalNumber: thisCart.dom.totalNumber.innerHTML,
            deliveryFee: thisCart.dom.deliveryFee.innerHTML,
            products: [],
        }

        for (let prod of thisCart.products) {
            payload.products.push(prod.getData());
        }

        console.log('payload', payload);

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
                console.log('order confirmed', parsedResponse)
            });
    }

}

export default Cart;