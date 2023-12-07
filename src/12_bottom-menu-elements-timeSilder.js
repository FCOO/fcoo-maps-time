/***********************************************************************************
bottom-menu-elements-timeSlider.js

Create the content for bottom-menu with different versions of time-slider

Both are TimeSlider (see jquery-time-slider)
There are created as-is - not as prototype

*************************************************************************************/
(function ($, moment, i18next, window, document/*, undefined*/) {

    "use strict";

    //Create namespaces
    var ns     = window.fcoo = window.fcoo || {},
        nsMap  = ns.map = ns.map || {},
        nsTime = nsMap.time = nsMap.time || {};

    //tsList = list of TimeSlider used
    nsTime.tsList = [];

    /************************************************
    Colors
    ************************************************/
    var documentElement = getComputedStyle(document.documentElement);
    function getColorValue(varName){
        return documentElement.getPropertyValue('--' + varName);
    }
    //Colors for past, now and future
    nsTime.pastColor        = 'var(--jbn-time-past-color)';
    nsTime.pastColorValue   = getColorValue('jbn-time-past-color');

    nsTime.nowColor         = 'var(--jbn-time-now-color)';
    nsTime.nowColorValue    = getColorValue('jbn-time-now-color');

    nsTime.futureColor      = 'var(--jbn-time-future-color)';
    nsTime.futureColorValue = getColorValue('jbn-time-future-color');

    /************************************************
    TimeSlider options
    Options for the differnet types of time-slider, and
    options for time-slider in different bms

    Some of the options are given by the min and max range given in
    nsTime.timeOptions.timeModeOptions[timeMode]
    These values are set as string "{min}" and "{max} and replaced
    during creation

    In mode=FIXED The time-sliders in normal and extended mode can also
    show the time i UTC and relative.
    This is controlled by allowUTC_bmsNormal, allowUTC_bmsExtended, allowRel_bmsNormal, allowRel_bmsExtended and
    is only allowed for different type of devices:
        ns.modernizrDevice.isDesktop
        ns.modernizrDevice.isTablet
        ns.modernizrDevice.isPhone
    ************************************************/
    var isDesktop   = ns.modernizrDevice.isDesktop, //Only Desktop
        isNotPhone  = !ns.modernizrDevice.isPhone,  //Tablet or Desktop

        allowRel_bmsNormal      = isNotPhone,
        allowUTC_bmsNormal      = isDesktop,

        allowRel_bmsExtended    = true,
        allowUTC_bmsExtended    = true,
        bigger_bmsExtendedFIXED = allowUTC_bmsExtended && isDesktop;


    var timeSliderOptions = {},
        timeSliderHeight = {
            'DEFAULT' : {
                'bms-normal'    : '2em',
                'bms-extended'  : '3em'
            },
            'RELATIVE': {
                'bms-normal'    : '1.85em',
                'bms-extended'  : '3.30em'
            },
            'FIXED': {
                'bms-normal'    : allowUTC_bmsNormal  ? '4.30em' : //Current, Rel and UTC
                                  (allowRel_bmsNormal ? '3.10em' : //Current and Rel
                                                        '1.80em'), //Current
                'bms-extended'  : allowUTC_bmsExtended ? (bigger_bmsExtendedFIXED ? '5.75em' : '4.30em') : '3em'
            }
        };


    /*************************************
    ALL = for all time-sliders
    *************************************/
    function timeSlider_onChange( timeSlider ){
        nsTime.getCurrentTimeModeData().set( timeSlider.value );
    }

    timeSliderOptions['ALL'] = {
        onChangeOnDragging  : true,
        onChange            : timeSlider_onChange,
        useParentWidth      : true,
        showFromTo          : false,
        mousewheel          : true,

        grid                : true,
        resizable           : true,

        handleFixed   : true,
        handle        : "fixed",
        valueDistances: 16, //or 16 or 18 or 20 MANGLER

        //Font for labels
        size: {
            fontSize  : 11,
            fontFamily: 'Verdana',
            fontWeight: 'lighter'
        },

        //Default: No line
        showLine      : false,
        showLineColor : false,

        //Green label on 'now'
        labelColors: [{
            value          : 0,
            backgroundColor: nsTime.nowColorValue,
            color          : window.chromaBestContrast(nsTime.nowColorValue)
        }],
    },

    //bms = Normal
    timeSliderOptions['bms-normal'] = {
        ticksOnLine: true,
    };

    //bms = Extended
    timeSliderOptions['bms-extended'] = {
    };

    /*************************************
    time-mode = RELATIVE
    *************************************/
    timeSliderOptions['RELATIVE'] = {
        format      : {
            showRelative: true
        },
        min         : '{min}',
        max         : '{max}',
        step        : 1,

        lineColors   : [
            { to: 0, color: nsTime.pastColor  },
            {        color: nsTime.futureColor}
        ],

        gridColors   : [
            {              value: 0,       color: nsTime.pastColor  },
            {fromValue: 0, value: '{max}', color: nsTime.futureColor}
        ]

    };


    //Mode=RELATIVE, bms=Normal
    timeSliderOptions['bms-normal-RELATIVE'] = {
        valueDistances: 20, //MANGLER
    };

    //Mode=RELATIVE, bms=Extended
    timeSliderOptions['bms-extended-RELATIVE'] = {
        handle        : 'down',
        valueDistances: 24,
        showLineColor: false,
    };




    /*************************************
    time-mode = FIXED
    *************************************/
    timeSliderOptions['FIXED'] = {
        min          : '{min}',
        max          : '{max}',
        step         : 1,
        value        : 0,

        showLineColor: false,
        ticksOnLine  : true,

        noDateLabels  : true,
        dateAtMidnight: true,



        //showUTC                : When true a scale for utc is also shown, but only if the time-zone isn't utc or forceUTC is set. Default = false. Only if showRelative == false
        forceUTC                 : true,  //If true and showUTC: true the utc-scale is included
        noGridColorsOnUTC        : true,  //If true the UTC-grid will not get any grid colors
        noExtendedGridColorsOnUTC: true,  //If true the UTC-grid will not get any extended grid colors
        noLabelColorsOnUTC       : false, //If true the UTC-grid will not get any labels with colors
        UTCGridClassName         : 'hide-for-global-setting-timezone-utc show-for-global-setting-showutc', //Class-name(s) for the grids use for UTC time-lime

        //showExtraRelative                 : If true and showRelative = false => A relative scale is included
        noGridColorsOnExtraRelative         : true, // If true the extra relative-grid will not get any grid colors
        noExtendedGridColorsOnExtraRelative : true, //If true the extra relative-grid will not get any extended grid colors
        noLabelColorsOnExtraRelative        : true, // If true the extra relative-grid will not get any labels with colors
        extraRelativeGridClassName          : 'show-for-global-setting-showrelative', // Class-name(s) for the grids use for the extra relative grid

        gridColors: [
            {              value: 0      , color: nsTime.pastColor  },
            {fromValue: 0, value: '{max}', color: nsTime.futureColor}
        ],

      //valueDistances: 16, MANGLER
    };

    //Mode=FIXED, bms=Normal
    timeSliderOptions['bms-normal-FIXED'] = {
        showExtraRelative   : allowRel_bmsNormal,
        showUTC             : allowUTC_bmsNormal

      //valueDistances: 16, MANGLER
    };

    //Mode=FIXED, bms=Extended
    timeSliderOptions['bms-extended-FIXED'] = {
        noDateLabels  : !bigger_bmsExtendedFIXED,
        dateAtMidnight: !bigger_bmsExtendedFIXED,

        showExtraRelative   : allowRel_bmsExtended,
        showUTC             : allowUTC_bmsExtended,

      //valueDistances: 16, MANGLER

    };



    /**********************************************************************
    createTimeSlider($container, elementSet, element){
    **********************************************************************/
    function createTimeSlider($container, elementSet, element){
        let type            = element.type,
            tsOptions       = element.tsOptions,
            timeMode        = tsOptions.timeMode,
            timeModeOptions = nsTime.timeOptions.timeModeOptions[timeMode];

        //Replace "{min}" and "{max}" in tsOptions with the loaded values
        function replaceMinMax( opt ){
            $.each( opt, (id, value) => {
                if (value === '{min}')
                    opt[id] = timeModeOptions.min;
                else
                    if (value === '{max}')
                        opt[id] = timeModeOptions.max;
                    else
                        if ($.isPlainObject(value) || Array.isArray(value))
                            replaceMinMax(value);
            });
        }

        replaceMinMax( tsOptions );

        var heights = (timeSliderHeight[timeMode] || timeSliderHeight['DEFAULT']);
        var $result = $('<div/>')
                .addClass('d-block justify-content-center align-items-center w-100')
                .height(heights[type]);

        var $sliderInput = $('<input/>').appendTo( $result ),
            timeSlider = $sliderInput.timeSlider( element.tsOptions ).data('timeSlider');
         nsTime.tsList.push(timeSlider);
        return $result;
    }


    /**********************************************************************
    Create the different time-sliders
    **********************************************************************/
    nsTime.onSetupLoaded.push(function(){
        ['bms-normal', 'bms-extended'].forEach( function(type){
            nsTime.timeOptions.timeModeList.forEach( function(timeMode){
                let tsOptions = $.extend({
                            timeMode: timeMode,
                        },
                        timeSliderOptions['ALL'] || {},
                        timeSliderOptions[timeMode] || {},
                        timeSliderOptions[type]  || {},
                        timeSliderOptions[type+'-'+timeMode] || {}
                    );

                nsTime.elements[type+'-'+timeMode] = {
                    class    : 'show-for-time-mode-'+timeMode,
                    content  : createTimeSlider,
                    tsOptions: tsOptions,
                    type     : type
                };
            });
        });
    });

//range.css = background: linear-gradient(to right, lightgreen 25%, darkgreen 25%, darkgreen 50%, red 50%);


}(jQuery, window.moment, window.i18next, this, document));
