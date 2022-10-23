

(function($) {
	$(document).ready(function() {

        // MEGAMENU =================================================================================================
        var mobFlag = 0;

        megamenuToggle = function () {

            if ($(window).width() > 1199) {

                $('#megamenu, .menu-user').removeClass('megamenu_mobile').addClass('megamenu_desktop');

                $('#megamenu_level__1, #megamenu-links').superfish();

                $('#megamenu_mobile_toggle, .megamenu_trigger').off('.mobileMenu').removeClass('off active');

                $('.menu-content, .megamenu_mobile_close,#megamenu_mobile_toggle, #megamenu-links').removeClass('on');

                mobFlag = 0;

                turnMenuDropdownSide();
            } else {
                // $('.menu-content, .megamenu_mobile_close').hide();
                $('#megamenu, .menu-user').removeClass('megamenu_desktop').addClass('megamenu_mobile');
                $('#megamenu_level__1, #megamenu-links').superfish('destroy');
                if (mobFlag == 0) {
                    menuMobile();
                    mobFlag = 1;
                }
            }
        };

        menuMobile = function () {
           
                $('.megamenu_mobile .submenu-js').each(function () {
                    $(this).superfish('destroy');
                    $(this).show();
                });

            
                $('.megamenu_mobile .megamenu_trigger').each(function () {
                    var cLink = $(this).parent().clone(); 

                    var toBack = ('<li class="link js-back_link pl-1 d-xl-none"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.8283 12L15.7783 7.05L14.3643 5.636L8.00032 12L14.3643 18.364L15.7783 16.95L10.8283 12Z" fill="#797B7E"/></svg><span>' + headerText.headerBtnBack + '</span></li>')
                    var targetUl = $(this).parent().siblings('ul.submenu-js');
                    cLink.prependTo(targetUl).wrap('<li class="link-title clone_title"></li>'); 
                    (targetUl).prepend(toBack);
                    
                        $(this).parent('a').replaceWith(function () {
                            return '<span class="level_1__link link-trigger">' + $(this).html() + '</span>';
                        });
                
                    cLink.find('span.megamenu_trigger').remove();
                });


                $('#megamenu_mobile_toggle').on('click.mobileMenu', function () {
                    $(this).toggleClass('on');
                    $('.megamenu_mobile .is-megamenu, .megamenu_mobile .is-simplemenu, .megamenu_mobile .droped_linklist').each(function () {
                        $(this).removeClass('open-menu');
                    });
                    $('.menu-content, .megamenu_mobile_close').show().toggleClass('on');
                    if ($(this).hasClass('on')) {
                        $('html, body').css({'overflow': 'hidden', 'position': 'fixed', 'top': '0', 'left': '0', 'right': '0'});
                    } else {
                        $('html, body').removeAttr('style');
                    }
                });

                $('.megamenu_mobile .submenu-js .megamenu_trigger').on('click.mobileMenu', function () {
                    $(this).parent().siblings('.submenu-js').addClass('open-menu');

                    var back_link = $('.js-back_link');
                    $(back_link).on('click', function () {
                        $(this).parent('.open-menu').removeClass('open-menu');
                    });
                });


                $('.megamenu_mobile_close').on('click', function () {
                    $('.menu-content, .megamenu_mobile_close, #megamenu_mobile_toggle').removeClass('on');
                    $('html, body').css({'overflow': 'auto', 'position': 'static'});

                    $('.megamenu_mobile .is-megamenu, .megamenu_mobile .is-simplemenu, .megamenu_mobile .droped_linklist').each(function () {
                        $(this).removeClass('open-menu');
                    });

                    $('.megamenu_mobile .droped_linklist').superfish('destroy');

                    $('.megamenu_mobile .megamenu_trigger').each(function () {
                        $(this).removeClass('active');
                    });
                });
          
        };

        window.onresize = function(event) {
            if (mobFlag == 0) {
                var clone_title = $('.megamenu_desktop .clone_title');
                if(clone_title){
                    clone_title.each(function(){
                        $(this).remove();           
                    }); 
                }
                $('html, body').removeAttr('style');
            }
        };

		// WATCH MENU DROP SIDE   ====================================================================================
		turnMenuDropdownSide = function() {
			$('#megamenu .is-simplemenu').each(function(i){
				if ( ($(this).offset().left + 470) > $(window).width() ){
					$(this).find('.droped_linklist').addClass('left_side');
				}
			});
		};

		// STICKY MENU  ==============================================================================================
		stickyHeader = function() {
			var target = $('.stickUpHeader');
			var pseudo = $('#pseudo_sticky_block');
			var stick_class = 'megamenu_stuck';
			$('body .megamenu_stuck').siblings().wrap('<div class="container">');
            $('#megamenu_level__1, #megamenu-links').superfish('destroy');
            $('#megamenu_level__1, #megamenu-links').superfish();
            
			$(window).on('load scroll resize', function() {
                var scrolledValue = parseInt( $(window).scrollTop() );
                var offsetValue = parseInt( pseudo.offset().top );
                
				if ( $(window).width() > 1199 ) {
				 
					if ( scrolledValue > offsetValue ) {
						target.addClass( stick_class );
					}
					else {
						target.removeClass( stick_class );
					}
				} else {
                    target.removeClass( stick_class );
					target.remove();
				}
				
				
			});
			
			
			$(window).on('load', function() {
				setTimeout(function(){
					$(window).trigger('scroll')
				}, 180);
			});
		};

		stickyHeader();
		megamenuToggle(); 
		
        $(window).on('load resize', function() {
            megamenuToggle();
        });
     
		
		// CART TOGGLE  ===========================================================================================
		var headerCartWrapper = $('header .cart_content_wrap');
        if ( $(window).width() <= 1199) {
			$('.js_cart_link_toggle').on('click', function(){
				if ( headerCartWrapper.hasClass('open') ){
					headerCartWrapper.removeClass('open');
					$(this).removeClass('open');
					$('html, body').removeAttr('style');
				} else {
					headerCartWrapper.addClass('open');
					$(this).addClass('open');
					$('html, body').css({'overflow': 'hidden', 'position':'fixed', 'top': '0', 'left': '0', 'right': '0'});
				}
			});
			
			$('.js_cart_close').on('click', function(){
				headerCartWrapper.removeClass('open');
				$('.js_cart_link_toggle').removeClass('open');
				$('html, body').removeAttr('style');
			});
        }
		


		// SEARCH TOGGLE  ===========================================================================================
        if( theme.searchToggleOn ){
            var headerSearchForm = $('header .search_form_wrap');

            $.fn.clickSearchToggle = function(func1, func2) {
                var funcs = [func1, func2];
                this.data('toggleclicked', 0);
                this.click(function() {
                    var data = $(this).data();
                    var tc = data.toggleclicked;
                    $.proxy(funcs[tc], this)();
                    data.toggleclicked = (tc + 1) % 2;
                });
                return this;
            };

            function searchPopup() {
                if ( headerSearchForm.hasClass('open') ){
                    headerSearchForm.removeClass('open');
                    $(this).removeClass('open');
                } else {
                    headerSearchForm.addClass('open');
                    $(this).addClass('open');
                }
            }

            $('.search_toggle').clickSearchToggle(function() {
                searchPopup();
            }, function() {
                searchPopup();
            });

            $('.search_form_overlay, .search_form_close').on('click',function () {
                cleanSearchPopup();
            });

            function cleanSearchPopup() {
                $('.search_form').trigger("reset");
                headerSearchForm.removeClass('open');
                $('.search_toggle').removeClass('open');
                $('.icon-search-reset').removeClass('active');
                $('[data-search]').hide().removeClass('active');
                $('[data-search-result]').html('');
            }
		}
		
  
		// DATA TARGET ATTRIBUTE
		$('[data-target]').on('click', function(){
			const targetSelector = this.getAttribute('data-target');
			$(this).toggleClass('active');
			$(targetSelector).toggleClass('active');
		});

		// FOOTER NEWSLETTER FORM
		$('.footer_newsletter_form').each(function (){   
			$(this).on('submit', function(e){
				var formCookie = $(this).attr('class');
				$.cookie('footerformSended', formCookie);
			});
		});
		
		if( document.location.href.indexOf('?customer_posted=true') > 0 && $.cookie('footerformSended') == 'footer_newsletter_form') {
			$('.footer_newsletter_form .form_wrapper').hide();
			$('.footer_newsletter_form .alert-success').show();
		}
	});
})(jQuery);