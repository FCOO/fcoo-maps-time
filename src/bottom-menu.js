/****************************************************************************
bottom-menu.js

Create the content for bottom-menu with buttons, slider, info etc. for selected time
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};



    //Create button to extend the bottom menu
    var $extendedButton = $.bsIconCheckboxButton({
            selected: false,
            icon: [
                'far fa-lg fa-chevron-circle-up',
                'far fa-lg fa-chevron-circle-down'
            ],
            onChange: function(id, selected){
                ns.appSetting.set('bottomMenuExtended', selected);
            }
        });


    //Add bottomMenuExtended to application-settings
    ns.appSetting.add({
        id          : 'bottomMenuExtended',
        callApply   : false,
        applyFunc   : function( extended ){
            nsTime.bottomMenuExtended = !!extended;
            window.modernizrToggle('bottom-menu-extended', nsTime.bottomMenuExtended);

            $extendedButton._cbxSet( extended, true /*dontCallOnChange*/ );

        },
        defaultValue: false
    });


    /***************************************************************
    creaetBottomMenu( $container )
    ***************************************************************/
    function creaetBottomMenu( $container ){

//        $container.addClass('modal-dialog')

//HER        var test = $('<div/>')
//HER            .appendTo($container)
//HER            .addClass('NIELS');

        $('<div/>')
            .appendTo($container)
            ._bsAddBaseClassAndSize({baseClass: 'jb-header-container', useTouchSize: true})
            ._bsHeaderAndIcons({
                headerClassName: 'show-for-bottom-menu-extended',
                header: {
                    icon: 'fa-clock',
                    text: 'Overskrift',
                },
                icons: {
                    diminish: { onClick: function(){ alert('dim'); }},
                    close   : { onClick: function(){ alert('close'); }}
                }

            });

//HERreturn;

        var buttons = {
            'time-step-first'       : {icon: 'fa-arrow-to-left',         diff: -9999},
            'time-step-prev-ext'    : {icon: 'fa-angle-double-left',     diff: -6   },
            'time-step-prev'        : {icon: 'fa-angle-left',            diff: -1   },
            'time-step-next'        : {icon: 'fa-angle-right',           diff: +1   },
            'time-step-next-ext'    : {icon: 'fa-angle-double-right',    diff: +6   },
            'time-step-last'        : {icon: 'fa-arrow-to-right',        diff: +9999}
        };

        function createButton(className){
            return $.bsButton({
                square  : true,
                icon    : buttons[className].icon,
                bigIcon : true,
                class   : className
            });
        }

        function appendButtons($container, buttonList){
            var $div = $('<div/>').appendTo($container);
            $.each(buttonList, function(index, optionsOrButton){
                var $button = $.type(optionsOrButton) == 'string' ? createButton(optionsOrButton) : optionsOrButton;
                $button.appendTo($div);
            });
        }


        //Create button to select time-mode (scale, relative etc.)
        var $timeModeButton;
        if (nsTime.timeOptions.timeModeList.length > 1)
            $timeModeButton = $.bsButton({
                square  : true,
                icon    : 'fa-list',
                bigIcon : true,
                onClick: nsTime.selectTimeMode
            });












        //Create common elements
        //var $slider1 =
                $('<div/>')
                    .appendTo($container)
                    .addClass('show-for-bottom-menu-extended')
.height(30)
.text('slider1');

        //var $slider2 =
                $('<div/>')
                    .appendTo($container)
                    .addClass('show-for-bottom-menu-extended')
.height(30)
.text('slider2');


        var $main = $('<div/>')
                .appendTo($container)
                .addClass('ts-main-container');


        //var $footer =
                $('<div/>')
                    .appendTo($container)
                    ._bsAddBaseClassAndSize({baseClass: 'jb-footer-container', useTouchSize: true})
                    .addClass('show-for-bottom-menu-extended')
//HER                    .css('border-top', '1px solid red')
//HER                    .addClass('modal-footer-header show-for-bottom-menu-extended')
                    ._bsAddHtml( ns.globalSettingFooter(ns.events.TIMEZONECHANGED, true) );


        var $time = $('<div/>')
                .vfFormat('time')
                .addClass('is-current-moment text-center font-weight-bold'),


            $date = $('<div/>')
                .vfFormat('date_format')
                .vfOptions({
                    dateFormat: {weekday: 'None',  month: 'Short',  year: 'None' }
                })
                .addClass('is-current-moment text-center'),




            $relative = $('<div/>')
//=>                .width('9em')
//=>                .vfFormat('relative_dh')
                .vfFormat('relative_dhm')
                .addClass('is-current-relative text-center text-capitalize show-for-global-setting-showrelative bold-for-time-mode-RELATIVE'),

        $utc = $('<div/>')
//=>            .width('9em')
            .vfFormat('time_utc_sup')
            .addClass('is-current-moment text-center font-italic hide-for-global-setting-timezone-utc show-for-global-setting-showutc');



        //1: Small screen and normal mode
        $container.addClass('time-selector-container');

        var $leftButtonContainer = $('<div/>')
            .appendTo($main)
            .addClass('ts-button-container left');

        appendButtons($leftButtonContainer, [$timeModeButton, 'time-step-first' ]);
        appendButtons($leftButtonContainer, ['time-step-prev-ext', 'time-step-prev' ]);


        //var $info =
                $('<div/>')
                    .appendTo($main)
                    .addClass('ts-info-container')

                    .append( $relative )

                    .append( $time )
                    .append( $date )

                    .append( $utc );


//HER        $('<div/>')
//HER            .appendTo($container)
//HER            .text('Nu+2d4t')
//HER.css('background-color', 'yellow')
//HER.width('9em')
//HER//            .vfFormat('relative_dh')
//HER
//HER            .addClass('is-current-relative text-center show-for-global-setting-showrelative');


//HER        $('<div/>')
//HER            .appendTo($container)
//HER            .html('12:00am<sup>+1</sup>')
//HER.width('9em')
//HER//            .vfFormat('time_utc_sup')
//HER            .addClass('is-current-moment text-center font-italic hide-for-global-setting-timezone-utc show-for-global-setting-showutc');


        var $rightButtonContainer = $('<div/>')
            .appendTo($main)
            .addClass('ts-button-container right');

        appendButtons($rightButtonContainer, ['time-step-next', 'time-step-next-ext']);
        appendButtons($rightButtonContainer, ['time-step-last', $extendedButton]);






        //Set event on buttons
        $.each(buttons, function(className, options){
            $container.find('.'+className).on('click', function(){
                nsTime._addDiffToCurrentTimeMode(options.diff);
            });
        });

    }

    //*****************************************************************
    nsMap.BOTTOM_MENU = {
        height         : 'auto',
        standardHandler: true,
        createContent  : creaetBottomMenu
    };

}(jQuery, L, this, document));
