/****************************************************************************
time-range

The range of time for an application is set and managed by global data and methods


****************************************************************************/
(function ($, L, moment, i18next, window, document, undefined) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};





    /***************************************
    nsTime.applicationTimeRange
    Contains info about the application time-range
    "current" mean for the current selected time mode
    {
        currentMin      : NUMBER = The current relative min time-stamp
        currentMax      : NUMBER = The current relative max time-stamp
        currentMinMoment: MOMENT = The current min time-stamp (Moment)
        currentMaxMoment: MOMENT = The current max time-stamp (Moment)

        min      : NUMBER = The posible relative min time-stamp
        max      : NUMBER = The posible relative max time-stamp
        minMoment: MOMENT = The posible min time-stamp (Moment)
        maxMoment: MOMENT = The posible max time-stamp (Moment)
    }
    ***************************************/
    nsTime.applicationTimeRange = {};



    /***************************************
    UpdateApplcationTimeRange
    ***************************************/
    let updateApplcationTimeRange = function(){
        let mode            = nsTime.timeMode,
            timeOptions     = nsTime.timeOptions,
            timeModeOptions = timeOptions.timeModeOptions ? timeOptions.timeModeOptions[mode] || {} : {},
            atr             = nsTime.applicationTimeRange = nsTime.applicationTimeRange || {};

        atr.min = timeOptions.min;
        atr.max = timeOptions.max;

        atr.currentMin = timeModeOptions.min !== undefined ? timeModeOptions.min : atr.min;
        atr.currentMax = timeModeOptions.max !== undefined ? timeModeOptions.max : atr.max;

        atr.newMoment = nsTime.nowMoment;

        ['min', 'max', 'currentMin', 'currentMax'].forEach( id => {
            atr[id+'Moment'] = nsTime.nowMoment.clone().add( atr[id], nsTime.unit);
        });

        //Fire global event 'TIMERANGECHANGED'
        ns.events.fire(ns.events.TIMERANGECHANGED, atr);
    };



    nsTime.onSetupLoaded.push( updateApplcationTimeRange );
    ns.events.on( ns.events.TIMENOWCHANGED,  updateApplcationTimeRange );
    ns.events.on( ns.events.TIMEMODECHANGED, updateApplcationTimeRange );



}(jQuery, L, window.moment, window.i18next, this, document));




