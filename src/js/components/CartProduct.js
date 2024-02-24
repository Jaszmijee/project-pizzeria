import {select} from "../settings.js";
import AmountWidget from "./AmountWidget.js";

class CartProduct {
    constructor(menuProduct, element) {
        const thisCartProduct = this;
        thisCartProduct.id = menuProduct.id;
        thisCartProduct.name = menuProduct.name;
        thisCartProduct.amount = menuProduct.amount;
        thisCartProduct.priceSingle = menuProduct.priceSingle;
        thisCartProduct.price = menuProduct.price;
        thisCartProduct.params = menuProduct.params;
        thisCartProduct.getElements(element);
        thisCartProduct.initAmountWidget();
    }

    getElements(element) {
        const thisCartProduct = this;
        thisCartProduct.dom = {};
        thisCartProduct.dom.wrapper = element;
        thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
        thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
        thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
        thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    initAmountWidget() {
        const thisCartProduct = this;
        thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget)
        thisCartProduct.amountWidget.initActions();
        thisCartProduct.dom.amountWidget.addEventListener('updated', function () {
            thisCartProduct.amount = thisCartProduct.amountWidget.value;
            thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;
            thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
        });
    }

    getData() {
        const thisCartProduct = this;
        const cartProductSummary = {
            id: thisCartProduct.id,
            amount: thisCartProduct.amount,
            price: thisCartProduct.price,
            priceSingle: thisCartProduct.priceSingle,
            name: thisCartProduct.name,
            params: thisCartProduct.params,
        }
        console.log('cartProductSummary', cartProductSummary)
        return cartProductSummary;
    }
}

export default CartProduct;