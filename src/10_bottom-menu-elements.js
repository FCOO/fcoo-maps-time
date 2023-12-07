/***********************************************************************************
bottom-menu-elements.js

Create the content for bottom-menu with buttons, slider, info etc. for selected time
bms = bottom-menu-size
*************************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};


    //bottomMenuSizeList = list of avaiable size of bottom-menu content
    nsTime.bottomMenuSizeList = ['minimized', 'normal', 'extended'];

    /**************************************************************************
    The content of the bottom-menu contains of buttons, boxes with info on current time an sliders
    This are all referred to as an element and a prototype is created in elements = [ID]$-element
    All elements are divided into groups to control witch element to show when
    **************************************************************************/
    var elements = nsTime.elements = {};

    nsTime.elementGroup = {}; //[ELEMENT-ID]GROUP-ID

    function setGroup(id, groupId = id){
        elements[id].addClass('group-'+groupId);
        nsTime.elementGroup[id] = groupId;
    }

    /******************************************************************
    timeModeData_setDelta(delta)
    Add delta unit to the 'current time' in the current time-mode-data
    ******************************************************************/
    function timeModeData_setDelta( delta ){
        nsTime.getCurrentTimeModeData().setDelta( delta );
    }


    //Create all buttons to change size of the bottom menu bms = bottom-menu-size
    var bmsButtons = {
            'bms-extended'          : {icon: 'fal fa-chevron-circle-up'  , size: 'extended'},
            'bms-minimized'         : {icon: 'fal fa-chevron-circle-down', size: 'minimized'},
            'bms-minimized2normal'  : {icon: 'fal fa-chevron-circle-up'  , size: 'normal'},
            'bms-extended2normal'   : {icon: 'fal fa-chevron-circle-down', size: 'normal'},
        };
    $.each( bmsButtons, function(id, options ){
        const bottomMenuSizeIndex = nsTime.bottomMenuSizeList.indexOf( options.size );
        elements[id] =
            $.bsButton({
                square  : true,
                icon    : options.icon,
                bigIcon : true,
                onClick: function(){
                    ns.appSetting.set('bottom-menu-size', bottomMenuSizeIndex);
                }
            });
        setGroup(id);
    });

    //Create all navigation-buttons = changing current or relative time
    var naviButtons = {
            'time-step-first'       : {icon: 'fa-arrow-to-left',         group: 'time-step-first-last', diff: -99999},
            'time-step-prev-ext'    : {icon: 'fa-angle-double-left',     group: 'time-step-ext',        diff: -6    , auto: true},
            'time-step-prev'        : {icon: 'fa-angle-left',            group: 'time-step-prev-next',  diff: -1    , auto: true},
            'time-step-next'        : {icon: 'fa-angle-right',           group: 'time-step-prev-next',  diff: +1    , auto: true},
            'time-step-next-ext'    : {icon: 'fa-angle-double-right',    group: 'time-step-ext',        diff: +6    , auto: true},
            'time-step-last'        : {icon: 'fa-arrow-to-right',        group: 'time-step-first-last', diff: +99999}
        };
    $.each( naviButtons, function(id, options ){
        elements[id] =
            $.bsButton({
                square  : true,
                icon    : options.icon,
                bigIcon : true,
                onClick: function(){ timeModeData_setDelta( options.diff ); }
            });

        //Add class btn-time-step-forward or btn-time-step-backward
        elements[id].addClass(options.diff > 0 ? 'btn-time-step-forward' : 'btn-time-step-backward');

        //Add auto-click-while-pressed
        if (options.auto)
            elements[id].autoclickWhilePressed();

        setGroup(id, options.group);
    });

    //Create "empty" to
    elements['empty'] = $('<div/>').addClass( 'btn-shadow flex-shrink-0 ' + $._bsGetSizeClass({baseClass: 'btn-shadow', useTouchSize: true}));
    setGroup('empty');

    //Create extended version of nav-buttons
    $.each( naviButtons, function(id, options ){
        if (Math.abs(options.diff) < 48){
            var newId = id+'-lg',
                newGroup = options.group + '-lg',
                plus = options.diff >= 0,
                absDiff = Math.abs(options.diff);

            elements[newId] =
                $.bsButton({
                    //square  : true,
                    icon    : plus ? 'fa-angle-right' : 'fa-angle-left',
                    text    : absDiff,
                    //bigIcon : true,
                    onClick: function(){ timeModeData_setDelta( options.diff ); }
                })
                    .width('3em');
            setGroup(newId, newGroup);
        }
    });

    //Create button to select time-mode (fixed, relative etc.)
    elements['time-mode'] =
        $.bsButton({
            square : true,
            icon   : ns.settingIcon('fa-clock-eight'),
            bigIcon: true,
            onClick: nsTime.selectTimeMode
        });
    setGroup('time-mode');


    /**************************************************************************
    Create prototype elements to display selected time
    Eq. time, relative time, date, utc etc.
    options = {
        group    : STRING
        relative : BOOLEAN
        bold     : BOOLEAN
        italic   : BOOLEAN
        class    : STRING
        onClick  : FUNCTION
        vfFormat : STRING
        vfOptions: OBJECT
        on       : {EVENT: FUNCTION}
    }
    **************************************************************************/
    function createPrototype( id, options = {}){
        var buttonOptions = {
                noShadow   : true,
                transparent: !options.onClick,
                onClick    : options.onClick,
                class      : 'text-center'
            };

        var $result = $.bsButton(buttonOptions);

        if (options.vfFormat)
            $result.vfFormat(options.vfFormat);
        if (options.vfOptions)
            $result.vfOptions(options.vfOptions);

        $result
            .toggleClass('disabled show-as-normal', !options.onClick && !options.on)
            .toggleClass('is-current-moment', !options.relative)
            .toggleClass('is-current-relative', !!options.relative)
            .toggleClass('font-weight-bold', !!options.bold)
            .toggleClass('fst-italic', !!options.italic)
            .addClass( options.class || options.className || '');

        if (options.width)
            $result.width(options.width);

        $.each(options.on || {}, function(event, func){
            $result.on(event, func);
        });
        elements[id] = $result;
    }
    //**************************************************************************


    /**************************************************************************
    Create all the different element-prototype for current time, utc time, and relative
    **************************************************************************/
    //CURRENT TIME
    //time = 12:00 currentTime
    createPrototype( 'time', {
        vfFormat: 'time',
        width   : '5em'
    });

    //time_sup = 12:00+1
    createPrototype( 'time_sup', {
        vfFormat: 'time_now_sup',
        width   : '6em',
    });

    //time_utc = 12:00 currentTime as utc
    createPrototype( 'time_utc', {
        vfFormat : 'time_utc',
        width    : '5em',
        italic   : true
    });

    //time_utc_sup = 12:00+1 utc
    createPrototype( 'time_utc_sup', {
        vfFormat : 'time_utc_sup',
        width    : '6em',
        italic   : true
    });

    //date = 12. May (no year)
    createPrototype( 'date', {
        vfFormat : 'date_format',
        vfOptions: {
            dateFormat: {weekday: 'None',  month: 'Short',  year: 'None' }
        },
        width   : '5em',
    });

    //date_full = 12. May 2022
    createPrototype( 'date_full', {
        vfFormat: 'date',
        width   : '7em',
    });

    //date_time = 12. May 12:00am
    createPrototype( 'date_time', {
        vfFormat : 'datetime_format',
        vfOptions: {
            dateFormat: {weekday: 'None',  month: 'Short',  year: 'None' }
        },
        width    : '9em',
    });

    //date_time_full = 12. May 2022 12:00am
    createPrototype( 'date_time_full', {
        vfFormat : 'datetime',
        width    : '11em',
    });

    //UTC
    //date_utc = utc 12. May (no year)
    createPrototype( 'date_utc', {
        vfFormat : 'date_utc',
        vfOptions: {
            dateFormat: {weekday: 'None',  month: 'Short',  year: 'None' }
        },
        width    : '5em',
        italic   : true
    });

    //date_utc_full = utc 12. May 2022
    createPrototype( 'date_utc_full', {
        vfFormat : 'date_utc',
        width    : '7em',
        italic   : true
    });

    //date_time_utc = utc 12. May 12:00am
    createPrototype( 'date_time_utc', {
        vfFormat : 'datetime_format_utc',
        vfOptions: {
            dateFormat: {weekday: 'None',  month: 'Short',  year: 'None' }
        },
        width    : '9em',
        italic   : true
    });

    //date_time_utc_full = utc 12. May 2022 12:00am
    createPrototype( 'date_time_utc_full', {
        vfFormat : 'datetime_utc',
        width    : '11em',
        italic   : true
    });


    //Relative time
    createPrototype( 'relative', {
        vfFormat: 'relative_dh',
        width   : '7em',
    });


    /**************************************************************************
    Create specific elements (one or more standard elements)
    For both current time and utc time tree versions - min, mid, and max - with different width are created
    Each version is in a dedicated group:
    current-min, current-mid, current-max, utc-min, utc-mid, utc-max
    Depending of the current width avaiable the different groups are shown/hidden
    **************************************************************************/
    var on = {
            click: function(){ nsTime.getCurrentTimeModeData().set(0); }
        };

    //** CURRENT TIME **
    //min = 12:00am+1, mid = 18. May + 12.00am, max = 18. May 2022 + 12.00am

    //Current when mode = FIXED
    var currentClass = 'border-color-as-time font-weight-bold';
    elements['current-FIXED-min'] = {id: 'time_sup',          class: currentClass, on: on, slider: 'FIXED' };
    elements['current-FIXED-mid'] = {id: 'date_time',         class: currentClass, on: on, slider: 'FIXED' };
    elements['current-FIXED-max'] = {id: 'date_time_full',    class: currentClass, on: on, slider: 'FIXED' };

    //Current when mode = RELATIVE
    currentClass = '';
    elements['current-RELATIVE-min'] = {id: 'time_sup',       class: currentClass };
    elements['current-RELATIVE-mid'] = {id: 'date_time',      class: currentClass };
    elements['current-RELATIVE-max'] = {id: 'date_time_full', class: currentClass };

    //** UTC **
    //min = 12:00am+1, mid = 18. May 12.00am, max = 18. May 2022 12.00am
    var utcClassName = "hide-for-global-setting-timezone-utc-visibility show-for-global-setting-showutc-visibility";
    elements['utc-min'] = {id: 'time_utc_sup'      , class: utcClassName};
    elements['utc-mid'] = {id: 'date_time_utc'     , class: utcClassName};
    elements['utc-max'] = {id: 'date_time_utc_full', class: utcClassName};

    //utc-SIZE-none = utc-SIZE but with display:none when not-visible
    utcClassName = "hide-for-global-setting-timezone-utc show-for-global-setting-showutc";
    elements['utc-min-none'] = {id: 'time_utc_sup'      , class: utcClassName};
    elements['utc-mid-none'] = {id: 'date_time_utc'     , class: utcClassName};
    elements['utc-max-none'] = {id: 'date_time_utc_full', class: utcClassName};


    //*  RELATIVE TIME **
    //Relative when mode = FIXED
    var relativeClass = 'is-current-relative text-capitalize show-for-global-setting-showrelative-visibility';
    elements['relative-FIXED']     = {id:'relative',                class: relativeClass };
    //Special version with other widths
    elements['relative-FIXED-min'] = {id:'relative', width:  '7em', class: relativeClass };
    elements['relative-FIXED-mid'] = {id:'relative', width:  '8em', class: relativeClass };
    elements['relative-FIXED-max'] = {id:'relative', width: '10em', class: relativeClass };

    //relative-FIXED-SIZE-none = relative-FIXED-SIZE but with display:none when not-visible
    relativeClass = 'is-current-relative text-capitalize show-for-global-setting-showrelative';
    elements['relative-FIXED-none']     = {id:'relative',                class: relativeClass };
    //Special version with other widths
    elements['relative-FIXED-min-none'] = {id:'relative', width:  '7em', class: relativeClass };
    elements['relative-FIXED-mid-none'] = {id:'relative', width:  '8em', class: relativeClass };
    elements['relative-FIXED-max-none'] = {id:'relative', width: '10em', class: relativeClass };

    //Relative when mode = RELATIVE
    relativeClass = 'is-current-relative text-capitalize border-color-as-time font-weight-bold';
    elements['relative-RELATIVE']     = {id:'relative',                class: relativeClass, on: on, slider: 'RELATIVE' };
    elements['relative-RELATIVE-min'] = {id:'relative', width:  '7em', class: relativeClass, on: on, slider: 'RELATIVE' };
    elements['relative-RELATIVE-mid'] = {id:'relative', width:  '8em', class: relativeClass, on: on, slider: 'RELATIVE' };
    elements['relative-RELATIVE-max'] = {id:'relative', width: '10em', class: relativeClass, on: on, slider: 'RELATIVE' };

}(jQuery, L, this, document));
