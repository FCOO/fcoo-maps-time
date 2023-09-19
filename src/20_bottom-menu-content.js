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
//*/
        var isDesktop = ns.modernizrDevice.isDesktop,
            isNotDesktop = !isDesktop,
            isPhone = ns.modernizrDevice.isPhone;

        //Remove button for mode if only one mode
        if (nsTime.timeOptions.timeModeList.length == 1)
            elements['time-mode'] = elements['empty'];

        //Set events for resize and change relative time
        $container.resize( nsTime.bottomMenu_onResize );
        ns.events.on('TIMEMODECHANGED', nsTime.bottomMenu_onResize);

        //Add swip up and down to change the size off the bottom menu (bms = bottom-menu-size)
        $container.hammer();
        $container.on('swipeup', nsTime.incBMS);
        $container.on('swipedown', nsTime.decBMS);


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
                1. row: FIXED:Current, RELATIVE:Relative
                2. row: relative/current and utc time
                3. row: Buttons
            PHONE-PORTRAIT-EXTENDED:
                As PHONE-PORTRAIT-NORMAL +
                4. Time-slider
        **************************************************************************/
        //DESKTOP, TABLE, PHONE-LANDSCAPE: Buttons and current, relative and utc time
        addElementSet({
            $container:
                $('<div/>')
                .appendTo($container)
                .addClass('d-flex justify-content-between')
                .toggleClass('hide-for-phone-and-portrait-and-extended', isPhone),  //Hide for phone portrait extended: See special version below

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

                    //Center content with relative,*current*,utc for mode = FIXED
                    if (isNotDesktop)
                        list.push({ownContainer: true, class: 'd-flex justify-content-center flex-grow-1'});

                    //mode = FIXED
                    list.push(
                        //Relative time
                        'relative-FIXED-min', 'relative-FIXED-mid', 'relative-FIXED-max',
                        //Current time
                        'current-FIXED-min', 'current-FIXED-mid', 'current-FIXED-max',

                    //mode = RELATIVE
                        //Current time
                        'current-RELATIVE-min', 'current-RELATIVE-mid', 'current-RELATIVE-max',
                        //Relative time
                        'relative-RELATIVE',

                    //mode = FIXED or RELATIVE
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
                    FIXED: [
                        //Relative time         Current time       UTC time  Buttons
                        '                       current-FIXED-min',
                        '                       current-FIXED-mid',
                        '                       current-FIXED-mid            time-step-ext',
                        'relative-FIXED-min     current-FIXED-mid  utc-min   time-step-ext',
                        'relative-FIXED-min     current-FIXED-mid  utc-min   time-step-ext time-step-first-last',
                        'relative-FIXED-min     current-FIXED-max  utc-min   time-step-ext time-step-first-last',
                        'relative-FIXED-mid     current-FIXED-max  utc-mid   time-step-ext time-step-first-last',
                        'relative-FIXED-max     current-FIXED-max  utc-max   time-step-ext time-step-first-last'
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
                    .addClass('show-for-phone-and-portrait-and-extended'),  //Show for phone portrait extended

                elementList: [
                    {ownContainer: true, class: 'd-flex flex-nowrap'},
                        'time-mode', 'time-step-first',

                    //Center content with *current* or *relative*
                    {ownContainer: true, class: 'd-flex justify-content-center flex-grow-1'},

                        //mode = FIXED: Current time
                        'current-FIXED-min', 'current-FIXED-mid', 'current-FIXED-max',

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
                        FIXED   : ['current-FIXED-min', 'current-FIXED-mid', 'current-FIXED-max'],
                        RELATIVE: ['relative-RELATIVE']
                    }
                }
            });

            //**********************************************************************
            //2. row: RELTIVE: Current and utc, FIXED: Relative and utc
            addElementSet({
                $container: $('<div/>')
                    .appendTo($container)
                    .addClass('show-for-phone-and-portrait-and-extended'),  //Show for phone portrait extended

                elementList: [
                    {ownContainer: true, class: 'd-flex flex-nowrap'},
                        'time-step-prev-ext', 'time-step-prev',

                    {ownContainer: true, class: 'd-flex justify-content-center flex-grow-1'},

                        //mode = FIXED: Relative time
                        'relative-FIXED-min-none', 'relative-FIXED-mid-none', 'relative-FIXED-max-none',

                        //mode = RELATIVE: Current time (always shown)
                        'current-RELATIVE-min', 'current-RELATIVE-mid', 'current-RELATIVE-max',

                        //mode = FIXED or RELATIVE: Utc time
                        'utc-min-none', 'utc-mid-none', 'utc-max-none',

                    {ownContainer: true, class: 'd-flex flex-nowrap'},
                        'time-step-next', 'time-step-next-ext',
                ],

                defaultGroups: 'time-step-ext time-step-prev-next',

                prioList: {
                    ALL: {
                        FIXED: [
                            //Relative time          UTC time
                            'relative-FIXED-min-none utc-min-none',
                            'relative-FIXED-mid-none utc-mid-none',
                            'relative-FIXED-max-none utc-max-none'
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
        Time-sliders
        **************************************************************************/
        addElementSet({
            $container: $('<div/>')
                .appendTo($container)
                .addClass('d-flex w-100 align-items-end')
                .addClass('show-for-bottom-menu-normal'),

            elementList: [
               {id: 'empty', class:'d-flex'},

                {id: 'bms-normal-RELATIVE', ownContainer: true, class: 'd-flex flex-grow-1 overflow-hidden'},
                'bms-normal-FIXED',

                {id: 'bms-minimized', ownContainer: true}
            ]
        });

        /**************************************************************************
        DESKTOP, TABLE, PHONE: BMS=Extended
        Time-sliders
        **************************************************************************/
        addElementSet({
            $container: $('<div/>')
                .appendTo($container)
                    .addClass('d-flex w-100')
                    .addClass('show-for-bottom-menu-extended'),
            elementList: [
                {id: 'bms-extended-RELATIVE', class: 'd-flex flex-grow-1 overflow-hidden'},
                'bms-extended-FIXED',
            ]
        });


        /**************************************************************************
        ONLY PHONE: MINIMIZED and PORTRAIT - BOTH FIXED and RELATIVE mode
        **************************************************************************/

        /**************************************************************************
        NOT PHONE: EXTENDED: Footer
        **************************************************************************/
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
        isOpen         : false,
        createContent  : creaetBottomMenu
    };

	$(function() { nsMap.BOTTOM_MENU.isOpen = !window.bsIsTouch; });


}(jQuery, L, this, document));
