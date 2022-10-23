function getFocusableElements(container) {
    return Array.from(
        container.querySelectorAll(
            "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
        )
    );
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
    summary.setAttribute('role', 'button');
    summary.setAttribute('aria-expanded', 'false');

    if (summary.nextElementSibling.getAttribute('id')) {
        summary.setAttribute('aria-controls', summary.nextElementSibling.id);
    }

    summary.addEventListener('click', (event) => {
        event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    summary.parentElement.addEventListener('keyup', onKeyUpEscape);
});


const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
    var elements = getFocusableElements(container);
    var first = elements[0];
    var last = elements[elements.length - 1];

    removeTrapFocus();

    trapFocusHandlers.focusin = (event) => {
        if (
            event.target !== container &&
            event.target !== last &&
            event.target !== first
        )
            return;

        document.addEventListener('keydown', trapFocusHandlers.keydown);
    };

    trapFocusHandlers.focusout = function () {
        document.removeEventListener('keydown', trapFocusHandlers.keydown);
    };

    trapFocusHandlers.keydown = function (event) {
        if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
        // On the last focusable element and tab forward, focus the first element.
        if (event.target === last && !event.shiftKey) {
            event.preventDefault();
            first.focus();
        }

        //  On the first focusable element and tab backward, focus the last element.
        if (
            (event.target === container || event.target === first) &&
            event.shiftKey
        ) {
            event.preventDefault();
            last.focus();
        }
    };

    document.addEventListener('focusout', trapFocusHandlers.focusout);
    document.addEventListener('focusin', trapFocusHandlers.focusin);

    elementToFocus.focus();
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
    document.querySelector(":focus-visible");
} catch {
    focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
    const navKeys = ['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'TAB', 'ENTER', 'SPACE', 'ESCAPE', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN']
    let currentFocusedElement = null;
    let mouseClick = null;

    window.addEventListener('keydown', (event) => {
        if (navKeys.includes(event.code.toUpperCase())) {
            mouseClick = false;
        }
    });

    window.addEventListener('mousedown', (event) => {
        mouseClick = true;
    });

    window.addEventListener('focus', () => {
        if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

        if (mouseClick) return;

        currentFocusedElement = document.activeElement;
        currentFocusedElement.classList.add('focused');

    }, true);
}

function removeTrapFocus(elementToFocus = null) {
    document.removeEventListener('focusin', trapFocusHandlers.focusin);
    document.removeEventListener('focusout', trapFocusHandlers.focusout);
    document.removeEventListener('keydown', trapFocusHandlers.keydown);

    if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
    if (event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if (!openDetailsElement) return;

    const summaryElement = openDetailsElement.querySelector('summary');
    openDetailsElement.removeAttribute('open');
    summaryElement.setAttribute('aria-expanded', false);
    summaryElement.focus();
}



if ((typeof window.Shopify) == 'undefined') {
    window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
    return function () {
        return fn.apply(scope, arguments);
    }
};


Shopify.setSelectorByValue = function (selector, value) {
    for (var i = 0, count = selector.options.length; i < count; i++) {
        var option = selector.options[i];
        if (value == option.value || value == option.innerHTML) {
            selector.selectedIndex = i;
            return i;
        }
    }
};

Shopify.addListener = function (target, eventName, callback) {
    target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on' + eventName, callback);
};

Shopify.postLink = function (path, options) {
    options = options || {};
    var method = options['method'] || 'post';
    var params = options['parameters'] || {};

    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for (var key in params) {
        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", key);
        hiddenField.setAttribute("value", params[key]);
        form.appendChild(hiddenField);
    }
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};


class MenuDrawer extends HTMLElement {
    constructor() {
        super();

        this.mainDetailsToggle = this.querySelector('details');
        const summaryElements = this.querySelectorAll('summary');
        this.addAccessibilityAttributes(summaryElements);

        if (navigator.platform === 'iPhone') document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);

        this.addEventListener('keyup', this.onKeyUp.bind(this));
        this.addEventListener('focusout', this.onFocusOut.bind(this));
        this.bindEvents();
    }

    bindEvents() {
        this.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
        this.querySelectorAll('button').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
    }

    addAccessibilityAttributes(summaryElements) {
        summaryElements.forEach(element => {
            element.setAttribute('role', 'button');
            element.setAttribute('aria-expanded', false);
            element.setAttribute('aria-controls', element.nextElementSibling.id);
        });
    }

    onKeyUp(event) {
        if (event.code.toUpperCase() !== 'ESCAPE') return;

        const openDetailsElement = event.target.closest('details[open]');
        if (!openDetailsElement) return;

        openDetailsElement === this.mainDetailsToggle ? this.closeMenuDrawer(this.mainDetailsToggle.querySelector('summary')) : this.closeSubmenu(openDetailsElement);
    }

    onSummaryClick(event) {
        const summaryElement = event.currentTarget;
        const detailsElement = summaryElement.parentNode;
        const isOpen = detailsElement.hasAttribute('open');

        if (detailsElement === this.mainDetailsToggle) {
            if (isOpen) event.preventDefault();
            isOpen ? this.closeMenuDrawer(summaryElement) : this.openMenuDrawer(summaryElement);
        } else {
            trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));

            setTimeout(() => {
                detailsElement.classList.add('menu-opening');
            });
        }
    }

    openMenuDrawer(summaryElement) {
        setTimeout(() => {
            this.mainDetailsToggle.classList.add('menu-opening');
        });
        summaryElement.setAttribute('aria-expanded', true);
        trapFocus(this.mainDetailsToggle, summaryElement);
        document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
    }

    closeMenuDrawer(event, elementToFocus = false) {
        if (event !== undefined) {
            this.mainDetailsToggle.classList.remove('menu-opening');
            this.mainDetailsToggle.querySelectorAll('details').forEach(details => {
                details.removeAttribute('open');
                details.classList.remove('menu-opening');
            });
            this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
            document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
            removeTrapFocus(elementToFocus);
            this.closeAnimation(this.mainDetailsToggle);
        }
    }

    onFocusOut(event) {
        setTimeout(() => {
            if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement)) this.closeMenuDrawer();
        });
    }

    onCloseButtonClick(event) {
        const detailsElement = event.currentTarget.closest('details');
        this.closeSubmenu(detailsElement);
    }

    closeSubmenu(detailsElement) {
        detailsElement.classList.remove('menu-opening');
        removeTrapFocus();
        this.closeAnimation(detailsElement);
    }

    closeAnimation(detailsElement) {
        let animationStart;

        const handleAnimation = (time) => {
            if (animationStart === undefined) {
                animationStart = time;
            }

            const elapsedTime = time - animationStart;

            if (elapsedTime < 400) {
                window.requestAnimationFrame(handleAnimation);
            } else {
                detailsElement.removeAttribute('open');
                if (detailsElement.closest('details[open]')) {
                    trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
                }
            }
        }

        window.requestAnimationFrame(handleAnimation);
    }
}
customElements.define('menu-drawer', MenuDrawer);


