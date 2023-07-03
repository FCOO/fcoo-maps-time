/***********************************************************************************
bottom-menu.js

Create the content for bottom-menu with buttons, slider, info etc. for selected time
*************************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};



    /**************************************************************************
    The content of the bottom-menu contains of buttons, boxes with info on current time an sliders
    This are all referred to as an element and a prototype is created in elements = [ID]$-element

    See 10_bottom-menu-elements.js for details on different elements

    **************************************************************************/
    var elements      = nsTime.elements,
        addElementSet = nsTime.addElementSet;


    /**************************************************************************
    ***************************************************************************
    creaetBottomMenu( $container )
    ***************************************************************************
    **************************************************************************/
    function creaetBottomMenu( $container ){
/* TEST
        var isDesktop = false,
            isNotDesktop = !isDesktop,
            isPhone = true;
*/
        var isDesktop = ns.modernizrDevice.isDesktop,
            isNotDesktop = !isDesktop,
            isPhone = ns.modernizrDevice.isPhone;

        //Remove button for mode if only one mode
        if (nsTime.timeOptions.timeModeList.length == 1)
            elements['time-mode'] = null;


        //Set events for resize and change relative time
        $container.resize( nsTime.bottomMenu_onResize );
        ns.events.on('CURRENTRELATIVECHANGED', nsTime.bottomMenu_onCurrentRelativeChanged);

        ns.events.on('TIMEMODECHANGED', nsTime.bottomMenu_onResize);


        /**************************************************************************
        Create the contents for different modes, orientation, minimized/extended etc.
        DESKTOP, TABLE, and PHONE-LANDSCAPE are the same
        PHONE-PORTRAIT has a special version due to the small screen-width
        **************************************************************************/

        /**************************************************************************
        TOP-ROW(S)
            DESKTOP, TABLE, PHONE-LANDSCAPE, PHONE-PORTRAIT-MINIMIZED:
                Buttons and current, relative and utc time
            PHONE-PORTRAIT-NORMAL:
                1. row: SCALE:Current, RELATIVE:Relative
                2. row: relative/current and utc time
                3. row: Buttons
            PHONE-PORTRAIT-EXTENDED:
                As PHONE-PORTRAIT-NORMAL +
                4. Range
        **************************************************************************/
        //DESKTOP, TABLE, PHONE-LANDSCAPE: Buttons and current, relative and utc time
        addElementSet({
            $container:
                $('<div/>')
                .appendTo($container)
                .addClass('d-flex justify-content-between')
                .toggleClass('hide-for-phone-and-portrait', isPhone),  //Hide for phone portrait: See special version below

                elementList: function(){
                    var list = [];

                    //Left-side buttons
                    list.push( {ownContainer: true, class: 'd-flex flex-nowrap'} );
                    if (isDesktop)
                        list.push(
                            'time-mode',
                            {ownContainer: true, class: 'd-flex flex-nowrap'},
                            ['time-step-first', 'time-step-prev-ext', 'time-step-prev']
                        );
                    else
                        list.push(
                            ['time-mode', 'time-step-first', 'time-step-prev-ext', 'time-step-prev']
                        );

                    //Center content with relative,*current*,utc for mode = SCALE
                    if (isNotDesktop)
                        list.push({ownContainer: true, class: 'd-flex justify-content-center flex-grow-1'});

                    //mode = SCALE
                    list.push(
                        //Relative time
                        'relative-SCALE-min', 'relative-SCALE-mid', 'relative-SCALE-max',
                        //Current time
                        'current-SCALE-min', 'current-SCALE-mid', 'current-SCALE-max',

                    //mode = RELATIVE
                        //Current time
                        'current-RELATIVE-min', 'current-RELATIVE-mid', 'current-RELATIVE-max',
                        //Relative time
                        'relative-RELATIVE',

                    //mode = SCALE or RELATIVE
                        //Utc time
                        'utc-min', 'utc-mid', 'utc-max'
                    );

                    //Right-side buttons
                    if (isDesktop)
                        list.push(['time-step-next', 'time-step-next-ext', 'time-step-last']);

                    list.push({ownContainer: true, class: 'd-flex flex-nowrap'});

                    if (isNotDesktop)
                        list.push(['time-step-next', 'time-step-next-ext', 'time-step-last']);

                    list.push(['bms-extended', 'bms-extended2normal', 'bms-minimized2normal', 'bms-minimized']);

                    return list;
                }(),

            defaultGroups: {
                minimized: 'time-mode time-step-prev-next bms-minimized2normal',
                normal   : 'time-mode time-step-prev-next bms-extended',
                extended : 'time-mode time-step-prev-next bms-extended2normal',
            },

            prioList: {
                ALL: {
                    SCALE: [
                        //Relative time         Current time       UTC time  Buttons
                        '                       current-SCALE-min',
                        '                       current-SCALE-mid',
                        '                       current-SCALE-mid            time-step-ext',
                        'relative-SCALE-min     current-SCALE-mid  utc-min   time-step-ext',
                        'relative-SCALE-min     current-SCALE-mid  utc-min   time-step-ext time-step-first-last',
                        'relative-SCALE-min     current-SCALE-max  utc-min   time-step-ext time-step-first-last',
                        'relative-SCALE-mid     current-SCALE-max  utc-mid   time-step-ext time-step-first-last',
                        'relative-SCALE-max     current-SCALE-max  utc-max   time-step-ext time-step-first-last'
                    ],
                    RELATIVE: [
                        //Current time          Relative           UTC time  Buttons
                        '                       relative-RELATIVE',
                        '                       relative-RELATIVE            time-step-ext',
                        'current-RELATIVE-min   relative-RELATIVE  utc-min   time-step-ext',
                        'current-RELATIVE-min   relative-RELATIVE  utc-min   time-step-ext time-step-first-last',
                        'current-RELATIVE-mid   relative-RELATIVE  utc-mid   time-step-ext time-step-first-last',
                        'current-RELATIVE-max   relative-RELATIVE  utc-max   time-step-ext time-step-first-last',
                    ]
                }
            }
        });

        //PHONE-PORTRAIT: BMS=Minimized, Normal, or Extended
        if (isPhone){
            //1. row: Current or relative
            addElementSet({
                $container: $('<div/>')
                    .appendTo($container)
                    .addClass('d-flex justify-content-center')
                    .addClass('show-for-phone-and-portrait'),  //Show for phone portrait

                elementList: [
                    {ownContainer: true, class: 'd-flex flex-nowrap'},
                        'time-mode', 'time-step-first',

                    //Center content with *current* or *relative*
                    {ownContainer: true, class: 'd-flex justify-content-center flex-grow-1'},

                        //mode = SCALE: Current time
                        'current-SCALE-min', 'current-SCALE-mid', 'current-SCALE-max',

                        //mode = RELATIVE: Relative time
                        'relative-RELATIVE',

                    //Right-side buttons
                    {ownContainer: true, class: 'd-flex flex-nowrap'},
                        'time-step-last', 'bms-minimized2normal', 'bms-extended', 'bms-extended2normal'
                ],

                defaultGroups: {
                    minimized: 'time-mode time-step-first-last bms-minimized2normal',
                    normal   : 'time-mode time-step-first-last bms-extended',
                    extended : 'time-mode time-step-first-last bms-extended2normal',
                },

                prioList: {
                    ALL: {
                        SCALE   : ['current-SCALE-min', 'current-SCALE-mid', 'current-SCALE-max'],
                        RELATIVE: ['relative-RELATIVE']
                    }
                }
            });

            //**********************************************************************
            //2. row: RELTIVE: Current and utc, SCALE: Relative and utc
            addElementSet({
                $container: $('<div/>')
                    .appendTo($container)
                    .addClass('show-for-phone-and-portrait'),  //Show for phone portrait

                elementList: [
                    {ownContainer: true, class: 'd-flex flex-nowrap'},
                        'time-step-prev-ext', 'time-step-prev',

                    {ownContainer: true, class: 'd-flex justify-content-center flex-grow-1'},

                        //mode = SCALE: Relative time
                        'relative-SCALE-min-none', 'relative-SCALE-mid-none', 'relative-SCALE-max-none',

                        //mode = RELATIVE: Current time (always shown)
                        'current-RELATIVE-min', 'current-RELATIVE-mid', 'current-RELATIVE-max',

                        //mode = SCALE or RELATIVE: Utc time
                        'utc-min-none', 'utc-mid-none', 'utc-max-none',

                    {ownContainer: true, class: 'd-flex flex-nowrap'},
                        'time-step-next', 'time-step-next-ext',
                ],

                defaultGroups: 'time-step-ext time-step-prev-next',

                prioList: {
                    ALL: {
                        SCALE: [
                            //Relative time          UTC time
                            'relative-SCALE-min-none utc-min-none',
                            'relative-SCALE-mid-none utc-mid-none',
                            'relative-SCALE-max-none utc-max-none'
                        ],
                        RELATIVE: [
                            //Current time        UTC time
                            'current-RELATIVE-min utc-min-none',
                            'current-RELATIVE-mid utc-mid-none',
                            'current-RELATIVE-max utc-max-none',
                        ]
                    }
                }
            });

        }   //end of if (isPhone)

        /**************************************************************************
        DESKTOP, TABLE, PHONE: BMS=Normal
        Range and Time-slider
        **************************************************************************/
        addElementSet({
            $container: $('<div/>')
                .appendTo($container)
                .addClass('d-flex w-100')
                .addClass('show-for-bottom-menu-normal'),

            elementList: [
                'empty',

                {id: 'range-RELATIVE', ownContainer: true, class: 'd-flex flex-grow-1'},
                'range-SCALE',

                {id: 'bms-minimized', ownContainer: true}
            ]
        });

        /**************************************************************************
        DESKTOP, TABLE, PHONE: BMS=Extended
        Range and Time-slider
        **************************************************************************/
        addElementSet({
            $container: $('<div/>')
                .appendTo($container)
                    .addClass('d-flex w-100')
                    .addClass('show-for-bottom-menu-extended'),
            elementList: [
                //'empty',

                {id: 'time-slider-RELATIVE', class: 'd-flex flex-grow-1'},
                'time-slider-SCALE',

                //{id: 'empty', ownContainer: true},
            ]
        });


        /**************************************************************************
        ONLY PHONE: MINIMIZED and PORTRAIT - BOTH SCALE and RELATIVE mode
        **************************************************************************/

        /**************************************************************************
        NOT PHONE: EXTENDED: Footer
        **************************************************************************/
/* Skal nok ikke bruges...
        $('<div/>')
            .prependTo($container)
            ._bsAddBaseClassAndSize({baseClass: 'jb-header-container', useTouchSize: true})
            ._bsHeaderAndIcons({
                headerClassName: 'show-for-bottom-menu-extended',
                header: {
                    icon: 'fa-clock',
                    text: ''(?) Overskrift',
                },
                icons: {
                    diminish: { onClick: function(){ alert('dim'); }},
                    close   : { onClick: function(){ alert('close'); }}
                }

            });
*/
        if (!isPhone)
            $('<div/>')
                .appendTo($container)
                ._bsAddBaseClassAndSize({baseClass: 'jb-footer-content', useTouchSize: true})
                .addClass('show-for-bottom-menu-extended')
                ._bsAddHtml( ns.globalSettingFooter(ns.events.TIMEZONECHANGED, true) );


        //Clean up
        nsTime.elements = null;

        window.setTimeout( nsTime.bottomMenu_onResize, 200);
    }

    //********************************************************************************************
    nsMap.BOTTOM_MENU = {
        height         : 'auto',
        standardHandler: true,
        createContent  : creaetBottomMenu
    };

}(jQuery, L, this, document));
