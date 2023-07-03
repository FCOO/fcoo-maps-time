/***********************************************************************************
bottom-menu-elements-timeSlider.js

Create the content for bottom-menu with range and time-slider

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
    var tsList = [];


// HER>     //Add bottomMenuSize to application-settings
// HER>     var bottomMenuSizes = nsTime.bottomMenuSizes = ['minimized', 'normal', 'extended'];




    /************************************************
    Colors
    ************************************************/
    var documentElement = getComputedStyle(document.documentElement);
    function getColor(varName){
        return documentElement.getPropertyValue('--' + varName);
    }

    //Colors for past, now and future
    var pastColor     = getColor('jbn-time-past-color'),
        pastBgColor   = getColor('jbn-time-past-bg-color'),
        nowColor      = getColor('jbn-time-now-color'),
        nowBgColor    = getColor('jbn-time-now-bg-color'),
        futureColor   = getColor('jbn-time-future-color'),
        futureBgColor = getColor('jbn-time-future-bg-color');


    /************************************************
    Global events: Change format and application ready
    ************************************************/
    //timeSlider_globalEvents = list of names of global events where the slider is updated/redrawn
    //Relevant global events = LANGUAGECHANGED,  DATETIMEFORMATCHANGED, TIMEZONECHANGED, TIMEMODECHANGED, CREATEAPPLICATIONFINALLY
    //In fcoo-moment event DATETIMEFORMATCHANGED are also fired when the language or the time zone is changed => only needs to listen for DATETIMEFORMATCHANGED
    var timeSlider_globalEvents = {
            'RELATIVE': [ns.events.LANGUAGECHANGED,                                  ns.events.TIMEMODECHANGED],
            'SCALE'   : [                           ns.events.DATETIMEFORMATCHANGED, ns.events.TIMEMODECHANGED]
        };


    var ready = false;

    function updateTimeSliders(event = ns.events.CREATEAPPLICATIONFINALLY){
        if (!ready) return;
        tsList.forEach(timeSlider => {
            //If the time-slider is vissible in current mode and need updating for the event => update it
            if ( timeSlider_globalEvents[timeSlider.options.timeMode].includes(event) && (timeSlider.options.timeMode == nsTime.timeMode) ){
                timeSlider.setFormat();
            }
        });
    }

    //Add update to global events
    ns.events.eventNames.forEach( event => {
        let added = false;
        $.each(timeSlider_globalEvents, (timeMode, eventList) => {
            if (eventList.includes(event) && !added){
                ns.events.on(event, updateTimeSliders.bind(null, event));
                added = true;
            }
        });
    });

    //Update all sliders when application is loaded/ready
    ns.events.on(ns.events.CREATEAPPLICATIONFINALLY, function(){
        ready = true;
        updateTimeSliders(ns.events.CREATEAPPLICATIONFINALLY);
    });




    /************************************************
    Global events: when "NOW" or current time changes - MANGLER
    ************************************************/
    //Add events to update sliders when "NOW" or current time changes - MANGLER
