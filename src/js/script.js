/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
    'use strict';

    const select = {
        templateOf: {
            menuProduct: "#template-menu-product",
        },
        containerOf: {
            menu: '#product-list',
            cart: '#cart',
        },
        all: {
            menuProducts: '#product-list > .product',
            menuProductsActive: '#product-list > .product.active',
            formInputs: 'input, select',
        },
        menuProduct: {
            clickable: '.product__header',
            form: '.product__order',
            priceElem: '.product__total-price .price',
            imageWrapper: '.product__images',
            amountWidget: '.widget-amount',
            cartButton: '[href="#add-to-cart"]',
        },
        widgets: {
            amount: {
                input: 'input[name="amount"]',
                linkDecrease: 'a[href="#less"]',
                linkIncrease: 'a[href="#more"]',
            },
        },
    };

    const classNames = {
        menuProduct: {
            wrapperActive: 'active',
            imageVisible: 'active',
        },
    };

    const settings = {
        amountWidget: {
            defaultValue: 1,
            defaultMin: 0,
            defaultMax: 10,
        }
    };

    const templates = {
        menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    };

    class Product {
        constructor(id, data) {
            const thisProduct = this;
            thisProduct.id = id;
            thisProduct.data = data;
            thisProduct.renderInMenu();
            thisProduct.getElements();
            thisProduct.initAccordion();
            thisProduct.initOrderForm();
            thisProduct.processOrder();
            console.log('new Product', thisProduct);
        }

        renderInMenu() {
            const thisProduct = this;
            /*Generate HTML based on template*/
            const generatedHTML = templates.menuProduct(thisProduct.data);

            /*create element using utils.createElementFromHTML*/
            thisProduct.element = utils.createDOMFromHTML(generatedHTML);

            /*find menu container*/
            const menuContainer = document.querySelector(select.containerOf.menu);

            /* add element to menu*/
            menuContainer.appendChild(thisProduct.element);
        }

        getElements() {
            const thisProduct = this;

            thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
            thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
            console.log('thisProduct.form', thisProduct.form)
            thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
            console.log('thisProduct.formInputs', thisProduct.formInputs)
            thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
            thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
            thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper)
        }

        initAccordion() {
            const thisProduct = this;
            console.log('thisProduct', thisProduct)
            /* find the clickable trigger (the element that should react to clicking) */

            /* START: add event listener to clickable trigger on event click */
            thisProduct.accordionTrigger.addEventListener('click', function (event) {
                console.log('event', event);

                // prevent default action for event
                event.preventDefault();

                // find active product (product that has active class)
                const activeProducts = document.querySelectorAll('.product.active');
                console.log('activeProducts', activeProducts);

                // if there is an active product and it's not thisProduct.element, remove class active from it
                for (let activeProduct of activeProducts) {
                    if (activeProduct && activeProduct !== thisProduct.element) {
                        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
                    }
                }

                // toggle active class on thisProduct.element
                thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
            });
        }

        initOrderForm() {
            const thisProduct = this;
            console.log('initOrderForm was started');

            thisProduct.form.addEventListener('submit', function (event) {
                event.preventDefault();
                thisProduct.processOrder();
            });

            for (let input of thisProduct.formInputs) {
                input.addEventListener('change', function () {
                    thisProduct.processOrder();
                });
            }

            thisProduct.cartButton.addEventListener('click', function (event) {
                event.preventDefault();
                thisProduct.processOrder();
            });
        }

        processOrder() {
            const thisProduct = this;
            console.log('processOrder was started');

            const formData = utils.serializeFormToObject(thisProduct.form);
            console.log('formData', formData);
            // set price to default price
            let price = thisProduct.data.price;

            // for every category (param)...
            for (let paramId in thisProduct.data.params) {
                // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
                const param = thisProduct.data.params[paramId];
                console.log(paramId, param);

                // for every option in this category
                for (let optionId in param.options) {
                    // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
                    const option = param.options[optionId];
                    console.log(optionId, option);

                    // check if the option is selected in the form data
                    const isOptionSelected = formData[paramId].includes(optionId);
                    console.log(optionId, 'is selected?', isOptionSelected);


                    const chooseImageClass = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
                    console.log('chooseImageClass', chooseImageClass);
                    if (chooseImageClass) {
                        if (isOptionSelected) {
                            chooseImageClass.classList.add(classNames.menuProduct.imageVisible)
                        } else {
                            chooseImageClass.classList.remove(classNames.menuProduct.imageVisible)
                        }
                    }

                    // check if the option is not default and is selected
                    const addCost = isOptionSelected && !option.default;
                    if (addCost) {
                        console.log('is selected ingredient additional ? ', addCost);

                        // if yes add additional cost
                        price += option.price;
                    }
                    const subtractCost = !isOptionSelected && option.default;
                    // check if the option is default and not selected
                    if (subtractCost) {
                        console.log('is unselected ingredient default ?', subtractCost);
                        // if yes, remove the cost of unselected basic ingredient
                        price -= option.price;
                    }
                    console.log('price equals', price);
                }
            }

            // update calculated price in the HTML
            thisProduct.priceElem.innerHTML = price;
        }

    }


    const
        app = {
            initMenu: function () {
                const thisApp = this;
                console.log('thisApp.data', thisApp.data);
                for (let productData in thisApp.data.products) {
                    new Product(productData, thisApp.data.products[productData])
                }
            },
            initData: function () {
                const thisApp = this;
                thisApp.data = dataSource;
                console.log('thisApp.data', thisApp.data);
            },
            init: function () {
                const thisApp = this;
                console.log('*** App starting ***');
                console.log('thisApp:', thisApp);
                console.log('classNames:', classNames);
                console.log('settings:', settings);
                console.log('templates:', templates);

                thisApp.initData();
                thisApp.initMenu();
            },
        };

    app.init();
}
