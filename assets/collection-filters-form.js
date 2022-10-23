
;(function($){

  $(document).ready(function() {
    renderProductSortView();
  });

  $(document).on('click', '#view_grid, #view_grid_large, #view_grid_small, #view_list',function() {
    var thisView = $(this).data('view');
    $('#view_grid, #view_grid_large, #view_grid_small, #view_list').removeClass('active');
    $('#product_listing__sorted').removeClass('product_listing__list product_listing__grid product_listing__grid_medium product_listing__grid_large product_listing__grid_small');
    $(this).addClass('active');
    $.cookie('productSortView', thisView, {path: '/'});
    $('#product_listing__sorted').addClass( 'product_listing__' + thisView ); 
  });

})(jQuery);

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.focus();
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

class CollectionFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.filterData = [];

    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);


    this.querySelector('form').addEventListener('input', this.debouncedOnSubmit.bind(this));
    window.addEventListener('popstate', this.onHistoryChange.bind(this));


    const facetWrapper = this.querySelector('#FacetsWrapperDesktop, #FacetsWrapperDesktopColumn');
    if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const formData = new FormData(event.target.closest('form'));
    const searchParams = new URLSearchParams(formData).toString();
    this.renderPage(searchParams, event);
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    this.toggleActiveFacets();
    this.renderPage(new URL(event.currentTarget.href).searchParams.toString());
  }

  onHistoryChange(event) {
    const searchParams = event.state ? event.state.searchParams : '';
    this.renderPage(searchParams, null, false);
  }

  toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }


  renderPage(searchParams, event, updateURLHash = true) {
    const sections = this.getSections();
    const countContainerDesktop = document.getElementById('CollectionProductCountDesktop');
    document.getElementById('CollectionProductGrid').querySelector('.collection').classList.add('loading');
    document.getElementById('CollectionProductCount').classList.add('loading');
    if (countContainerDesktop){
      countContainerDesktop.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = element => element.url === url;

      this.filterData.some(filterDataUrl) ?
        this.renderSectionFromCache(filterDataUrl, event) :
        this.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) this.updateURLHash(searchParams);
  }

  renderSectionFromFetch(url, event) {
    fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        const html = responseText;
        this.filterData = [...this.filterData, { html, url }];
        this.renderFilters(html, event);
        this.renderProductGrid(html);
        this.renderProductCount(html);
      });
  }

  renderSectionFromCache(filterDataUrl, event) {
    const html = this.filterData.find(filterDataUrl).html;
    this.renderFilters(html, event);
    this.renderProductGrid(html);
    this.renderProductCount(html);
  }

  renderProductGrid(html) {
    document.getElementById('CollectionProductGrid').innerHTML = new DOMParser().parseFromString(html, 'text/html').getElementById('CollectionProductGrid').innerHTML;
    renderProductSortView();
    activeCompare();
    activeWishlist();
  }

  renderProductCount(html) {
    const countF = new DOMParser().parseFromString(html, 'text/html').getElementById('CollectionProductCount').innerHTML
    const container = document.getElementById('CollectionProductCount');
    const containerDesktop = document.getElementById('CollectionProductCountDesktop');
    container.innerHTML = countF;
    container.classList.remove('loading');
    if (containerDesktop) {
      containerDesktop.innerHTML = countF;
      containerDesktop.classList.remove('loading');
    }
  }

  renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

    const facetDetailsElements =
      parsedHTML.querySelectorAll('#CollectionFiltersForm .js-filter, #CollectionFiltersFormMobile .js-filter, #CollectionFiltersColumnForm .js-filter');
    const matchesIndex = (element) => { 
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.dataset.index === jsFilter.dataset.index : false; 
    }
    const facetsToRender = Array.from(facetDetailsElements).filter(element => !matchesIndex(element));
    const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);

    facetsToRender.forEach((element) => {
      document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
    });

    this.renderActiveFacets(parsedHTML);
    this.renderAdditionalElements(parsedHTML);

    if (countsToRender) this.renderCounts(countsToRender, event.target.closest('.js-filter'));
  }

  renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets-mobile', '.active-facets-desktop'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    })

    this.toggleActiveFacets(false);
  }

  renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });

    document.getElementById('CollectionFiltersFormMobile').closest('menu-drawer').bindEvents();
  }


  renderCounts(source, target) {
    const countElementSelectors = ['.count-bubble','.facets__selected'];
    countElementSelectors.forEach((selector) => {
      const targetElement = target.querySelector(selector);
      const sourceElement = source.querySelector(selector);

      if (sourceElement && targetElement) {
        target.querySelector(selector).outerHTML = source.querySelector(selector).outerHTML;
      }
    });
  }

  updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  getSections() {
    return [
      {
        id: 'main-collection-product-grid',
        section: document.getElementById('main-collection-product-grid').dataset.id,
      }
    ]
  }
}