//NOWMOMENTCHANGED
//CURRENTMOMENTCHANGED
//CURRENTRELATIVECHANGED






    /************************************************
    TimeSlider options
    Options for the differnet types of time-slider
    Some of the options are given by the min and max range given in
    nsTime.timeOptions.timeModeOptions[timeMode]
    These values are set as string "{min}" and "{max} and replaced
    during creation
    ************************************************/
    var timeSliderOptions = {},
        timeSliderHeight = {
            'range'      : '2em',
            'time-slider': '6em'

        };


    //range: bms = normal
    timeSliderOptions['range'] = {
        ticksOnLine: true,
        showFromTo : false
    };

    //time-slider = bms = extended
    timeSliderOptions['time-slider'] = {

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
        grid        : true,
        mousewheel  : true,
        resizable   : true,

        lineColors   : [
            { to: 0, color: pastBgColor  },
            {        color: futureBgColor}
        ],

        labelColors: [{
            value          : 0,
            backgroundColor: nowBgColor,
            color          : nowColor
        }],
    };


    //Extended version of relative time-slider
    timeSliderOptions['time-slider-RELATIVE'] = {
        showLineColor: false,
        lineColors   : false,
        gridColors   : [
            {              value: 0,       color: pastBgColor  },
            {fromValue: 0, value: '{max}', color: futureBgColor}
        ]
    };


    //Set slider for relative time-slider
    timeSliderOptions['range-RELATIVE'] = {
        handle: 'vertical'
    };


    /*************************************
    time-mode = SCALE
    *************************************/
    timeSliderOptions['SCALE'] = {
        min          : '{min}',
        max          : '{max}',
        step         : 1,
        value        : 0,
        grid         : true,
//MANGLER

        handleFixed  : true,

        handle       : "fixed",

valueDistances: 400,
width: 4000,

        mousewheel   : true,

        showLineColor: false,
        resizable    : false, //true,
        ticksOnLine  : true,

        gridColors: [
            {              value: 0      , color: pastBgColor  },
            {fromValue: 0, value: '{max}', color: futureBgColor}
        ],

        labelColors: [{
            value          : 0,
            backgroundColor: nowBgColor,
            color          : nowColor
        }],
    };

    //Extended version of range scale time-slider
    timeSliderOptions['range-SCALE'] = {
        noDateLabels    : true,
        dateAtMidnight  : true
    }


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

        var $result = $('<div/>')
                .addClass('d-flex justify-content-center align-items-center w-100')
                .height(timeSliderHeight[type]);

        var $sliderInput = $('<input/>').appendTo( $result ),
            timeSlider = $sliderInput.timeSlider( element.tsOptions ).data('timeSlider');
         tsList.push(timeSlider);

        return $result;
    }


    /**********************************************************************
    Create the different time-sliders
    **********************************************************************/
    ['range', 'time-slider'].forEach( function(type){
        ['SCALE', 'RELATIVE'].forEach( function(timeMode){
            let tsOptions = $.extend(
                    {timeMode: timeMode},

{
    onChangeOnDragging: true,
    onChange: function(timeSlider){
        //console.log('onChange', timeSlider.value);
    }
},


                    timeSliderOptions[timeMode] || {},
                    timeSliderOptions[type]  || {},
                    timeSliderOptions[type+'-'+timeMode] || {}
                );

            nsTime.elements[type+'-'+timeMode] = {
                class    : 'show-for-time-mode-'+timeMode,
                content  : createTimeSlider,
                tsOptions: tsOptions,
                type     : type
            }
        });
    });

    //**********************************************************************
    //**********************************************************************
    //**********************************************************************
    //**********************************************************************

