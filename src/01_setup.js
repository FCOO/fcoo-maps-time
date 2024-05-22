/****************************************************************************
setup.js
****************************************************************************/
(function ($, L, moment, i18next, window, document, undefined) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};

    nsTime.unit = 'hour';

    /***************************************
    TIMEMODECHANGED EVENTS
    Global event fired when the time mode is changed
    ***************************************/
    var TIMEMODECHANGED = 'TIMEMODECHANGED';
    ns.events[ TIMEMODECHANGED ] = TIMEMODECHANGED;
    ns.events.eventNames.push( TIMEMODECHANGED );


    //onSetupLoaded = []FUNCTION called when the setup-options are loaded
    nsTime.onSetupLoaded = [];

    /***************************************
    TIME-OPTIONS
    ***************************************/
    var defaultTimeOptions = {
            timeModeList        : 'FIXED,RELATIVE',
            _timeModeList        : 'RELATIVE',
            __timeModeList        : 'FIXED',

            allowDifferentTime  : true, //If true the different maps can have differnet time - relative to the main map eq. +2h - Only used if fcoo/fcoo-maps-time is used
            step                : 1,    //Step in time-selector/slider. Using "unit"
            min                 : -24,  //Mminimum relative time in "unit". (Default)
            max                 : +48,  //Maximum relative time in "unit".  (Default)
            start               :   0,  //Releative start for animation or period
            end                 : +12,  //Releative end for animation or period
            modeMinMax          : {     //Min and max for different modes. Using default min and max if none given
                'FIXED': { min: -2*24, max: +5*24 }
            },
            cache               : 0,
            cacheBackward       : 1,    //Number of layers that can be kept hidden on the map for previous times
            cacheForward        : 3,    //Number of layers that can be kept hidden on the map for future times
        };

    nsTime.timeOptions = {};

    //Options for L.timeDimension.Layer.wms
    nsMap.tdLayerWmsOptions = {};

    //Load time-options
    ns.defaultApplicationOptions.standard = ns.defaultApplicationOptions.standard || {};
    ns.defaultApplicationOptions.standard.time = {subDir:"setup", fileName:"time.json"};

    nsMap.standard.time = function(options){
        nsTime.timeOptions = $.extend(true, {}, defaultTimeOptions, options);

        nsTime.timeOptions.timeModeList =
            Array.isArray(nsTime.timeOptions.timeModeList) ?
                nsTime.timeOptions.timeModeList :
                nsTime.timeOptions.timeModeList.split(',');

        //Set default time-mode
        nsTime.timeMode = nsTime.timeOptions.timeModeList[0];

        //Find start, end, min and max for each mode and global min and max
        nsTime.timeOptions.timeModeOptions = {};
        nsTime.timeOptions.timeModeList.forEach( function(timeMode){
            var tmo = nsTime.timeOptions.timeModeOptions[timeMode] = {},
                mmm = nsTime.timeOptions.modeMinMax || {};
            ['min', 'max', 'start', 'end'].forEach( id => {
                tmo[id] = mmm[timeMode] && (mmm[timeMode][id] !== undefined) ? mmm[timeMode][id] : nsTime.timeOptions[id];
            });
        });
        nsTime.timeOptions.min = Number.MAX_SAFE_INTEGER;
        nsTime.timeOptions.max = Number.MIN_SAFE_INTEGER;
        nsTime.timeOptions.timeModeList.forEach( function(timeMode){
            var tmo = nsTime.timeOptions.timeModeOptions[timeMode];
            nsTime.timeOptions.min = Math.min(nsTime.timeOptions.min, tmo.min);
            nsTime.timeOptions.max = Math.max(nsTime.timeOptions.max, tmo.max);
        });

        //Call all functions in nsTime.onSetupLoaded
        nsTime.onSetupLoaded.forEach( func => { func(); });

    };  //end of nsMap.standard.time

}(jQuery, L, window.moment, window.i18next, this, document));