customElements.define('collection-filters-form', CollectionFiltersForm);


class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.productsPriceRangeSlider();
    this.querySelectorAll('input').forEach(element => element.addEventListener('change', this.onRangeChange.bind(this)));
    this.setMinAndMaxValues();
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
    this.productsPriceRangeSlider();
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];
    if (maxInput.value) minInput.setAttribute('max', maxInput.value);
    if (minInput.value) maxInput.setAttribute('min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('min', 0);
    if (maxInput.value === '') minInput.setAttribute('max', maxInput.getAttribute('max'));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('min'));
    const max = Number(input.getAttribute('max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }

  productsPriceRangeSlider() {

    const parent = document.querySelectorAll(".price-slider");
    if(!parent) return;

        const  rangeSlider = this.querySelectorAll("input[type=range]"),
               priceSlider = this.querySelectorAll("input[type=number]");

      rangeSlider.forEach(function (el) {
        el.oninput = function () {
         let  slide1 = parseFloat(rangeSlider[0].value),
              slide2 = parseFloat(rangeSlider[1].value);

          if (slide1 > slide2) {
            [slide1, slide2] = [slide2, slide1];
          }

          priceSlider[0].value = slide1;
          priceSlider[1].value = slide2;
        }
      });

      priceSlider.forEach(function (el) {
        el.oninput = function () {
          let price1 = parseFloat(priceSlider[0].value),
              price2 = parseFloat(priceSlider[1].value);

          rangeSlider[0].value = price1;
          rangeSlider[1].value = price2;
        }
      });

    const allRanges = document.querySelectorAll(".range-wrap");
    if(!allRanges) return;

    allRanges.forEach(wrap => {
      const range = wrap.querySelector(".range");
      const bubble = wrap.querySelector(".bubble");

      range.addEventListener("input", () => {
        setBubble(range, bubble);
      });
      setBubble(range, bubble);
    });
    function setBubble(range, bubble) {
      const val = range.value;
      const min = range.min ? range.min : 0;
      const max = range.max ? range.max : 100;
      const newVal = Number(((val - min) * 100) / (max - min));
      bubble.innerHTML = val;
      bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
    }
  }

}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    this.querySelector('a').addEventListener('click', (event) => {
      event.preventDefault();
      const form = this.closest('collection-filters-form') || document.querySelector('collection-filters-form');
      form.onActiveFilterClick(event);
    });
  }
}

customElements.define('facet-remove', FacetRemove);


function activeWishlist() {
  if (productWishlist = false) {
    return;
  }else {
      initBtnWishlist();
  }
}

function activeCompare() {
  if (productCompare = false) {
    return;
  } else {
      initBtnCompare();
  }
}


function renderProductSortView () {
  if ( typeof jQuery.cookie('productSortView') == 'undefined' ) {
    jQuery.cookie('productSortView', 'grid_medium', {path: '/'});
  }
  else if ( jQuery.cookie('productSortView') == 'list' ) {
    jQuery('#view_grid, #view_grid_large, #view_grid_small').removeClass('active');
    jQuery('#view_list').addClass('active');
    jQuery('#product_listing__sorted').addClass('product_listing__list').removeClass('product_listing__grid product_listing__grid_medium product_listing__grid_large product_listing__grid_small');
  } else if ( jQuery.cookie('productSortView') == 'grid_medium' ){
    jQuery('#view_list, #view_grid_large, #view_grid_small').removeClass('active');
    jQuery('#view_grid').addClass('active');
    jQuery('#product_listing__sorted').addClass('product_listing__grid product_listing__grid_medium').removeClass('product_listing__list product_listing__grid_large product_listing__grid_small');
  } else if ( jQuery.cookie('productSortView') == 'grid_large' ){
    jQuery('#view_list, #view_grid, #view_grid_small').removeClass('active');
    jQuery('#view_grid_large').addClass('active');
    jQuery('#product_listing__sorted').addClass('product_listing__grid product_listing__grid_large').removeClass('product_listing__list product_listing__grid_medium product_listing__grid_small');
  } else if ( jQuery.cookie('productSortView') == 'grid_small' ){
    jQuery('#view_list, #view_grid, #view_grid_large').removeClass('active');
    jQuery('#view_grid_small').addClass('active');
    jQuery('#product_listing__sorted').addClass('product_listing__grid product_listing__grid_small').removeClass('product_listing__list product_listing__grid_medium product_listing__grid_large');
  }
}