return;
/*
    elements['range-RELATIVE'] = {
        class: 'w-100 show-for-time-mode-RELATIVE',
//        fullWidth: true,


        content: function($container, elementSet, element ){

return $('<div/>').text('range RELATIVE')
//                .addClass('d-flex flew-grow-1 w-100')

// HER>                 .append(
// HER>                     $('<input type="range"/>')
// HER>                         .addClass('w-100')
// HER>                 )
        }
    }

    elements['range-SCALE'] = {
        class: 'w-100 show-for-time-mode-SCALE',
//        fullWidth: true,


        content: function($container, elementSet, element ){
            console.log('>>>>', $container, elementSet, element );

return $('<div/>').text('range SCALE')
//                .addClass('d-flex flew-grow-1 w-100')

// HER>                 .append(
// HER>                     $('<input type="range"/>')
// HER>                         .addClass('w-100')
// HER>                 )
        }
    }




        //Create the time-slider
//        elements['time-slider-SCALE'] = $('<div style="height:100px">time slider</div>')
        elements['time-slider-RELATIVE'] = {
            class: 'w-100 show-for-time-mode-RELATIVE',
            ownContainer: true,
            content: function($container, elementSet, element ){
            console.log('>>>>', $container, elementSet, element );
var $result = $('<div/>')
        .addClass('d-flex justify-content-center align-items-center w-100')
        .height('6em');


var $sliderInput     = $('<input/>').appendTo( $result );

            //
            var timeSliderOptions = {
                    type   : 'single',
// HER>                     display: { value: { tzElement: ('#currentMomentLocal'), utcElement: $('#currentMomentUTC') } },
// HER>                     buttons: { value: { firstBtn:'tsFirst', previousBtn:'tsPrev', nowBtn:'tsNow', nextBtn:'tsNext', lastBtn:'tsLast'} },

                    markerFrame: true,

// HER>                     minMoment  : -24,   //this.options.minMoment,
// HER>                     maxMoment  : 48,    //this.options.maxMoment,
// HER>                     fromMoment : this.options.fromMoment,
// HER>                     toMoment   : this.options.toMoment,
// HER>                     valueMoment: 0, //this.options.valueMoment,

                    min  : -24,     //this.options.min,
                    max  : 48,      //this.options.max,
// HER>                     from : this.options.from,
// HER>                     to   : this.options.to,
                    value: 0,       //this.options.value,

                    step            : 1,    //this.options.step,
// HER>                     stepOffset      : this.options.stepOffset,
// HER>                     stepOffsetMoment: this.options.stepOffsetMoment,

                    onChangeOnDragging: false,
                    showLineColor     : false,
                    lineColors        : [{ to: 0, color: '#7ABAE1'}, {color:'#4D72B8'}],

                    labelColors       : [{value:0, backgroundColor:'green', color:'white'}],

                    format: {date: 'DMY', time: '24', showRelative: false, timezone: 'local', showUTC: false },

// HER>                     onChange: this.options.onChange || this.options.callback
            };

var timeSlider = $sliderInput.timeSlider( timeSliderOptions ).data('timeSlider');
timeSlider.setFormat();
console.log('timeSlider', timeSlider);

    return $result;
}
}
/*
    elements['time-slider'] = $('<div/>')
        .addClass('d-flex justify-content-center align-items-center w-100')
        .height('6em')
        ._bsAppendContent({
                type: 'timeSlider',
            //type: "double",
                _format: {
                    showRelative:false,
                    showUTC: true,
                    showYear: true
                },
                min: 0,
                max: 120*24,
                step: 1,
                value: 0,
                grid: true,
                handleFixed: true,
                slider:"fixed",
                mousewheel: true,
                width: 120*400,
                showLineColor: false,
                resizable: true,
ticksOnLine: true,
/*
                gridColors: [{value: 0, color: 'red'}, {fromValue: 0, value: 24*7, color: 'rgba(0,0,255, .5)'}],
                labelColors: [
                    {value: 0, color:'white', backgroundColor: 'green' },
                    {value: 2, color:'white', backgroundColor: 'red' }
                ],
            });

*/
/*
    var $input = $('<input type="text" id="example_00"/>')
            .appendTo(elements['time-slider'])
            .timeSlider({
            //type: "double",
                _format: {
                    showRelative:false,
                    showUTC: true,
                    showYear: true
                },
                min: 0,
                max: 120*24,
                step: 1,
                value: 0,
                grid: true,
                handleFixed: true,
                slider:"fixed",
                mousewheel: true,
                width: 120*400,
                showLineColor: false,
                resizable: true,
ticksOnLine: true,
/*
                gridColors: [{value: 0, color: 'red'}, {fromValue: 0, value: 24*7, color: 'rgba(0,0,255, .5)'}],
                labelColors: [
                    {value: 0, color:'white', backgroundColor: 'green' },
                    {value: 2, color:'white', backgroundColor: 'red' }
                ],
*//*
            })
            .data('timeSlider');
*/

//HER HER HER HER HER HER HER HER HER HER
//range.css = background: linear-gradient(to right, lightgreen 25%, darkgreen 25%, darkgreen 50%, red 50%);
//HER HER HER HER HER HER HER HER HER HER


}(jQuery, window.moment, window.i18next, this, document));
