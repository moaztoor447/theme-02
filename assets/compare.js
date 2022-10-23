const LOCAL_STORAGE_COMPARE_KEY = 'zmz-shopify-compare';
const LOCAL_STORAGE_COMPARE_SEPARATOR = ',';
const BUTTON_COMPARE_ACTIVE_CLASS = 'compareIn';
const COMPARE_MAX_ITEM = 6;


const selectorsCompare = {
    buttonCompare: '[btn-compare-js]',
    removeItem: '[remove-item]'
};

let getCompareListBtn = document.getElementById("compare_list"),
    compareCounter = document.getElementById("compare__counter"),
    getCompareList = document.getElementById("compare"),
    getCompareWrapper = document.querySelector(".compare__wrapper"),
    createCompareItem = document.createElement("ul");

createCompareItem.className = "createCompareItem";

document.addEventListener('DOMContentLoaded', () => {
    initBtnCompare();
});

document.addEventListener('zmz-shopify-compare:updated', (event) => {
    initBtnCompareList();
});


document.addEventListener('zmz-shopify-compare:init-buttons', (event) => {
    initBtnCompareList();
});


const setBtnCompare = (buttons) => {
    buttons.forEach((buttonCompare) => {
        const productHandle = buttonCompare.dataset.productHandle || false;
        if (!productHandle) return console.error('[Shopify Compare] Missing `data-product-handle` attribute. Failed to update the compare.');
        if (compareContains(productHandle)) buttonCompare.classList.add(BUTTON_COMPARE_ACTIVE_CLASS);
        buttonCompare.addEventListener('click', () => {
            const compare = getCompare();
            let compareLength = compare.length + 1;
            if (compareLength > COMPARE_MAX_ITEM) {
                updCompare(productHandle);
                buttonCompare.classList.remove(BUTTON_COMPARE_ACTIVE_CLASS);
            } else {
                updCompare(productHandle);
                buttonCompare.classList.toggle(BUTTON_COMPARE_ACTIVE_CLASS);
            }
        });
    });
};


const initBtnCompare = () => {
    const buttons = document.querySelectorAll(selectorsCompare.buttonCompare) || [];
    if (buttons.length) setBtnCompare(buttons);
    else return;
    const event = new CustomEvent('zmz-shopify-compare:init-buttons', {
        detail: { compare: getCompare() }
    });

    document.dispatchEvent(event);
};


const getCompare = () => {
    const compare = localStorage.getItem(LOCAL_STORAGE_COMPARE_KEY) || false;
    if (compare) return compare.split(LOCAL_STORAGE_COMPARE_SEPARATOR);
    return [];
};


const setCompare = (array) => {
    const compare = array.join(LOCAL_STORAGE_COMPARE_SEPARATOR);

    if (array.length) localStorage.setItem(LOCAL_STORAGE_COMPARE_KEY, compare);
    else localStorage.removeItem(LOCAL_STORAGE_COMPARE_KEY);

    const event = new CustomEvent('zmz-shopify-compare:updated', {
        detail: { compare: array }
    });

    document.dispatchEvent(event);
    return compare;
};


const updCompare = (handle) => {
    const compare = getCompare();
    const idxItemListCompare = compare.indexOf(handle);
    let compareLength = compare.length + 1;

    if (compareLength <= COMPARE_MAX_ITEM) {
        if (idxItemListCompare === -1) compare.push(handle);
        else compare.splice(idxItemListCompare, 1);
    }

    if (compareLength > COMPARE_MAX_ITEM) {
        if (idxItemListCompare !== -1) compare.splice(idxItemListCompare, 1);
    }

    if (compareLength > COMPARE_MAX_ITEM && idxItemListCompare === -1) $.fancybox.open({ content: `<div class="overInfo">${theme.strings.compareAlert}</div>` });

    compareCounter.innerHTML = compare.length;
    return setCompare(compare);
};


const compareContains = (handle) => {
    const compare = getCompare();
    return compare.includes(handle);
};


const resetCompare = () => {
    compareCounter.innerHTML = `0`;
    createCompareItem.innerHTML = '';
    getCompareListBtn.style.display = "none";
    const buttonsCompareArray = document.querySelectorAll(selectorsCompare.buttonCompare);
    if (buttonsCompareArray.length) {
        buttonsCompareArray.forEach((buttonCompare) => {
            buttonCompare.classList.remove(BUTTON_COMPARE_ACTIVE_CLASS);
        });
    }

    $(getCompareList).fadeOut("slow");
    return setCompare([]);
};