(function ($) {
    var doc = $(document),
        _docBody = $(document.body),
        body = $('body');

    // Product quick view
    _docBody.on('click', '.js_quick_view', function (e) {
        e.preventDefault();
        _docBody.append(qvModal);

        // Showing fancybox loading animation
        $.fancybox.showLoading();
        $.fancybox.helpers.overlay.open({parent: body});

        // Getting product info (Json)
        $.getJSON($(this).attr('href').split('?')[0] + '.js', function (product) {

            // PRODUCT TITLE
            var productTitle = product.title;
            var productAvailable = product.available;

            $('#quick_view__name').html('<span>' + productTitle + '</span>');

            $('#quick_view__availability').html('<span>' + productAvailable + '</span>');


            // PRODUCT VARIANTS
            $.each(product.variants, function (i, variant) {
                $('#product-select').append('<option value="' + variant.id + '">' + variant.title + ' - ' + variant.price + '</option>')
            });

            // PRODUCT ALL INFO LINK
            $('#product_info_link a').attr('href', product.url);

            // QUANTITY FORM MINI
            $("#quantity").on("focusout", function () {
                var t = $(this).val();
                $(this).val(isNaN(parseFloat(t)) && !isFinite(t) || 0 == parseInt(t) || "" == t ? 1 : parseInt(t) < 0 ? parseInt(t) - 2 * parseInt(t) : parseInt(t))
            }), $("#quantity_up").on("click", function () {
                var t = $("#quantity").val();
                $("#quantity").val(!isNaN(parseFloat(t)) && isFinite(t) ? parseInt(t) + 1 : 1)
            }), $("#quantity_down").on("click", function () {
                var t = $("#quantity").val();
                $("#quantity").val(!isNaN(parseFloat(t)) && isFinite(t) && t > 1 ? parseInt(t) - 1 : 1)
            });

            // UPLOADING option_selection.js TO MANAGE PRODUCT VARIANTS
            $.getScript("//cdn.shopify.com/shopifycloud/shopify/assets/themes_support/option_selection-9f517843f664ad329c689020fb1e45d03cac979f64b9eb1651ea32858b0ff452.js", function () {


                // IMAGES PRELOADER (INIT)
                preloadImages(product.images, function () {

                    // APPENDING ALL IMAGES TO GALLERY

                    $.each(product.images, function (i, src) {
                        var bigSrc = src.replace('.png', '_410x520_crop_center.png').replace('.jpg', '_410x520_crop_center.jpg');
                        $('#img_big .swiper-wrapper').append('<div class="swiper-slide"><img loading="lazy" class="w-100 lazyload" src="' + bigSrc + '"  data-src="' + bigSrc + '" alt="'+ productTitle +'" /></div>');
                    });

                    // VARIANT CHANGE FUNCTION
                    var selectCallback = function (variant, selector) {
                        if (variant && variant.available) {
                            jQuery('#quick_view__add').removeAttr('disabled').removeClass('disabled');
                            // VARIANT PRICES
                            if (variant.price < variant.compare_at_price) {
                                jQuery('#quick_view__price').html('<span class="product-price with-discount item_price">' + Shopify.formatMoney(variant.price, theme.moneyFormat) + '</span><span class="compare-at-price product-regular-price">' + Shopify.formatMoney(variant.compare_at_price, theme.moneyFormat) + '</span><span class="product-sale-price">Save ' + parseInt(100 - (variant.price * 100) / variant.compare_at_price) + '% OFF</span>');
                            } else {
                                jQuery('#quick_view__price').html('<span class="product-price item_price">' + Shopify.formatMoney(variant.price, theme.moneyFormat) + '</span>');
                            }

                            // PRODUCT QUANTITY
                            if (variant.inventory_management != null) {
                                jQuery('#quick_view__availability span').removeClass('out_stock').addClass('in_stock').html(productText.available);
                            } else {
                                jQuery('#quick_view__availability span').removeClass('out_stock').addClass('in_stock').html(productText.available);
                            }
                        } else {
                            jQuery('#quick_view__add').addClass('disabled').attr('disabled', 'disabled'); // set add-to-cart button to unavailable class and disable button
                            jQuery('#quick_view__availability span').removeClass('in_stock').addClass('out_stock').html(productText.unavailable);
                            jQuery('#quick_view__price').html('<span class="product-price">' + Shopify.formatMoney(product.price, theme.moneyFormat) + '</span>');
                        }

                        // COLOR & SIZE OPTIONS
                        for (var i = 0; i < selector.product.options.length; i++) {
                            if (selector.product.options[i].name.toLowerCase() == 'color') {
                                var selectorNum = i;
                                var selectorName = selector.product.options[i].name;

                                renderColorOptions(selectorNum, selectorName); 
                            }
                            if (selector.product.options[i].name.toLowerCase() == 'size') {
                                var selectorNum = i;
                                var selectorName = selector.product.options[i].name;

                                renderSizeOptions(selectorNum, selectorName);
                            }
                        }

                        // CHANGING VARIANT IMAGE
                        if (variant && variant.featured_image) {
                            var originalImage = $("#img_big img");
                            var newImage = variant.featured_image;
                            var element = originalImage[0];

                            Shopify.Image.switchImage(newImage, element, function (newImageSizedSrc, newImage, element) {

                                quickViewGallery.slides.each(function (i) {
                                    var thumb = $(this).find('img').attr('src').replace('_crop_top', '').replace('_crop_center', '').replace('_crop_bottom', '').replace(/\?v=.*/, '');
                                    var newImg = newImageSizedSrc.replace(/\?v=.*/, '');
                                    if (thumb == newImg) {
                                        quickViewGallery.slideTo(i);
                                    }
                                });
                            });
                        }
                    };


                    // ADDING THUMBS SLIDER

                    var quickViewGallery = new Swiper('#img_big', {
                        effect: 'fade',
                        spaceBetween: 0,
                        updateOnImagesReady: true,
                        observer: true,
                        observeParents: true,
                        navigation: {
                            nextEl: $('#next_quick_view_gallery'),
                            prevEl: $('#prev_quick_view_gallery')
                        },
                        pagination: {
                            el: $('#quick_view_gallery_pagination'),
                            clickable: true
                        }
                    });

                    // VARIANT CHANGE FUNCTION (INIT)
                    new Shopify.OptionSelectors("product-select", {
                        product: product,
                        onVariantSelected: selectCallback,
                        enableHistoryState: false
                    });

                    // HIDING DEFAULT VARIANT SELECTOR
                    $.each($('#quick_view__variants select option'), function () {
                        if ($(this).val() == 'Default Title') {
                            $('#quick_view__variants').hide();
                        }
                    });

                });

                // IMAGES PRELOADER (FUNCTION)
                function preloadImages(images, callback) {
                    var images = new Array();
                    var countImages = images.length;
                    if (countImages === 0) {
                        callback();
                    }
                    var loaded = 0;
                    $(images).each(function () {
                        $('<img>').attr('src', this).load(function () {
                            loaded++;
                            if (loaded === countImages) {
                                callback();
                            }
                        });
                    });
                }


                // SHOWING QUICK VIEW MODAL

                $.fancybox($('#product_quick_view'), {
                    'openSpeed': 1000,
                    'closeSpeed': 300,
                    'fitToView': true,
                    'maxWidth': 978,
                    'autoSize': false,
                    'autoDimensions': true,
                    'openEffect': 'fade',
                    'tpl': {
                        wrap: '<div id="quick_view__wrap" class="fancybox-wrap" tabIndex="-1"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div>',
                        closeBtn: '<a title="Close" id="quick_view__close" class="fancybox-item fancybox-close" href="javascript:;"></a>',
                    },
                    'afterClose': function () {
                        $('#product_quick_view').remove(); // REMOVING QUICK VIEW MODAL AFTER CLOSE
                    }
                });

            });

            // RENDER COLOR OPTION
            function renderColorOptions(num, name) {
                var colorSelect = $('#product_quick_view .single-option-selector').eq(num);
                var selectId = '#' + colorSelect.attr('id');
                var container = $('#product_quick_view #quick_view_colors');
                var content = '<label>' + name + ': </label>';

                colorSelect.parent('.selector-wrapper').addClass('hidden');
                if ($('#product_quick_view .single-option-selector').length == 1) {
                    $('#quick_view__variants label').hide();
                }


                $('#product_quick_view ' + selectId + ' option').each(function () {
                    var value = $(this).val();
                    if (colorSelect.val() == value) {
                        return content = content + '<div class="color_item current" data-val="' + value + '" title="' + value + '"><span class="color_inner" style="background-color: ' + value + '"></span></div>';
                    } else {
                        return content = content + '<div class="color_item" data-val="' + value + '" title="' + value + '"><span class="color_inner" style="background-color: ' + value + '"></span></div>';
                    }
                });

                container.html(content);
                $('#product_quick_view .color_item').on('click', function (e) {
                    colorSelect.val($(this).data('val')).trigger('change');
                });
            }

            // RENDER SIZE OPTION
            function renderSizeOptions(num, name) {
                var sizeSelect = $('#product_quick_view .single-option-selector').eq(num);
                var selectId = '#' + sizeSelect.attr('id');
                var container = $('#product_quick_view #quick_view_size');
                var content = '<label>' + name + ': </label>';
                sizeSelect.parent('.selector-wrapper').addClass('hidden');
                if ($('#product_quick_view .single-option-selector').length == 1) {
                    $('#quick_view__variants label').hide();
                }
                $('#product_quick_view ' + selectId + ' option').each(function () {
                    var value = $(this).val();
                    if (sizeSelect.val() == value) {
                        return content = content + '<div class="size_item current" data-val="' + value + '"><span class="size_inner">' + value + '</span></div>';
                    } else {
                        return content = content + '<div class="size_item" data-val="' + value + '"><span class="size_inner">' + value + '</span></div>';
                    }
                });
                container.html(content);
                $('#product_quick_view .size_item').on('click', function (e) {
                    sizeSelect.val($(this).data('val')).trigger('change');
                });
            }

            // CLOSING QUICK VIEW MODAL AFTER ADDING TO CART
            $('#quick_view__add').on('click', function () {
                $.fancybox.close();
            });
        });
    });

    // AJAX CART
    function ajaxCartRender() {
        $('.cart_content_preloader').removeClass('off');
        jQuery.getJSON('/cart.js', function (data) {
            var newHtml = '';

            if (data.items.length == 0) {
                newHtml += '<p class="empty_alert text-center mb-0"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 8V6C7 4.67392 7.52678 3.40215 8.46447 2.46447C9.40215 1.52678 10.6739 1 12 1C13.3261 1 14.5979 1.52678 15.5355 2.46447C16.4732 3.40215 17 4.67392 17 6V8H20C20.2652 8 20.5196 8.10536 20.7071 8.29289C20.8946 8.48043 21 8.73478 21 9V21C21 21.2652 20.8946 21.5196 20.7071 21.7071C20.5196 21.8946 20.2652 22 20 22H4C3.73478 22 3.48043 21.8946 3.29289 21.7071C3.10536 21.5196 3 21.2652 3 21V9C3 8.73478 3.10536 8.48043 3.29289 8.29289C3.48043 8.10536 3.73478 8 4 8H7ZM7 10H5V20H19V10H17V12H15V10H9V12H7V10ZM9 8H15V6C15 5.20435 14.6839 4.44129 14.1213 3.87868C13.5587 3.31607 12.7956 3 12 3C11.2044 3 10.4413 3.31607 9.87868 3.87868C9.31607 4.44129 9 5.20435 9 6V8Z" /></svg><span class="mt-2">' + theme.cartAjaxTextEmpty + '</span></p>';
            } else {
                data.items.forEach(function (item, i) {
                    var image_url = item.image.replace('.png', '_130x130_crop_center.png').replace('.jpg', '_100x100_crop_center.jpg');
                    newHtml += '<ul class="cart_list_items"><li class="cart_items"><img class="product-thumbnail item_img img-fluid" src="' + image_url + '"  alt="' + item.title + '" /><div class="item_desc"><a class="product_title" href="' + item.url + '">' + item.title.slice(0, 50) + '</a><div class="product-price product-price-sm mt-2"><span class="product_quantity">' + item.quantity + ' X </span><span class="product-price">' + Shopify.formatMoney(item.price, theme.moneyFormat) + '</span></div><a class="item_remove_btn" href="#" data-id="' + item.id + '"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M17 6H22V8H20V21C20 21.2652 19.8946 21.5196 19.7071 21.7071C19.5196 21.8946 19.2652 22 19 22H5C4.73478 22 4.48043 21.8946 4.29289 21.7071C4.10536 21.5196 4 21.2652 4 21V8H2V6H7V3C7 2.73478 7.10536 2.48043 7.29289 2.29289C7.48043 2.10536 7.73478 2 8 2H16C16.2652 2 16.5196 2.10536 16.7071 2.29289C16.8946 2.48043 17 2.73478 17 3V6ZM18 8H6V20H18V8ZM9 4V6H15V4H9Z" fill="#121212"/></svg></a></div></li></ul>';
                });
                newHtml += '<div class="box_footer"><div class="cart_total mt-md-2"><span class="label mr-1">' + theme.cartAjaxTextTotalPrice + ': </span><span class="product-price value">' + Shopify.formatMoney(data.total_price, theme.moneyFormat) + '</span></div><a  class="cart_clear clear_cart_all_items-js link d-block mt-2" href="/cart/clear"> <span>' + theme.cartAjaxTextClearCart + '</span> </a><div class="btn-group mt-3"><a class="btn btn-primary btn-block w-100" href="/cart">' + theme.cartAjaxTextGoCart + '</a><a class="btn btn-secondary btn-block w-100 mt-2" href="/checkout">' + theme.cartAjaxTextGoCheckout + '</a></div></div>';
            }

            $('.cart_content_box').html(newHtml);
            $('.header_cart #cart_items, .header_cart #cart_item_mobile').html(data.item_count);
            removeItemFromCart();
            clearAllItemsFromCart();
            $('.cart_content_preloader').addClass('off');
        });
    }

    // REMOVE AJAX CART ITEMS
    function removeItemFromCart() {
        $('.header_cart .item_remove_btn').on('click', function (e) {
            e.preventDefault();
            var itemId = $(this).attr('data-id');
            var postData = "updates[" + itemId + "]=0";
            jQuery.post('/cart/update.js', postData, function () {
                ajaxCartRender();
            }, "json");
        });
    }

    removeItemFromCart();

    // CLEAR AJAX CART
    function clearAllItemsFromCart() {
        $('.cart_content_box .clear_cart_all_items-js').on('click', function (e) {
            e.preventDefault();
            jQuery.post('/cart/clear.js', function () {
                ajaxCartRender();
            }, "json");
        });
    }

    clearAllItemsFromCart();

    // JQUERY.AJAX-CART.JS MINI
    doc.ready(function (t) {
        var e = {TOTAL_ITEMS: ".cart-total-items", TOTAL_PRICE: ".cart-total-price", SUBMIT_ADD_TO_CART: "input[type=image], input.submit-add-to-cart", FORM_UPDATE_CART: "form[name=cartform]", FORM_UPDATE_CART_BUTTON: "form[name=cartform] input[name=update]", FORM_UPDATE_CART_BUTTONS: "input[type=image], input.button-update-cart", LINE_ITEM_ROW: ".cart-line-item", LINE_ITEM_QUANTITY_PREFIX: "input#updates_", LINE_ITEM_PRICE_PREFIX: ".cart-line-item-price-", LINE_ITEM_REMOVE: ".remove a", EMPTY_CART_MESSAGE: "#empty"}, a = function (t) {
            return Shopify.formatMoney(t, "${{ amount }}")
        };
        t(document).on("submit", 'form[action*="/cart/add"]', function (e) {
            e.preventDefault(), t(e.target).find(".btn-cart").attr("disabled", !0).addClass("disabled"), Shopify.addItemFromForm(e.target)
        }), t(document).on("click", ".btn-cart", function () {
            t.fancybox.showLoading(), t.fancybox.helpers.overlay.open({parent: t("body")})
        }), t(e.FORM_UPDATE_CART_BUTTON).click(function (a) {
            a.preventDefault(), t(a.target.form).find(e.FORM_UPDATE_CART_BUTTONS).attr("disabled", !0).addClass("disabled"), Shopify.updateCartFromForm(a.target.form)
        }), t(e.FORM_UPDATE_CART).delegate(e.LINE_ITEM_REMOVE, "click", function (a) {
            a.preventDefault();
            var i = this.href.split("/").pop().split("?").shift();
            Shopify.removeItem(i), t(this).parents(e.LINE_ITEM_ROW).remove()
        }), Shopify.onItemAdded = function (e, a) {
            t(a).find(".btn-cart").attr("disabled", !1).removeClass("disabled"), Shopify.getCart()
        }, Shopify.onCartUpdate = function (i, n) {
            t("#cart_items").html(i.item_count);
            if (theme.cartAjaxOn) {
                ajaxCartRender();
            }
            var r = a(i.total_price);
            t(e.TOTAL_PRICE).html(r), t(e.EMPTY_CART_MESSAGE).length > 0 && 0 == i.item_count && (t(e.FORM_UPDATE_CART).hide(), t(e.EMPTY_CART_MESSAGE).show()), n = n || !1, n && i.item_count > 0 && (t.each(i.items, function (i, n) {
                t(e.LINE_ITEM_PRICE_PREFIX + n.id).html(a(n.line_price)), t(e.LINE_ITEM_QUANTITY_PREFIX + n.id).val(n.quantity)
            }), t(n).find("input[value=0]").parents(e.LINE_ITEM_ROW).remove(), t(n).find(e.FORM_UPDATE_CART_BUTTONS).attr("disabled", !1).removeClass("disabled"))
        }, Shopify.onError = function () {
            t("form").find(".btn-cart").attr("disabled", !1).removeClass("disabled")
        }
        
        
    });

    // JQUERY.API.JS FULL
    function floatToString(t, o) {
        var r = t.toFixed(o).toString();
        return r.match(/^\.\d+/) ? "0" + r : r
    }

    function attributeToString(t) {
        return "string" != typeof t && (t += "", "undefined" === t && (t = "")),
            jQuery.trim(t)
    }

    "undefined" == typeof Shopify && (Shopify = {}),
        Shopify.money_format = "$ {{amount}}",
        Shopify.onError = function (XMLHttpRequest, textStatus) {
            var data = eval("(" + XMLHttpRequest.responseText + ")");
            alert(data.message + "(" + data.status + "): " + data.description)
        },
        Shopify.onCartUpdate = function (t) {
            alert("There are now " + t.item_count + " items in the cart.")
        },
        Shopify.onItemAdded = function (t) {
            alert(t.title + " was added to your shopping cart.")
        },
        Shopify.onProduct = function (t) {
            alert("Received everything we ever wanted to know about " + t.title)
        },
        Shopify.formatMoney = function (t, o) {
            var r = "",
                e = /\{\{\s*(\w+)\s*\}\}/,
                a = o || this.money_format;
            switch (a.match(e)[1]) {
                case "amount":
                    r = floatToString(t / 100, 2).replace(/(\d+)(\d{3}[\.,]?)/, "$1 $2");
                    break;
                case "amount_no_decimals":
                    r = floatToString(t / 100, 0).replace(/(\d+)(\d{3}[\.,]?)/, "$1 $2");
                    break;
                case "amount_with_comma_separator":
                    r = floatToString(t / 100, 2).replace(/\./, ",").replace(/(\d+)(\d{3}[\.,]?)/, "$1.$2")
            }
            return a.replace(e, r);
        },
        Shopify.resizeImage = function (t, o) {
            try {
                if ("original" == o) return t;
                var r = t.match(/(.*\/[\w\-\_\.]+)\.(\w{2,4})/);
                return r[1] + "_" + o + "." + r[2];
            } catch (e) {
                return t;
            }
        },
        Shopify.addItem = function (t, o, r) {
            o = o || 1;
            var e = {
                type: "POST",
                url: "/cart/add.js",
                data: "quantity=" + o + "&id=" + t,
                dataType: "json",
                success: function (t) {
                    "function" == typeof r ? r(t) : Shopify.onItemAdded(t)
                },
                error: function (t, o) {
                    Shopify.onError(t, o)
                }
            };
            jQuery.ajax(e)
        },
        Shopify.addItemFromForm = function (t, o) {

            var r = {
                type: "POST",
                url: "/cart/add.js",
                data: jQuery(t).serialize(),
                dataType: "json",
                success: function (r) {

                    "function" == typeof o ? o(r, t) : Shopify.onItemAdded(r, t);

                    _docBody.append(cartModal);
                    // Showing fancybox loading animation
                    $.fancybox.showLoading();
                    $.fancybox.helpers.overlay.open({parent: body});

                    body.on('touchmove', function (e) {
                        if ($('.fancybox-overlay').length) {
                            e.preventDefault();
                        }
                    });

                    if (r.title.length < 60) {
                        var productTitle = r.title;
                    } else {
                        var productTitle = $.trim(r.title).substring(0, 60) + '...';
                    }

                    $('#cart_added__name').html(productTitle);
                    $('#cart_added__price .value').html(Shopify.formatMoney(r.price, theme.moneyFormat));
                    $('#cart_added__total_quantity .value').html(r.quantity);
                    $('#cart_added__quantity .value').html(r.quantity);
                    $('#cart_added__total_price .value').html(Shopify.formatMoney(r.final_line_price, theme.moneyFormat));
                    $('#cart_added__close').on('click', function (e) {
                        e.preventDefault();
                        $('.fancybox-close').trigger('click');
                    });

                    if (r.image) {
                        var cartAddImg = r.image.replace('.jpg', '_130x160_crop_center.jpg').replace('.png', '_130x160_crop_center.png');
                        $('#cart_added__img').append('<img loading="lazy" class="product-thumbnail item_img img-fluid lazyload" src="' + cartAddImg + '" data-src="' + cartAddImg + '" alt="'+ productTitle +'" />');
                        setTimeout(function () {
                            $.fancybox.open($('#cart_added'), {
                                    'openSpeed': 600,
                                    'closeSpeed': 300,
                                    'width': 424,
                                    'height': 423,
                                    'autoSize': false,
                                    'afterClose': function () {
                                        $('#cart_added').remove();
                                    }
                                }
                            );
                        }, 300);

                    } else {
                        $('#cart_added__img').hide();
                        $.fancybox.open($('#cart_added'),
                            {
                                'openSpeed': 500,
                                'closeSpeed': 300,
                                'afterClose': function () {
                                    $('#cart_added').remove();
                                }
                            }
                        );
                    }

                },
                error: function (t, o) {
                    Shopify.onError(t, o);

                    var errorData = eval('(' + t.responseText + ')');

                    body.append('<div id="cart_added" class="cart_error"><div class="h4"></div><p class="alert alert-error"></p></div>');
                    $('#cart_added h4').html(errorData.message);
                    $('#cart_added p').html(errorData.description);

                    $.fancybox.open($('#cart_added'),
                        {
                            'openSpeed': 500,
                            'closeSpeed': 300,
                            'topRatio': 0.5,
                            'afterClose': function () {
                                $('#cart_added').remove();
                            }
                        }
                    );
                }
            };
            jQuery.ajax(r)
        },
        Shopify.getCart = function (t) {
            jQuery.getJSON("/cart.js", function (o) {
                "function" == typeof t ? t(o) : Shopify.onCartUpdate(o)
            })
        },
        Shopify.getProduct = function (t, o) {
            jQuery.getJSON("/products/" + t + ".js", function (t) {
                "function" == typeof o ? o(t) : Shopify.onProduct(t)
            })
        },
        Shopify.changeItem = function (t, o, r) {
            var e = {
                type: "POST",
                url: "/cart/change.js",
                data: "quantity=" + o + "&id=" + t,
                dataType: "json",
                success: function (t) {
                    "function" == typeof r ? r(t) : Shopify.onCartUpdate(t)
                },
                error: function (t, o) {
                    Shopify.onError(t, o)
                }
            };
            jQuery.ajax(e)
        },
        Shopify.removeItem = function (t, o) {
            var r = {
                type: "POST",
                url: "/cart/change.js",
                data: "quantity=0&id=" + t,
                dataType: "json",
                success: function (t) {
                    "function" == typeof o ? o(t) : Shopify.onCartUpdate(t)
                },
                error: function (t, o) {
                    Shopify.onError(t, o)
                }
            };
            jQuery.ajax(r)
        },
        Shopify.clear = function (t) {
            var o = {
                type: "POST",
                url: "/cart/clear.js",
                data: "",
                dataType: "json",
                success: function (o) {
                    "function" == typeof t ? t(o) : Shopify.onCartUpdate(o)
                },
                error: function (t, o) {
                    Shopify.onError(t, o)
                }
            };
            jQuery.ajax(o)
        },
        Shopify.updateCartFromForm = function (t, o) {
            var r = {
                type: "POST",
                url: "/cart/update.js",
                data: jQuery(t).serialize(),
                dataType: "json",
                success: function (r) {
                    "function" == typeof o ? o(r, t) : Shopify.onCartUpdate(r, t)
                },
                error: function (t, o) {
                    Shopify.onError(t, o)
                }
            };
            jQuery.ajax(r)
        },
        Shopify.updateCartAttributes = function (t, o) {
            var r = "";
            jQuery.isArray(t) ? jQuery.each(t, function (t, o) {
                var e = attributeToString(o.key);
                "" !== e && (r += "attributes[" + e + "]=" + attributeToString(o.value) + "&")
            }) : "object" == typeof t && null !== t && jQuery.each(t, function (t, o) {
                r += "attributes[" + attributeToString(t) + "]=" + attributeToString(o) + "&"
            });
            var e = {
                type: "POST",
                url: "/cart/update.js",
                data: r,
                dataType: "json",
                success: function (t) {
                    "function" == typeof o ? o(t) : Shopify.onCartUpdate(t)
                },
                error: function (t, o) {
                    Shopify.onError(t, o)
                }
            };
            jQuery.ajax(e)
        },
        Shopify.updateCartNote = function (t, o) {
            var r = {
                type: "POST",
                url: "/cart/update.js",
                data: "note=" + attributeToString(t),
                dataType: "json",
                success: function (t) {
                    "function" == typeof o ? o(t) : Shopify.onCartUpdate(t)
                },
                error: function (t, o) {
                    Shopify.onError(t, o)
                }
            };
            jQuery.ajax(r)
        };

    doc.ready(function () {
        zmz.init();
    });

    var zmz = {
        init: function () {
            this.getCookie();
            this.searchForms();
            this.ajaxSearch();
            this.initSwiperCarousel();
            this.initCountdown();
            this.backToTop();

            this.clickColorOpt();
            this.passwordShowHide();
            this.widgetToggle();
            this.mobileToggle();
            this.itemAccordion();
            this.itemTabs();
            this.videoFancy();
            this.quantityProductBox();
            this.collectionItemHover();
            if (body.hasClass('rte')) {
                this.rteYoutubeWrap();
            }
            this.formValidation();
            this.sidebarWidgetMenu();
            if (Shopify.designMode) {
                doc.on('shopify:section:load', this.initSwiperCarousel);
            } 
        },

        getCookie: function (cname) {
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1);
                if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
            }
            return "";
        },

        // Search forms
        searchForms: function () {
            doc.on('submit', '.search_form', function (e) {
                var searchQuery = $(this).find('input').val().replace(/ /g, '+');
                var placeHolder = $(this).find('input').attr('placeholder').replace(/ /g, '+');

                if (!(searchQuery.length && searchQuery != placeHolder)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        },

        // 	AJAX SEARCH  =============================================================================================

        ajaxSearch: function () {
            
            var containerWrap = $('.search_content_wrapper');
            var url = '/search?type=product&q=';
            containerWrap.each(function () {
                var _this = $(this);
                var containerWrap = _this.find('[data-search]');
                var containerResult = _this.find('[data-search-result]');
                var containerInput = _this.find('input[type=search]');
                var containerForm = _this.find('.search_form');
                var iconResetForm = _this.find('.icon-search-reset');
                var iconSearch = _this.find('.icon-search');
                
                containerInput.on('keyup change', function (e) {
                    containerWrap.addClass('loading');
                    var inputVal = $(this).val(),
                        _that = $(this);
                    
                    if (_that) {
                        setTimeout(function () {
                            return false;
                        }, 0);
                    }
                    
                    if (e.key == "Backspace" || e.key == "Delete") {
                        containerResult.load(url + inputVal + ' #hidden_search_result > *', function(){
                            containerWrap.removeClass('loading');
                        });
                    }
                    
                    if (inputVal.length > 2) {
                        containerWrap.show().addClass('active');
                        containerResult.load(url + inputVal + ' #hidden_search_result > *', function(){
                                containerWrap.removeClass('loading');
                        });
                        iconResetForm.addClass('active');
                        iconSearch.addClass('active');
                    }
                });

                iconResetForm.on('click', function () {
                    resetSearch();
                });

                if ($('.header_search_toggle_off').length > 0) {
                    if ($(window).width() > 1199) {
                        $(window).scroll(function () {
                            if ($(window).scrollTop() > 20) {
                                resetSearch();
                            }
                        });
                    }
                }

                $(document).on('click', function (e) {
                    if (!_this.is(e.target) && _this.has(e.target).length === 0) {
                        resetSearch();
                    }
                });

                function resetSearch() {
                    containerForm.trigger('reset');
                    iconResetForm.removeClass('active');
                    iconSearch.removeClass('active');
                    containerWrap.hide().removeClass('active loading');
                    containerResult.html('');
                }
            });

        },

        // Swiper carousel by option
        initSwiperCarousel: function () {
            $('.zmz-swiper-container').each(function () {
                var sliderId = '#' + $(this).attr('id');
                var swiperOptions = $(this).data('options');
                var zmzCarousel = new Swiper(sliderId, swiperOptions);
    
                // Hide content popover after by slide changed in section lookbook
                if($(this).hasClass('swiper-container--lookbook')){
                    zmzCarousel.on('transitionStart', function() {
                        var elActiveBul = $("[data-toggle='popover'].is-active");
                        elActiveBul.each(function () {
                            var elemThis = $(this);
                            elemThis.click();
                            elemThis.removeClass('is-active');
                        });
                    });
                }
            });
        },
        // Countdown timer
        initCountdown: function () {
            $(".js-countdown").each(function () {
                var endTime = $(this).data('time'),
                htmlLayout = "<ul class='countdown_timer'><li class='countdown_item'><span class='countdown-time'>%%D%%</span><span class='countdown-text'>d</span><span>:</span></li><li class='countdown_item'><span class='countdown-time'>%%H%%</span><span class='countdown-text'>h</span><span>:</span></li><li class='countdown_item'><span class='countdown-time'>%%M%%</span><span class='countdown-text'>m</span><span>:</span></li><li class='countdown_item'><span class='countdown-time'>%%S%%</span><span class='countdown-text'>s</span></li></ul>";
                $(this).lofCountDown({
                    TargetDate: endTime,
                    DisplayFormat: htmlLayout,
                    FinishMessage: '<span class="alert alert-warning d-inline-block">' + theme.strings.timerEnd + '</span>'
                });
            });
        },

        // Back to top button
        backToTop: function () {
            $(window).on('scroll', function () {
                if ($(this).scrollTop() > 300) {
                    $('#back_top').fadeIn("slow");
                } else {
                    $('#back_top').fadeOut("slow");
                }
            });
            $('#back_top').on('click', function (e) {
                e.preventDefault();
                $('html, body').animate({scrollTop: 0}, 800);
                $('#back_top').fadeOut("slow").stop();
            });
        },

        // CLICKABLE COLOR OPTIONS
        clickColorOpt: function () {
            var elWrap = $('.js-product-thumbnail .product_options');
            elWrap.each(function () {
                var el = $(this).find('.options_clickable_js');
                el.each(function () {
                    $(this).on('click', function () {
                        var elSelected = $('.options_clickable_js.selected');
                        if (elSelected.length) {
                            el.removeClass('selected');
                        }
                        $(this).addClass('selected');
                        var variantImage = $(this).data('image');
                        if (variantImage.length > 0) {
                            $(this).parent().parent().parent().parent().find('.product_img img').attr('srcset', variantImage);
                        }
                    });
                });
            });

        },

        // Show/Hide password input
        passwordShowHide: function () {
            $('[data-action="show-password"]').on('click', function () {
                var elm = $(this).closest('.input-group').children('input.js-visible-password');
                if (elm.attr('type') === 'password') {
                    elm.attr('type', 'text');
                    $(this).html('<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="file_eye_el"><path d="M0.0999997 10.5C-0.1 11 0.2 11.6 0.7 11.8C1.2 12 1.8 11.7 2 11.2C3.6 8.00002 6.6 5.90002 10 5.90002C13.4 5.90002 16.5 8.00002 17.9 11.2C18.1 11.7 18.7 12 19.2 11.8H19.3C19.9 11.6 20.2 11 19.9 10.5C19.3 9.20002 18.5 8.00002 17.5 7.10002C17.1 6.70002 17 6.20002 17.3 5.80002L17.6 5.30002C17.9 4.80002 17.7 4.20002 17.2 3.90002C16.7 3.60002 16.1 3.80002 15.8 4.30002L15.7 4.50002C15.4 5.00002 14.8 5.10002 14.3 4.90002C13.5 4.60002 12.7 4.30002 11.9 4.10002C11.4 4.00002 11 3.60002 11 3.10002V2.90002C11 2.30002 10.5 1.90002 10 1.90002C9.4 1.90002 9 2.40002 9 2.90002V3.10002C9 3.60002 8.6 4.00002 8.1 4.10002C7.3 4.20002 6.5 4.50002 5.8 4.80002C5.3 5.00002 4.6 4.90002 4.3 4.40002L4.2 4.30002C4 3.80002 3.4 3.70002 2.9 3.90002C2.4 4.20002 2.2 4.80002 2.5 5.30002L2.8 5.70002C3.1 6.10002 3 6.70002 2.6 7.00002C1.5 8.00002 0.7 9.20002 0.0999997 10.5Z" /><path d="M19.9 10.6C18.2 6.6 14.3 4 10 4C5.7 4 1.8 6.6 0.2 10.6L0 11L0.2 11.4C1.9 15.4 5.7 18 10.1 18C14.4 18 18.3 15.4 19.9 11.4L20 11L19.9 10.6ZM10 16C6.6 16 3.6 14.1 2.2 11C3.6 7.9 6.6 6 10 6C13.4 6 16.4 7.9 17.8 11C16.4 14.1 13.4 16 10 16Z" /><path d="M10 8C8.4 8 7 9.3 7 11C7 12.7 8.3 14 10 14C11.7 14 13 12.7 13 11C13 9.3 11.7 8 10 8ZM10 12C9.5 12 9 11.6 9 11C9 10.4 9.4 10 10 10C10.6 10 11 10.4 11 11C11 11.6 10.6 12 10 12Z" /></svg>');
                } else {
                    elm.attr('type', 'password');
                    $(this).html('<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" class="file_eye_el"><path d="M19.9213 6.33664C20.1557 5.81077 19.844 5.21824 19.2848 5.05073C18.7566 4.89251 18.1987 5.17332 17.9664 5.66527C16.4415 8.89505 13.3725 10.966 10.0416 10.966C6.6215 10.966 3.54948 8.90232 2.10083 5.68227C1.876 5.18253 1.32023 4.88805 0.785864 5.04012L0.728076 5.05657C0.155103 5.21963 -0.161611 5.82638 0.0839321 6.36027C0.677994 7.65193 1.46566 8.82793 2.44692 9.79417C2.80378 10.1456 2.90358 10.6891 2.64628 11.1163L2.37452 11.5674C2.08511 12.0479 2.25306 12.668 2.74729 12.9438C3.22751 13.2118 3.83775 13.0542 4.12169 12.589L4.23541 12.4027C4.52288 11.9316 5.1386 11.7753 5.64786 12.0022C6.39877 12.3366 7.2005 12.6011 8.01571 12.7778C8.51904 12.8869 8.90067 13.3108 8.90067 13.817V13.9866C8.90067 14.5463 9.3679 15 9.93786 15C10.5078 15 10.9751 14.5463 10.9751 13.9866V13.817C10.9751 13.3108 11.3565 12.887 11.8618 12.7872C12.6628 12.6289 13.4508 12.3976 14.1903 12.0598C14.7189 11.8183 15.372 11.963 15.6717 12.4541L15.754 12.589C16.038 13.0542 16.6482 13.2118 17.1284 12.9438C17.6227 12.668 17.7906 12.0479 17.5012 11.5674L17.2439 11.1403C16.9803 10.7027 17.0921 10.1451 17.4697 9.79728C18.5171 8.83258 19.3228 7.67903 19.9213 6.33664Z"/></svg>');
                }
            });
        },

        // Widget Toggle
        widgetToggle: function () {
            $('.widget_toggle').each(function () {
                var navItem = $(this);
                var itemEl = navItem.parent().find('.content-widget_toggle');
                itemEl.hide();
                navItem.on('click', function () {
                    if (navItem.hasClass('open')) {
                        itemEl.slideUp(400);
                        navItem.removeClass('open');
                    } else {
                        itemEl.slideDown(400);
                        navItem.addClass('open');
                    }
                });
                if ($(window).innerWidth() > 767) {
                    if (navItem.hasClass('open')) {
                        itemEl.show();
                    } else {
                        if (navItem.hasClass('open')) {
                            navItem.removeClass('open');
                        }
                    }
                }
            });
        },

        // lINKLIST IN MENU TOGGLE
        mobileToggle: function () {

            if ($(window).innerWidth() < 768) {
                $('.toggle-mobile').each(function () {
                    var navItem = $(this);
                    var itemEl = navItem.parent().find('.content-toggle-mobile');
                    itemEl.hide();
                    navItem.on('click', function () {
                        if (navItem.hasClass('open')) {
                            itemEl.slideUp(400);
                            navItem.removeClass('open');
                        } else {
                            itemEl.slideDown(400);
                            navItem.addClass('open');
                        }
                    })
                });
            }
        },


        // ACCORDION
        itemAccordion: function () {
            var details = [...document.querySelectorAll('.item-accordion-js details')];
            var stickyGallery = document.querySelector('.stickyimgpr-js');
            details.forEach((targetDetail) => {
                targetDetail.querySelector('summary').addEventListener("click", () => {
                    // Close all the details that are not targetDetail.
                    details.forEach((detail) => {
                        var detailContent = detail.querySelector('.accordion-content');
                        var attrOpen = false;
                        
                        if (detail === targetDetail) {
                            attrOpen = true;
                            detailContent.classList.remove("animated");
                            detailContent.classList.add("animated");
                            detailContent.addEventListener('animationend', function () {
                                detailContent.classList.remove("animated");
                            });
                        }
    
                        if (stickyGallery){
                            if (typeof attrOpen !== 'undefined' && attrOpen === false) {
                                var cur = $('html,body').scrollTop();
                                $('html,body').animate({
                                    scrollTop: cur - 1
                                }, 10);
                            }
                        }
                    });
                });
            });
        },

        // TABS
        itemTabs: function () {
            $('.tab_content_wrapper').each(function (i) {
                var navItem = $(this).find('.tab_nav');
                var tabItem = $(this).find('.tab_item');
                navItem.on('click', function (e) {
                    navItem.removeClass('active');
                    $(this).addClass('active');
                    tabItem.removeClass('active');
                    tabItem.eq($(this).data('tab')).addClass('active');
                });
            });
        },

        // Fancybox video
        videoFancy: function () {
            $(".fancybox-media").fancybox({
                maxWidth: 800,
                maxHeight: 600,
                fitToView: false,
                width: '70%',
                height: '70%',
                autoSize: false,
                closeClick: false,
                openEffect: 'elastic',
                closeEffect: 'none',
                beforeLoad: function () {
                    var url = $(this.element).attr("href");
                    url = url.replace(new RegExp("watch\\?v=", "i"), 'v/');
                    url += '?fs=1&autoplay=1&rel=0&controls=0';
                    this.href = url
                }
            });
        },
        
        // Product quantity box
        quantityProductBox: function () {
            doc.on("focusout", ".quantity_input", function () {
                var a = $(this).val();
                isNaN(parseFloat(a)) && !isFinite(a) || 0 == parseInt(a) || "" == a ? $(this).val(1) : parseInt(a) < 0 ? $(this).val(parseInt(a) - 2 * parseInt(a)) : $(this).val(parseInt(a))
            }), doc.on("click", ".quantity_up", function () {
                var a = $(this).parent().find(".quantity_input");
                isNaN(parseFloat(a.val())) || !isFinite(a.val()) || a.attr("disabled") ? a.val(1) : a.val(parseInt(a.val()) + 1)
            }), doc.on("click", ".quantity_down", function () {
                var a = $(this).parent().parent().find(".quantity_input");
                !isNaN(parseFloat(a.val())) && isFinite(a.val()) && a.val() > 1 && !a.attr("disabled") ? a.val(parseInt(a.val()) - 1) : a.val(1)
            });
        },

        // Collection item hover effect
        collectionItemHover: function () {
            var o = $(".collection_item");
            if (o.length > 0) {
                doc.ready(function () {

                    body.delegate('.collection_caption', 'mouseover', function () {
                        $(this).addClass('rollOut');
                    });

                    body.delegate('.collection_caption', 'mouseout', function () {
                        $(this).removeClass('rollOut');
                    });

                });
            }
        },
        // RTE youtube wrapper
        rteYoutubeWrap: function () {
            $('.rte iframe[src *= youtube]').wrap('<div class="rte_youtube_wrapper"></div>');
        },

        formValidation: function (elem) {
            var elem = $('.footer_newsletter_form');
        },


        sidebarWidgetMenu: function () {
            // LINKLIST ITEM SHOW/HIDE ELEMENT
            $('.sidebar_widget__linklist .menu_trigger').each(function () {
                $(this).on('click', function () {
                    $(this).parent().siblings('a').toggleClass('active');
                    $(this).toggleClass('active');
                    $(this).parent().siblings('.submenu-js').slideToggle();
                });
            });
        }
    }

    if (themeProtect == true) {
        window.oncontextmenu = function () {
            return false;
        };
        document.onkeydown = function (e) {
            if (window.event.keyCode == 123 || e.button == 2)
                return false;
        };
    }
})(jQuery);
