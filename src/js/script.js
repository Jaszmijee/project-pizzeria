/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
    'use strict';

    const select = {
        templateOf: {
            menuProduct: '#template-menu-product',
            cartProduct: '#template-cart-product',
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
                input: 'input.amount',
                linkDecrease: 'a[href="#less"]',
                linkIncrease: 'a[href="#more"]',
            },
        },

        cart: {
            productList: '.cart__order-summary',
            toggleTrigger: '.cart__summary',
            totalNumber: `.cart__total-number`,
            totalPrice_top: '.cart__total-price strong',
            totalPrice_bottom: '.cart__order-total .cart__order-price-sum strong',
            subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
            deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
            form: '.cart__order',
            formSubmit: '.cart__order [type="submit"]',
            phone: '[name="phone"]',
            address: '[name="address"]',
        },
        cartProduct: {
            amountWidget: '.widget-amount',
            price: '.cart__product-price',
            edit: '[href="#edit"]',
            remove: '[href="#remove"]',
        },

    };

    const classNames = {
        menuProduct: {
            wrapperActive: 'active',
            imageVisible: 'active',
        },
        cart: {
            wrapperActive: 'active',
        },
    };

    const settings = {
        amountWidget: {
            defaultValue: 1,
            defaultMin: 1,
            defaultMax: 9,
        },
        cart: {
            defaultDeliveryFee: 20,
        },
        db: {
            url: '//localhost:3131',
            products: 'products',
            orders: 'orders',
        },
    };

    const templates = {
        menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
        cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    };

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

        addToCart() {
            const thisProduct = this;
            app.cart.add(thisProduct.prepareCartProduct());
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


    class AmountWidget {
        constructor(element) {
            const thisWidget = this;

            thisWidget.getElements(element);
            if (thisWidget.input.value) {
                thisWidget.setValue(thisWidget.input.value);
            } else {
                thisWidget.setValue(settings.amountWidget.defaultValue);
            }
        }

        getElements(element) {
            const thisWidget = this;

            thisWidget.element = element;
            thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
            thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
            thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
        }

        setValue(value) {
            const thisWidget = this;
            const newValue = parseInt(value);

            if (!isNaN(newValue) && thisWidget.value !== newValue && newValue >= settings.amountWidget.defaultMin
                && newValue <= settings.amountWidget.defaultMax) {
                thisWidget.value = newValue;
                thisWidget.announce();

            }
            thisWidget.input.value = thisWidget.value;
        }

        initActions() {
            const thisWidget = this;
            thisWidget.input.addEventListener('change', function () {
                thisWidget.setValue(thisWidget.input.value);
            });
            thisWidget.linkDecrease.addEventListener('click', function (event) {
                /* prevent default action for event */
                event.preventDefault();
                thisWidget.setValue(thisWidget.value - 1);
            })
            thisWidget.linkIncrease.addEventListener('click', function (event) {
                /* prevent default action for event */
                event.preventDefault();
                thisWidget.setValue(thisWidget.value + 1);
            })
        }

        announce() {
            const thisWidget = this;
            const event = new CustomEvent('updated', {bubbles: true});
            thisWidget.element.dispatchEvent(event);
        }
    }

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

            for (let product of thisCart.products) {
                thisCart.totalNumber++;
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
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
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

    const
        app = {
            initMenu: function () {
                const thisApp = this;
                for (let productData in thisApp.data.products) {
                    new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
                }
            },
            initData: function () {
                const thisApp = this;
                thisApp.data = {};
                const url = settings.db.url + '/' + settings.db.products;

                fetch(url)
                    .then(function (rawResponse) {
                        return rawResponse.json();
                    })
                    .then(function (parsedResponse) {
                        console.log('parsedResponse', parsedResponse)

                        /* save parsedResponse as thisApp.data.products */
                        thisApp.data.products = parsedResponse;

                        /* execute initMenu() method */
                        thisApp.initMenu();
                    });


                console.log('thisApp data', JSON.stringify(thisApp.data));

            },
            init: function () {
                const thisApp = this;
                console.log('*** App starting ***');
                console.log('thisApp:', thisApp);
                console.log('classNames:', classNames);
                console.log('settings:', settings);
                console.log('templates:', templates);

                thisApp.initData();
                thisApp.initCart();
            },
            initCart: function () {
                const thisApp = this;
                const cartElem = document.querySelector(select.containerOf.cart);
                thisApp.cart = new Cart(cartElem);
                thisApp.cart.initActions();
            }
        };

    app.init();
}