const initBtnCompareList = () => {
    const compare = getCompare();
    if (getCompareListBtn) {
        if (compare.length < 2) {
            getCompareListBtn.style.display = "none";
        } else if (compare.length >= 2) {
            getCompareListBtn.style.display = "flex";
        }
    };
    compareCounter.innerHTML = compare.length;
};

const removeProduct = (el) => {
    const compare = getCompare();
    let elHandle = el.getAttribute("data-rem-handle");

    let newCompare = compare.filter(function (value) {
        if (value !== elHandle) {
            return value;
        }
    });

    const compareNewLocalStorage = newCompare.join(LOCAL_STORAGE_COMPARE_SEPARATOR);
    if (newCompare.length) localStorage.setItem(LOCAL_STORAGE_COMPARE_KEY, compareNewLocalStorage);

    Array.from(document.querySelectorAll(`[data-rem-handle="${el.getAttribute("data-rem-handle")}"]`)).forEach(function (elem) {
        elem.remove();
    });

    const buttonsCompareArray = document.querySelectorAll(selectorsCompare.buttonCompare);

    if (buttonsCompareArray.length) {
        buttonsCompareArray.forEach((buttonCompare) => {
            const productHandle = buttonCompare.dataset.productHandle;
            if (elHandle === productHandle) {
                buttonCompare.classList.remove(BUTTON_COMPARE_ACTIVE_CLASS);
            }
        });
    }
};


const setRemoveCompareBtn = (removeButtons) => {
    removeButtons.forEach((removeButton) => {
        const remHandle = removeButton.dataset.remHandle || false;
        if (!remHandle) return;
        removeButton.addEventListener('click', () => {
            removeProduct(removeButton);
            initBtnCompareList();
        });
    });
};

const initRemoveBtn = () => {
    const removeButtons = document.querySelectorAll(selectorsCompare.removeItem) || [];
    if (removeButtons.length) setRemoveCompareBtn(removeButtons);
    else return;
};


if (getCompareListBtn) {
    getCompareListBtn.addEventListener('click', () => {
        getCompareWrapper.append(createCompareItem);

        createProduct();

        let request = new XMLHttpRequest();
        request.open("GET", "");
        request.onload = function () {
            SPR.registerCallbacks();
            SPR.initRatingHandler();
            SPR.initDomEls();
            SPR.loadProducts();
            SPR.loadBadges();
        };
        request.send();

        $(getCompareList).fadeIn("slow");
        getCompareList.style.display = "flex";
    });
}

function strip(html) {
    var tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText;
}

