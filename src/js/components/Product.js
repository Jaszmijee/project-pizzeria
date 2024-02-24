import {select, templates, classNames} from "../settings.js";
import {utils} from "../utils.js";
import AmountWidget from "./AmountWidget.js";

class Product {
    constructor(id, data) {
        const thisProduct = this;
        thisProduct.id = id;
        thisProduct.data = data;
        thisProduct.dom = {};
        thisProduct.renderInMenu();
        thisProduct.getElements();
        thisProduct.initAccordion();
        thisProduct.initOrderForm();
        thisProduct.initAmountWidget();
        thisProduct.processOrder();
    }

    renderInMenu() {
        const thisProduct = this;

        /*Generate HTML based on template*/
        const generatedHTML = templates.menuProduct(thisProduct.data);

        /*create element using utils.createElementFromHTML*/
        thisProduct.dom.element = utils.createDOMFromHTML(generatedHTML);

        /*find menu container*/
        const menuContainer = document.querySelector(select.containerOf.menu);

        /* add element to menu*/
        menuContainer.appendChild(thisProduct.dom.element);
    }

    getElements() {
        const thisProduct = this;

        thisProduct.dom.accordionTrigger = thisProduct.dom.element.querySelector(select.menuProduct.clickable);
        thisProduct.dom.form = thisProduct.dom.element.querySelector(select.menuProduct.form);
        thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
        thisProduct.dom.cartButton = thisProduct.dom.element.querySelector(select.menuProduct.cartButton);
        thisProduct.dom.priceElem = thisProduct.dom.element.querySelector(select.menuProduct.priceElem);
        thisProduct.dom.imageWrapper = thisProduct.dom.element.querySelector(select.menuProduct.imageWrapper);
        thisProduct.dom.amountWidgetElem = thisProduct.dom.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion() {
        const thisProduct = this;
        /* find the clickable trigger (the element that should react to clicking) */
        /* START: add event listener to clickable trigger on event click */
        thisProduct.dom.accordionTrigger.addEventListener('click', function (event) {
            /* prevent default action for event */
            event.preventDefault();

            /* find active product (product that has active class) */
            const activeProducts = document.querySelectorAll('.product.active');

            /* if there is an active product and it's not thisProduct.element, remove class active from it*/
            for (let activeProduct of activeProducts) {
                if (activeProduct && activeProduct !== thisProduct.dom.element) {
                    activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
                }
            }

            /* toggle active class on thisProduct.element*/
            thisProduct.dom.element.classList.toggle(classNames.menuProduct.wrapperActive);
        });
    }

    initOrderForm() {
        const thisProduct = this;
        thisProduct.dom.form.addEventListener('submit', function (event) {
            event.preventDefault();
            thisProduct.processOrder();
        });

        for (let input of thisProduct.dom.formInputs) {
            input.addEventListener('change', function () {
                thisProduct.processOrder();
            });
        }

        thisProduct.dom.cartButton.addEventListener('click', function (event) {
            event.preventDefault();
            thisProduct.processOrder();
            thisProduct.addToCart();
        });
    }

    processOrder() {
        const thisProduct = this;
        const formData = utils.serializeFormToObject(thisProduct.dom.form);

        /* set price to default price */
        let price = thisProduct.data.price;

        /* for every category (param)...*/
        for (let paramId in thisProduct.data.params) {
            /* determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }*/
            const param = thisProduct.data.params[paramId];

            /* for every option in this category */
            for (let optionId in param.options) {
                /* determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }*/
                const option = param.options[optionId];

                /* check if the option is selected in the form data */
                const isOptionSelected = formData[paramId].includes(optionId);

                const chooseImageClass = thisProduct.dom.imageWrapper.querySelector('.' + paramId + '-' + optionId);

                if (chooseImageClass) {
                    if (isOptionSelected) {
                        chooseImageClass.classList.add(classNames.menuProduct.imageVisible)
                    } else {
                        chooseImageClass.classList.remove(classNames.menuProduct.imageVisible)
                    }
                }

                /* check if the option is not default and is selected*/
                const addCost = isOptionSelected && !option.default;
                if (addCost) {

                    /* if yes add additional cost*/
                    price += option.price;
                }
                const subtractCost = !isOptionSelected && option.default;
                /* check if the option is default and not selected*/
                if (subtractCost) {

                    /* if yes, remove the cost of unselected basic ingredient*/
                    price -= option.price;
                }
            }

        }

        thisProduct.priceSingle = price;

        /* multiply price by amount*/
        price *= thisProduct.amountWidget.value;

        /* update calculated price in the HTML*/
        thisProduct.dom.priceElem.innerHTML = price;
    }

    initAmountWidget() {
        const thisProduct = this;
        thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem)
        thisProduct.amountWidget.initActions();
        thisProduct.dom.amountWidgetElem.addEventListener('updated', function () {
            thisProduct.processOrder();
        });
    }

   /* addToCart() {
        const thisProduct = this;
        app.cart.add(thisProduct.prepareCartProduct());
    }*/

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
        thisProduct.dom.element.dispatchEvent(event);
    }

    prepareCartProduct() {
        const thisProduct = this;
        const productSummary = {
            id: thisProduct.id,
            name: thisProduct.data.name,
            amount: thisProduct.amountWidget.value,
            priceSingle: thisProduct.priceSingle,
            price: thisProduct.priceSingle * thisProduct.amountWidget.value,
            params: thisProduct.prepareCartProductParams(),
        }
        return productSummary;
    }

    prepareCartProductParams() {
        const thisProduct = this;
        const formData = utils.serializeFormToObject(thisProduct.dom.form);

        const params = {};

        /* for every category (param)...*/
        for (let paramId in thisProduct.data.params) {
            /* determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }*/
            const param = thisProduct.data.params[paramId];

            // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
            params[paramId] = {
                label: param.label,
                options: {},
            }


            /* for every option in this category */
            for (let optionId in param.options) {
                /* determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }*/
                const option = param.options[optionId];

                /* check if the option is selected in the form data */
                const isOptionSelected = formData[paramId].includes(optionId);

                if (isOptionSelected) {
                    params[paramId].options[optionId] = option.label;
                }
            }

        }

        return params;
    }

}

export default Product;