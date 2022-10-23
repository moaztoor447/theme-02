const LOCAL_STORAGE_WISHLIST_KEY = 'zmz-shopify-wishlist';
const LOCAL_STORAGE_SEPARATOR = ',';
const BUTTON_ACTIVE_CLASS = 'active';
const TEMPLATE_LOADED_CLASS = 'loaded';

const selectors = {
  button: '[btn-wishlist-js]',
  template: '[template-wishlist-js]', 
  itemProduct: '.js-product-thumbnail, .product-scope',
  wishlistCounter: '.zemez_wishlist_total'
};




document.addEventListener('DOMContentLoaded', () => {
  initBtnWishlist();
  initTemplate();
  initCounter();
});

document.addEventListener('zmz-shopify-wishlist:updated', (event) => {
  initTemplate();
  initCounter();
});


const fetchItemProductHTML = (handle) => {
  const productTileTemplateUrl = `/products/${handle}?view=card`;
  return fetch(productTileTemplateUrl)
  .then((res) => res.text())
  .then((res) => {
    const text = res;
    const parser = new DOMParser();
    const htmlDocument = parser.parseFromString(text, 'text/html');
    const itemProduct = htmlDocument.documentElement.querySelector(selectors.itemProduct);
    return itemProduct.outerHTML;
  })
  .catch((err) => console.error(`[Shopify Wishlist] Failed to load content for handle: ${handle}`, err));
};

const setTemplate = async (template) => {
  const wishlist = getWishlist();
  const requests = wishlist.map(fetchItemProductHTML);
  const responses = await Promise.all(requests);
  const wishlistItemProducts = responses.join('');
  template.innerHTML = wishlistItemProducts;
  template.classList.add(TEMPLATE_LOADED_CLASS);
  initBtnWishlist();
  updActiveCompare();
  const event = new CustomEvent('zmz-shopify-wishlist:init-product-template', {
    detail: { wishlist: wishlist }
  });
  document.dispatchEvent(event);
};

const setBtnWishlist = (buttons) => {
  buttons.forEach((button) => {
    const productHandle = button.dataset.productHandle || false;
    if (!productHandle) return console.error('[Shopify Wishlist] Missing `data-product-handle` attribute. Failed to update the wishlist.');
    if (wishlistContains(productHandle)) button.classList.add(BUTTON_ACTIVE_CLASS);
    button.addEventListener('click', () => {
      updWishlist(productHandle);
      button.classList.toggle(BUTTON_ACTIVE_CLASS);
    });
  });
};

const setCounter = (counters) => {
  const wishlist = getWishlist(); 
  counters.forEach((counter) => {
     if (wishlist.length >= 1) counter.innerHTML = '('+ wishlist.length +')'; 
     else counter.innerHTML = '';  
  });
};


const initTemplate = () => {
  const template = document.querySelector(selectors.template) || false;
  if (template) setTemplate(template);
};

const initBtnWishlist = () => {
  const buttons = document.querySelectorAll(selectors.button) || [];
  if (buttons.length) setBtnWishlist(buttons);
  else return;
  const event = new CustomEvent('zmz-shopify-wishlist:init-buttons', {
    detail: { wishlist: getWishlist() }
  });
  document.dispatchEvent(event);
};


const initCounter = () => {
  const counters = document.querySelectorAll(selectors.wishlistCounter) || [];
  if (counters.length) setCounter(counters);
};

const getWishlist = () => {
  const wishlist = localStorage.getItem(LOCAL_STORAGE_WISHLIST_KEY) || false;
  if (wishlist) return wishlist.split(LOCAL_STORAGE_SEPARATOR);
  return [];
};

const setWishlist = (array) => {
  const wishlist = array.join(LOCAL_STORAGE_SEPARATOR);
  if (array.length) localStorage.setItem(LOCAL_STORAGE_WISHLIST_KEY, wishlist);
  else localStorage.removeItem(LOCAL_STORAGE_WISHLIST_KEY);

  const event = new CustomEvent('zmz-shopify-wishlist:updated', {
    detail: { wishlist: array }
  });
  document.dispatchEvent(event);

  return wishlist;
};

const updWishlist = (handle) => {
  const wishlist = getWishlist();
  const idxItemList = wishlist.indexOf(handle);
  if (idxItemList === -1) wishlist.push(handle);
  else wishlist.splice(idxItemList, 1);
  return setWishlist(wishlist);
};

const wishlistContains = (handle) => {
  const wishlist = getWishlist();
  return wishlist.includes(handle);
};

const resetWishlist = () => {
  return setWishlist([]);
};


const updActiveCompare = () => {
  if (productCompare = false) {
    return;
  }else {
      initBtnCompare(); 
  }
}