const createProduct = () => {

    createCompareItem.innerHTML = '';

    let products = getCompare();
    let urls = [];

    for (let i = 0; i < products.length; i++) {
        urls.push(`/collections/all/products/${products[i]}.js`);
    }

    $.fancybox.showLoading();

    Promise.all(urls.map(url => fetch(url))).then(responses => Promise.all(responses.map(res => res.json()))).then(productData => {

        $.fancybox.hideLoading();

        let productImage = '';
        let productAvailable = '';
        let productDescription = '';
        let productType = '';
        let productPrice = '';
        let productMoneyCurrency = '';
        let productOptionsSize = '';
        let productOptionsColor = '';
        let productOptionsType = '';
        let productOptionsVendor = '';
        let productOptionsRating = '';
        let productInfo = '';
        let productOptionBtn = '';
        let hideSizeElemByClass = '';
        let hideColorElemByClass = '';

        let productOptionsSizeArray = [];
        let productOptionsColorArray = [];
        let resultOpts = [];

        if (product.useCompareSize === false) {
            hideSizeElemByClass = 'd-none';
        }
        if (product.useCompareColor === false) {
            hideColorElemByClass = 'd-none';
        }

        if (typeof theme.moneyFormat != 'undefined') {
            productMoneyCurrency = theme.moneyFormat.split('{')[0];
        }

        function dayCount(elem) {
            let day = new Date(elem);
            day.setDate(day.getDate() + parseInt(product.newProductsPeriod));
            return day;
        }


        for (let i = 0; i < productData.length; i++) {
            var now = new Date();
            let newBadge = " ";
            if (now <= dayCount(productData[i].created_at)) {
                newBadge = `<span class="product_badge new">${theme.strings.compareNew}</span>`;
            }

            productOptionsSizeArray.push("-");
            productOptionsColorArray.push("-");


            if (productData[i].options) {

                let optsAll = productData[i].options;

                if (product.useCompareSize === true && product.textCompareSize != '') {
                    optsAll = optsAll.filter(obj => {
                        let nameObj = obj.name.toLowerCase();
                        return nameObj !== product.textCompareSize;
                    });
                }

                if (product.useCompareColor === true && product.textCompareColor != '') {
                    optsAll = optsAll.filter(obj => {
                        let nameObj = obj.name.toLowerCase();
                        return nameObj !== product.textCompareColor;
                    });
                }

                resultOpts = optsAll.map(opt => (opt.values == "Default Title") ?
                    '<p class="mt-0 mb-1">' + '-' + '</p>' :
                    '<p class="mt-0 mb-1"><span class="opt-name">' + opt.name + ':' + '</span>' + '&nbsp;' + opt.values.join(', ') + '</p>'
                ).join(" ");



                productData[i].options.forEach(function (item) {
                    let optionName = item['name'].toLowerCase(),
                        optionValue = item['values'],
                        value = "";


                    if (Array.isArray(optionValue)) {
                        value = optionValue.join(', ');
                    } else {
                        value = optionValue;
                    }

                    if (optionName === `${product.textCompareSize}`) {

                        if (value == '' || value == 'Default Title') {
                            productOptionsSizeArray.splice(i, 1, '-');
                        } else {
                            productOptionsSizeArray.splice(i, 1, value);
                        }

                    } else if (optionName === `${product.textCompareColor}`) {
                        if (value == '' || value == 'Default Title') {
                            productOptionsColorArray.splice(i, 1, '-');
                        } else {
                            productOptionsColorArray.splice(i, 1, value);
                        }
                    }
                });
            }

            if (resultOpts.length) {
                productOptionsType += ` 
                            <div class="productContent" data-rem-handle="${productData[i].handle}">
                                <div class="itemOption_1">${resultOpts}</div>
                            </div>
                    `;
            } else {
                productOptionsType += `
                            <div class="productContent" data-rem-handle="${productData[i].handle}">
                                <div class="itemOption_1">-</div>
                            </div>
                        `;
            }

            if (productOptionsSizeArray.length && product.useCompareSize === true) {

                productOptionsSize += `
                        <div class="productContent" data-rem-handle="${productData[i].handle}">
                            <div class="itemOption_1">${productOptionsSizeArray[i]}</div>
                        </div>`;
            }
            if (productOptionsColorArray.length && product.useCompareColor === true) {
                productOptionsColor += `
                        <div class="productContent" data-rem-handle="${productData[i].handle}">
                            <div class="itemOption_1">${productOptionsColorArray[i]}</div>
                        </div> `;
            }

            let saleBadge = "";
            if (productData[i].price_varies) {
                saleBadge = `<span class="product_badge sale">${theme.strings.compareSale}</span>`;
                productPrice = `<span class="product-price product-sale-price ">${productMoneyCurrency}${(productData[i].price_min / 100).toFixed(2)}</span> <span class="product-regular-price">${productMoneyCurrency}${(productData[i].compare_at_price / 100).toFixed(2)}</span>`;
            } else {
                productPrice = `<span class="product-price">${productMoneyCurrency}${(productData[i].price / 100).toFixed(2)}</span>`;
            }


            productImage += `
                        <div class="productContent" data-rem-handle="${productData[i].handle}">
                        <div class="compareRemoveItem" remove-item data-rem-handle="${productData[i].handle}">${theme.strings.compareRemove}</div>
                            ${saleBadge}
                            ${newBadge}
                        <img loading="lazy"  class="productImage" src="${productData[i].featured_image}" srcset="${productData[i].featured_image}" alt="${productData[i].title}">

                        </div>

                    `;

            productInfo += `<div class="productContent" data-rem-handle="${productData[i].handle}">
                        <a href="${productData[i].url}"><h5 class="compareProductTitle">${productData[i].title}</h5></a>
                    </div>
                    `;


            let availableItem = '';
            if (productData[i].available === true) {
                availableItem = `<i style="color: #44bb9e;" class="fa fa-check" aria-hidden="true"></i>`;
            } else {
                availableItem = `<i class="fa fa-times" aria-hidden="true"></i>`;
            }


            productAvailable += `
                        <div class="productContent" data-rem-handle="${productData[i].handle}">
                                <span class="description">${availableItem}</span>
                        </div>

                    `;

            productDescription += `
                        <div class="productContent" data-rem-handle="${productData[i].handle}">
                        <div class="description">${strip(productData[i].description)}</div>
                        </div>

                    `;

            productType += `
                        <div class="productContent" data-rem-handle="${productData[i].handle}">
                            <div class="description"><a href="/collections/types?q=${productData[i].type}"> ${productData[i].type}</a></div>
                        </div>

                    `;

            productOptionsVendor += `
                        <div class="productContent" data-rem-handle="${productData[i].handle}">
                        <div class="description"><a href="/collections/vendors?q=${productData[i].vendor}"> ${productData[i].vendor}</a></div>
                        </div>

                    `;

            productOptionsRating += `
                    <div class="productContent" data-rem-handle="${productData[i].handle}">
                    <div class="description">
                        <span class="shopify-product-reviews-badge" data-id="${productData[i].id}"></span>
                    </div>
                    </div>

                    `;

            productOptionBtn += `
                    <div class="productContent" data-rem-handle="${productData[i].handle}">
                        <h4>${productPrice}</h4>
                        <a class="btn btn-sm btn-primary compareBtn" href="${productData[i].url}">More details</a>
                     </div>
                    `;

        }


        createCompareItem.innerHTML +=
            `<div class="itemWrapper">
                        <li class="row">
                                <span class="compare_item_option col-4">${theme.strings.compareImg}</span>
                                <div class="infoWrapper px-0 col-8">
                                    <div class="itemImgWrap">
                                    ${productImage}
                                    </div>
                                </div>
                            </li>

                            <li class="row compare__row__title">
                            <span class="compare_item_option col-4">${theme.strings.compareTitle}</span>
                            <div class="infoWrapper px-0 col-8">
                                <div class="itemImgWrap">
                                ${productInfo}
                                </div>
                            </div>
                        </li>

                        <li class="row">
                            <span class="compare_item_option col-4">${theme.strings.compareDetails}</span>
                            <div class="infoWrapper px-0 col-8">
                                <div class="itemImgWrap">
                                ${productOptionBtn}
                                </div>
                            </div>
                        </li>


                        <li class="row" id="compare__rating">
                            <span class="compare_item_option col-4">${theme.strings.compareRating}</span>
                            <div class="infoWrapper px-0 col-8">
                                <div class="itemImgWrap">
                                    ${productOptionsRating}
                                </div>

                            </div>
                        </li>


                        <li class="row">
                            <span class="compare_item_option col-4">${theme.strings.compareAvailable}</span>
                            <div class="infoWrapper px-0 col-8">
                                <div class="itemImgWrap">
                                ${productAvailable}
                                </div>
                            </div>
                        </li>

                        <li class="row">
                            <span class="compare_item_option col-4">${theme.strings.compareVendor}</span>
                            <div class="infoWrapper px-0 col-8">
                                <div class="itemImgWrap">
                                    ${productOptionsVendor}
                                </div>
                            </div>
                        </li>

                        <li class="row">
                            <span class="compare_item_option col-4">${theme.strings.compareType}</span>
                            <div class="infoWrapper px-0 col-8">
                                <div class="itemImgWrap">
                                    ${productType}
                                </div>
                            </div>
                        </li>

                        <li class="row">
                            <span class="compare_item_option col-4">${theme.strings.compareDescription}</span>
                            <div class="infoWrapper px-0 col-8">
                                <div class="itemImgWrap">
                                    ${productDescription}
                                </div>
                            </div>
                        </li>

                        <li class="row ${hideSizeElemByClass}">
                            <span class="compare_item_option col-4">${product.textCompareSize}</span>
                            <div class="infoWrapper px-0 col-8">
                                <div class="itemImgWrap">
                                    ${productOptionsSize} 
                                </div>
                            </div>
                        </li>


                        <li class="row ${hideColorElemByClass}">
                            <span class="compare_item_option col-4">${product.textCompareColor}</span>
                            <div class="infoWrapper px-0 col-8">
                                <div class="itemImgWrap">
                                    ${productOptionsColor}
                                </div>
                            </div>
                        </li>

                        <li class="row">
                            <span class="compare_item_option col-4">${theme.strings.compareOptions}</span>
                            <div class="infoWrapper px-0 col-8">
                                <div class="itemImgWrap">
                                    ${productOptionsType}
                                </div>
                            </div> 
                        </li>
                </div>`;
        initRemoveBtn();
    });

}

let getCompareClose = document.getElementById("compareClose");
getCompareClose.addEventListener('click', () => {
    if (getCompareList) {
        $(getCompareList).fadeOut("slow");
    }
});


let compareClearAllBtn = document.getElementById("compareClearAll");
compareClearAllBtn.addEventListener('click', () => {
    resetCompare();
});