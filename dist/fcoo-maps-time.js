/****************************************************************************
    fcoo-maps-time

    (c) 2021, FCOO

    https://github.com/FCOO/fcoo-maps-time
    https://github.com/FCOO

    Extention to github/fcoo/fcoo-maps to have time-dependencies layers and
    to add bottom-menu with time-selector, add time-controls to the maps, and
    add options for time-sync in application-settings

****************************************************************************/
(function ($, L, moment, i18next, window/*, document, undefined*/) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {},
        unit      = window.FCOOMAPSTIME_TEST ? 'minute' : 'hour',

        timeReady       = false,    //Wait for creating the application before the maps time are set
        forceTimeUpdate = false;    //if true the set-function forces updating all time element, maps etc.

    var defaultTimeOptions = {
            timeModeList    : 'SCALE,RELATIVE',


            allowDifferentTime: true, //If true the different maps can have differnet time - relative to the main map eq. +2h - Only used if fcoo/fcoo-maps-time is used

            step            : 1,    //Step in time-selector/slider. Using "unit"
            min             : -24,  //Mminimum relative time in "unit". (Default)
            max             : +48,  //Maximum relative time in "unit".  (Default)
            modeMinMax      : {     //Min and max for different modes. Using default min and max if none given
                'SCALE': { min: -24, max: +5*24 }
            },


            cache        : 0,
            cacheBackward: 1,   //Number of layers that can be kept hidden on the map for previous times
            cacheForward : 3,   //Number of layers that can be kept hidden on the map for future times
        };

    nsTime.timeOptions = {};

    //Options for L.timeDimension.Layer.wms
    nsMap.tdLayerWmsOptions = {};

    //Load time-options
    nsMap.default_setup.standard.time = {subDir:"setup", fileName:"time.json"};
    nsMap.standard.time = function(options){
        nsTime.timeOptions = $.extend(true, {}, defaultTimeOptions, options);

        nsTime.timeOptions.timeModeList =
            Array.isArray(nsTime.timeOptions.timeModeList) ?
                nsTime.timeOptions.timeModeList :
                nsTime.timeOptions.timeModeList.split(',');

        //Find min and max for each mode and global min and max
        nsTime.timeOptions.timeModeOptions = {};
        nsTime.timeOptions.timeModeList.forEach( function(timeMode){
            nsTime.timeOptions.timeModeOptions[timeMode] = {
                min: nsTime.timeOptions.modeMinMax[timeMode] ? nsTime.timeOptions.modeMinMax[timeMode].min : nsTime.timeOptions.min,
                max: nsTime.timeOptions.modeMinMax[timeMode] ? nsTime.timeOptions.modeMinMax[timeMode].max : nsTime.timeOptions.max
            };
        });
        nsTime.timeOptions.min = Number.MAX_SAFE_INTEGER;
        nsTime.timeOptions.max = Number.MIN_SAFE_INTEGER;
        nsTime.timeOptions.timeModeList.forEach( function(timeMode){
            var tmo = nsTime.timeOptions.timeModeOptions[timeMode];
            nsTime.timeOptions.min = Math.min(nsTime.timeOptions.min, tmo.min);
            nsTime.timeOptions.max = Math.max(nsTime.timeOptions.max, tmo.max);
        });


        //Create extra options for L.Map
        var map_timeDimension_options = {
                timeDimension: true,

                timeDimensionOptions: {
                    timeInterval: moment().startOf(unit).add(nsTime.timeOptions.min, unit).toISOString() + '/' +
                                  moment().startOf(unit).add(nsTime.timeOptions.max, unit).toISOString(),
                    period      : moment.duration(nsTime.timeOptions.step, unit).toISOString()
                },
                timeDimensionControl: false
            };

        //Add TimeDimension to main and secondary map-options
        nsMap.mainMapOptions      = $.extend(nsMap.mainMapOptions,      map_timeDimension_options);
        nsMap.secondaryMapOptions = $.extend(nsMap.secondaryMapOptions, map_timeDimension_options);

/*TEST
nsMap.mainMapOptions.timeDimensionControl = true;
nsMap.mainMapOptions.timeDimensionControlOptions = {
    loopButton:true,
    //limitSliders: true
};
nsMap.secondaryMapOptions.timeDimensionControl = true;
// TEST SLUT */

        //Create options for L.timeDimension.layer.wms
        nsMap.tdLayerWmsOptions = {
            cache        : nsTime.timeOptions.cache,
            cacheBackward: nsTime.timeOptions.cacheBackward,
            cacheForward : nsTime.timeOptions.cacheForward
        };

        //Create and add content and options for map-setting. See src/map-setting-group
        if (nsMap.setupOptions.multiMaps.enabled && nsTime.timeOptions.allowDifferentTime)
            create_MapSettingGroup_content();

        var bsTimeInfoControlPosition = "bottomcenter";

        //MANGLER - Check hvor mange forskellige time-sync-modes, der er tilladt. Ryd ikke-tilladte fra nsTime.timeSyncInfo

        //Add bsTimeInfoControl to default map-settings
        nsMap.mainMapOptions.bsTimeInfoControl = true;
        nsMap.mainMapOptions.bsTimeInfoControlOptions = {
            position  : bsTimeInfoControlPosition,
            isMainMap : true,
            isExtended: true,
        };

        nsMap.secondaryMapOptions.bsTimeInfoControl = true;
        nsMap.secondaryMapOptions.bsTimeInfoControlOptions = {
            position  : bsTimeInfoControlPosition,
            isMainMap : false,
            isExtended: false
        };


        //Create default time-sync-options
        var defaultTimeSyncOptions = {};
        $.each(nsTime.timeSyncInfo, function(id/*, options*/){
            defaultTimeSyncOptions.mode = defaultTimeSyncOptions.mode || id;
            defaultTimeSyncOptions[id+'Offset'] = timeSyncOffsetAsId(0);
        });
        $.extend(nsMap.secondaryMapOptions.bsTimeInfoControlOptions, defaultTimeSyncOptions);

        //Add bsTimeInfoControl to mapSettingGroups list of controls
        nsMap.bsControls['bsTimeInfoControl'] = {
            icon: 'far fa-clock',
            text: {da:'Aktuelle tidspunkt', en:'Current time'},
            position: bsTimeInfoControlPosition
        };
    };


    /***************************************
    GLOBAL TIME-VARIABLES
    ***************************************/
    //nowMoment = moment-object representing 'now' in hole hours. Is changed every 60 minutes at hole hour (16:00:00, 17:00:00 etc)
    nsTime.nowMoment = moment().startOf(unit);

    //currentMoment = moment representing the current moment data on the map is displayed at
    nsTime.currentMoment  = moment(nsTime.nowMoment);

    //currentRelative = relative hour-value representing the current moment data. Saved in application-settings (see below)
    nsTime.currentRelative = 0;

    //currentAnimation = {start, end} relative hour-value representing the start and end of animation
    nsTime.currentAnimation = {start:0, end:24};


    /***************************************
    EVENTS
    There are four events fired when any of the moment-variables are changed:
    now-moment-changed, current-moment-changed, current-relative-changed, time-mode-changed
    ***************************************/
    //Create global events to be fired when now, current time or time mode is changed
    $.each( ['NOWMOMENTCHANGED', 'CURRENTMOMENTCHANGED', 'CURRENTRELATIVECHANGED', 'TIMEMODECHANGED'], function( index, eventName ){
        ns.events[ eventName ] = eventName;
        ns.events.eventNames.push( eventName );
    });

    /***************************************
    set(newNow, newCurrent, newRelative)
    When one of nsTime.nowMoment, nsTime.currentMoment, or nsTime.currentRelative is changed one of the two other variable is calculated
    Witch one that is recalculated dependes on nsTime.timeMode is relative or scale/absolute mode
    ***************************************/
    function set(newNow, newCurrent, newRelative/*, test*/){
        var previousNow      = nsTime.nowMoment,
            previousCurrent  = nsTime.currentMoment,
            previousRelative = nsTime.currentRelative;

        if (newNow){
            nsTime.nowMoment = newNow;
            if (timeModeIsRelative())
                nsTime.currentMoment = moment(nsTime.nowMoment).add(nsTime.currentRelative, unit);
            else {
                nsTime.currentMoment = nsTime.currentMoment || moment(nsTime.nowMoment);
                nsTime.currentRelative = nsTime.currentMoment.diff(nsTime.nowMoment, unit);
            }
        }
        else

        if (newCurrent){
            nsTime.currentMoment = newCurrent;
            nsTime.currentRelative = nsTime.currentMoment.diff(nsTime.nowMoment, unit);
        }
        else

        if (newRelative !== false){
            nsTime.currentRelative = newRelative;
            nsTime.currentMoment = moment(nsTime.nowMoment).add(nsTime.currentRelative, unit);
        }


        //Check that the new time is within the range nsTime.timeOptions.min -> nsTime.timeOptions.max
        if (nsTime.currentRelative !== null){
            newRelative = Math.max( nsTime.timeOptions.min, Math.min( nsTime.currentRelative, nsTime.timeOptions.max) );
            if (newRelative != nsTime.currentRelative){
                nsTime.setCurrentRelative( newRelative );
                return;
            }
        }

        if (!timeReady) return;

        var data = {
                now             : nsTime.nowMoment,
                nowMoment       : nsTime.nowMoment,
                current         : nsTime.currentMoment,
                currentMoment   : nsTime.currentMoment,
                relative        : nsTime.currentRelative,
                currentRelative : nsTime.currentRelative
            },
            updateMaps = false;

        if (forceTimeUpdate || !previousNow || !previousNow.isSame(nsTime.nowMoment)){
            ns.events.fire('NOWMOMENTCHANGED', data);
            updateMaps = true;
        }
        if (forceTimeUpdate || !previousCurrent || !previousCurrent.isSame(nsTime.currentMoment)){
            ns.events.fire('CURRENTMOMENTCHANGED', data);
            updateMaps = true;
        }

        if (forceTimeUpdate || !previousRelative || (previousRelative != nsTime.currentRelative)){
            ns.events.fire('CURRENTRELATIVECHANGED', data);
            ns.appSetting.data['currentRelative'] = nsTime.currentRelative;
            ns.appSetting.save();
            updateMaps = true;
        }

        if (updateMaps){
            nsMap.callAllMaps('_updateTime');

            //Update elements in bottom-menu with current time and current relative
            $('body').find('.is-current-moment').vfValue(nsTime.currentMoment);

            //Releative time needs to be relative to 'true now' = moment()
            $('body').find('.is-current-relative').vfValue( moment().add(nsTime.currentRelative, unit/*'hours'*/) );

        }

        forceTimeUpdate = false;
    }

    /******************************************************************
    nsTime.setNowMoment()
    nsTime.setCurrentMoment( newCurrentMoment )
    nsTime.setCurrentRelative( newCurrentRelative )
    nsTime.setCurrentAnimation( startAndEnd )
    ******************************************************************/
    nsTime.setNowMoment = function()                             { set( moment().startOf(unit), false,            false             /*, 'setNowMoment'*/       ); };
    nsTime.setCurrentMoment = function( newCurrentMoment )       { set( false,                  newCurrentMoment, false             /*, 'setCurrentMoment'*/   ); };
    nsTime.setCurrentRelative = function( newCurrentRelative = 0){ set( false,                  false,            newCurrentRelative/*, 'setCurrentRelative'*/ ); };

    nsTime.setCurrentAnimation = function( startAndEnd ){
        nsTime.currentAnimation = startAndEnd;
        ns.appSetting.data['currentAnimation'] = nsTime.currentAnimation;
        ns.appSetting.save();

        //TODO: Update whatever need to be updated
    };



    /******************************************************************
    SAVE TIME-SETTINGS
    ******************************************************************/
    //Add currentRelative and currentAnimation to application-settings
    ns.appSetting.add({
        id          : 'currentRelative',
        callApply   : false,
        applyFunc   : nsTime.setCurrentRelative,
        defaultValue: 0
    });
    ns.appSetting.add({
        id          : 'currentAnimation',
        callApply   : false,
        applyFunc   : nsTime.setCurrentAnimation,
        defaultValue: {start:0, end:24}
    });


    //Add init-function to be called at the end of creating the site
    nsMap.addFinallyEvent(function(){
        timeReady = true;
        forceTimeUpdate = true;

        window.intervals.addInterval({
            duration: moment.duration(1, unit).asMinutes(),
            data    : {},
            resolve : nsTime.setNowMoment
        });
    });



    /******************************************************************
    TIME-MODE
    There are four possible modes to display and select current time/moment:
    'SCALE', 'SELECT', 'RELATIVE', or 'ANIMATION'
    ******************************************************************/
    nsTime.tmScale     = 'SCALE';
    nsTime.tmRelative  = 'RELATIVE';
    nsTime.tmSelect    = 'SELECT';
    nsTime.tmAnimation = 'ANIMATION';

    nsTime.timeMode = nsTime.tmScale;

    var timeModeInfo = {}; //{TIMEMODE}{relative, name, description}

    timeModeInfo[nsTime.tmScale] = {
        name: {
            da: 'Fast tidspunkt',
            en: 'Fixed time'
        },
        description: {
            da: 'Vælg et fast dato og klokkeslet.<br>F.eks. <em>12. juni kl. 13:00</em>.',
            en: 'Select a fixed date and time.<br>Eq. <em>July 12th at 13:00"</em>.'
        }
    };

    timeModeInfo[nsTime.tmRelative] = {
        relative: true,
        name: {
            da: 'Relativt til aktuelle klokkeslet',
            en: 'Relative to current time'
        },
        description: {
            da: 'Vælg relativt til aktuelle tidspunkt.<br>F.eks. <em>"Nu plus 2 timer".</em><br>Dato og klokkeslet opdateres automatisk, når aktuelle tidspunkt ændre sig.',
            en: 'Select relative to current time.<br>Eq. <em>"Now plus 2 hours".</em><br>The time is automatic updated when the current time change.',
        }
    };
    timeModeInfo[nsTime.tmSelect] = {
        name: {
            da: 'SELECT',   //TODO
            en: 'SELECT'    //TODO
        },
        description: {
            da: '',
            en: ''
        }
    };
    timeModeInfo[nsTime.tmAnimation] = {
        relative: true,
        name: {
            da: 'Animation',
            en: 'Animation'
        },
        description: {
            da: '',
            en: ''
        }
    };

    //Add timeMode to application-settings
    ns.appSetting.add({
        id          : 'timeMode',
        callApply   : true,//false,  //MANGLER SKAL CHECKES OM DET SKAL VÆRE true ELLER false
        applyFunc   : function( timeMode ){
            nsTime.timeMode = timeMode;
            $.each(timeModeInfo, function(id){
                window.modernizrToggle('time-mode-'+id, id == timeMode);
            });
        },
        defaultValue: nsTime.tmScale,
        globalEvents: ns.events.TIMEMODECHANGED,

    });

    function timeModeIsRelative(){
        return timeModeInfo[nsTime.timeMode].relative;
    }

    /***************************************
    selectTimeMode - Modal-form with info and select of time-mode
    ***************************************/
    nsTime.selectTimeMode = function(){
        var list = [],
            allowDifferentTime = nsTime.timeOptions.allowDifferentTime,
            helpText = {
                da: (allowDifferentTime ? 'Tiden for ' + (nsMap.hasMultiMaps ? 'hovedkortet' : 'kortet') : 'Tiden') + ' vælges med skala eller frem- og tilbage-knapper forneden.',
                en: (allowDifferentTime ? 'The time for the ' + (nsMap.hasMultiMaps ? 'main' : '') + ' map' : 'The time') + ' is selected using the scale or the forward- and backward-buttons at the bottom.'
            };

        $.each(timeModeInfo, function(id, timeMode){
            if (nsTime.timeOptions.timeModeList.includes(id)){
                list.push({
                    id  : id,
                    icon: timeMode.icon,
                    text: timeMode.name
                });

                $.each( helpText, function(lang){
                    helpText[lang] = helpText[lang] + '<br>&nbsp;<br><strong>' + timeMode.name[lang] + '</strong><br>' + timeMode.description[lang];
                });
            }
        });

        $.bsModalForm({
//            show    : false,
            header  : {
                icon:'far fa-clock',
                text: {
                    da: allowDifferentTime ? 'Tidsindstillinger for ' + (nsMap.hasMultiMaps ? 'hovedkortet' : 'kortet') : 'Tidsindstilling',
                    en: allowDifferentTime ? 'Time Setting for the ' + (nsMap.hasMultiMaps ? 'main' : '') + ' map'      : 'Time Setting'
                }
            },
            width   : window.bsIsTouch ? 340 : 290,
            content : [{
                id           : 'timeMode',
                type         : 'radiobuttongroup',
                buttonType   : 'bigiconbutton',
                vertical     : true,
                fullWidth    : true,
                buttonOptions: { bold: true },
                list         : list
            },{
                label: {da: 'Vejledning', en:'Guidance'},
                type : 'text',
                small: window.bsIsTouch,
                text : helpText
            }],
            onSubmit: function(data){ ns.appSetting.set(data); }
        }).edit({timeMode: nsTime.timeMode});
    };


    /******************************************************************
    nsTime._addDiffToCurrentTimeMode - Add delta unit to the 'current time' in the current time-mode
    ******************************************************************/
    nsTime._addDiffToCurrentTimeMode = function( delta ){
        if (timeModeIsRelative())
            nsTime.setCurrentRelative( nsTime.currentRelative + delta );
        else
            nsTime.setCurrentMoment( nsTime.currentMoment.add(delta, unit) );
    };



    /******************************************************************
    SECONDARY MAP TIME-SYNC
    Each secondary maps have a one of the following time-sync
    tsMain: The time is the same as in the main-map with -24 - 0 +24 hours offset
    tsNow : The time is the same as 'Now' with -24 - 0 +24 hours offset
    ******************************************************************/
    /*
    "på nuværende tidspunkt" engelsk oversættelse
    på nuværende tidspunkt {adv.}EN
    "at this time" or "at the current moment"
    */
    nsTime.tsMain = 'MAIN';
    nsTime.tsNow  = 'NOW';


    //nsTime.timeSyncInfo = {TIMESYNC}{name, description, relativePrefix_List, relativePrefix_Ctrl}
    nsTime.timeSyncInfo = {};
    nsTime.timeSyncInfo[nsTime.tsMain] = {
        name: {
            da: 'Den samme som på hovedkortet',
            en: 'The same as on the main map'
        },
        description: {
            da: '',
            en: ''
        },
        zeroOffset         : {da:'Samme som hovedkortet', en:'Same as main map'},
        relativePrefix_List: {da: 'Hovedkort', en: 'Main map'}, //Prefix in list of offset in Setting
        relativePrefix_Ctrl: {da: '', en: ''},                  //Prefix for offset in bsTimeInfoControl

        iconColor      : ['icon-active', 'text-black', 'icon-active']
    };

    nsTime.timeSyncInfo[nsTime.tsNow] = {
        name: {
            da: 'Nuværende tidspunkt (Nu)',
            en: 'Current moment (Now)'
        },
        description: {
            da: '',
            en: ''
        },
        zeroOffset         : {da: 'Nu', en: 'Now'},
        relativePrefix_List: {da: 'Nu', en: 'Now'},     //Prefix in list of offset in Setting
        relativePrefix_Ctrl: {da: 'Nu', en: 'Now'},   //Prefix for offset in bsTimeInfoControl

        iconColor      : ['time-past-color', 'time-now-color', 'time-future-color'],
    };

    nsTime.timeSyncIconColors = '';
    var timeSyncIconColorList = [];
    $.each(nsTime.timeSyncInfo, function(id, opt){
        timeSyncIconColorList.push(...opt.iconColor);
    });
    nsTime.timeSyncIconColors = timeSyncIconColorList.join(' ');

    nsTime.getIconClass = function(mode, offset){
        return nsTime.timeSyncInfo[mode].iconColor[
                   offset < 0 ? 0 :
                   offset == 0 ? 1 :
                   2
               ];
    };

    function timeSyncOffsetAsId(offsetValue){
        return 'offset_' + offsetValue;
    }
    function timeSyncOffsetAsValue(offsetId){
        return parseInt( offsetId.split('_')[1] );
    }

    /*******************************************************
    Create content for time-sync-settings in MapSetting by prepend
    a create function to nsMap.mswcFunctionList (Map Setting With Control Function List) =
    Is a list of functions used to create Settings in MapSettingGroup using
    method addMapSettingWithControl when the MapSetting for each maps are created
    *******************************************************/
    nsTime.msgTimeSync = 'timeSync';
    nsTime.msgHeader_timeSync = {
        icon       : 'far fa-clock',
        text       : {da:'Tidsindstillinger', en:'Time Settings'},
        smallText  : {da:'Tid', en:'Time'}
    };

    function create_MapSettingGroup_content(){
        //Setting for secondary maps
        nsMap.msgAccordionAdd({
            accordionId: nsTime.msgTimeSync,
            header     : nsTime.msgHeader_timeSync,

            excludeFromCommon: true
        }, true);

        //Create setting-content for secondary maps = Select mode and offset to main map/now
        nsMap.mswcFunctionList.unshift( function(map){
            if (map.options.isMainMap)
                return;

            var controlId = 'bsTimeInfoControl',
                modalContent = [],
                list         = [],
                idList       = ['mode'];

            $.each(nsTime.timeSyncInfo, function(id, options){
                list.push({
                    id  : id,
                    icon: [['fas fa-clock text-white', 'far fa-clock ' + nsTime.getIconClass(id, 0)]],
                    text: options.name
                });

                var timeItems = [], text;
                $.each([-24,-12,-6,-3,-2,-1, 0, 1,2,3,6,12,24], function(index, offset){
                    if (offset){
                        text = (offset > 0 ? ' + ' : ' - ') + Math.abs(offset);
                        var isOneHour = (Math.abs(offset) == 1);
                        text = {
                            da: options.relativePrefix_List.da + ' ' + text + (isOneHour ? ' time' : ' timer'),
                            en: options.relativePrefix_List.en + ' ' + text + (isOneHour ? ' hour' : ' hours')
                        };
                    }
                    else
                        text = options.zeroOffset;

                    timeItems.push({
                        id  : 'offset_'+offset,
                        icon: [['fas fa-clock text-white', 'far fa-clock ' + nsTime.getIconClass(id, offset)]],
                        text: text
                    });
                });
                idList.push(id+'Offset');

                modalContent.push({
                    id       : id+'Offset',
                    label    : {da:'Forskydning (plus/minus antal timer)', en:'Shift (plus/minus number of hours)'},
                    type     : 'selectbutton',
                    fullWidth: true,
                    items    : timeItems,

                    showWhen: {'bsTimeInfoControl_mode': id},
                    freeSpaceWhenHidden: true
                });
            });

            //Help
            modalContent.push({
                label: {da: 'Vejledning', en:'Guidance'},
                type : 'text',
                small: window.bsIsTouch,
                text : {
                    da: 'Tiden på dette kort er enten<ul><li>Samme tidspunkt som på hovedkortet, eller</li><li>Aktuelle tidspunkt (Nu)</li></ul>Begge med mulighed for forskydning &#177; 1-24t',
                    en: 'The time on this map is<ul><li>The same time as on the main map, or</li><li>Current time (Now)</li></ul>Both with posible offset &#177; 1-24h'
                }
            });



            modalContent.unshift({
                id          : 'mode',
                label       : {da: 'Tiden på dette kort er', en: 'The time on this map is'},
                type        : 'radiobuttongroup',
                buttonType  : 'bigiconbutton',
                vertical    : true,
                fullWidth   : true,
                items       : list,
            });

            this.addMapSettingWithControl({
                controlId   : controlId,
                accordionId : nsTime.msgTimeSync,
                id          : idList,
                header      : nsTime.msgHeader_timeSync,
                modalContent: modalContent
            });
        });
    }



    /******************************************************************
    *******************************************************************
    Extend L.Map with method to update options for time-sync
    *******************************************************************
    ******************************************************************/
    L.Map.prototype._setTimeSyncOptions = function( options ){
        if (this.options.isMainMap)
            return;

        var mode = options.mode,
            offset = options[options.mode+'Offset'];
        offset = offset ? timeSyncOffsetAsValue(offset) : 0;

        this.timeSync = this.timeSync || {};
        if ((this.timeSync.mode !== mode) || (this.timeSync.offset !== offset)){
            this.timeSync = {
                mode  : mode,
                offset: offset
            };
            if (this.bsTimeInfoControl)
                this.bsTimeInfoControl.onChange();

            this._updateTime();
        }
    };

    /******************************************************************
    L.Map.prototype._updateTime
    ******************************************************************/
    L.Map.prototype._updateTime = function(){
        if (!timeReady || !this.isVisibleInMultiMaps)
            return this;

        //Create own copy of current
        if (this.options.isMainMap)
            this.time = {
                now     : nsTime.nowMoment,
                current : moment(nsTime.currentMoment),
                relative: nsTime.currentRelative
            };
        else {
            //Adjust for time-offset in sync with main map or now
            var isTsMain = this.timeSync.mode == nsTime.tsMain,
                offset = this.timeSync.offset;
            this.time = {
                now     : nsTime.nowMoment,
                current : isTsMain ? moment(nsTime.currentMoment) : moment(nsTime.nowMoment),
                relative: isTsMain ? nsTime.currentRelative : 0
            };
            this.time.current.add(offset, unit);
            this.time.relative += offset;

        }


        var newTimeAsString =
                this.time.now.toISOString() + '_' +
                this.time.current.toISOString() + '_' +
                this.time.relative;

console.log(this.fcooMapIndex, newTimeAsString, this.timeAsString == newTimeAsString);

        if (this.timeAsString == newTimeAsString)
            return this;

        this.timeAsString = newTimeAsString;

        //Update bsTimeInfoControl
        if (this.bsTimeInfoControl)
            this.bsTimeInfoControl.$currentTime.vfValue(this.time.current);

//**************************************************
//MANGLER Skal også opdaterer timeDimention!!!!!
//**************************************************


        //Call events
        this.fire("momentchanged", this.time);
        this.fire("datetimechange", {datetime: this.time.current.toISOString()});

        return this;
    };





}(jQuery, L, window.moment, window.i18next, this, document));





;
/***********************************************************************************
bottom-menu-elements.js

Create the content for bottom-menu with buttons, slider, info etc. for selected time
*************************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};


    //Add bottomMenuSize to application-settings
    var bottomMenuSizes = nsTime.bottomMenuSizes = ['minimized', 'normal', 'extended'];
    ns.appSetting.add({
        id          : 'bottomMenuSize',
        callApply   : true, //false,
        applyFunc   : function( size ){
            nsTime.bottomMenuSize = size;
            bottomMenuSizes.forEach( function( nextSize ){
                window.modernizrToggle('bottom-menu-'+nextSize, nsTime.bottomMenuSize == nextSize);
            });
            if (nsTime.bottomMenu_onResize)
                nsTime.bottomMenu_onResize();
        },
        defaultValue: 'minimized'
    });


    /**************************************************************************
    The content of the bottom-menu contains of buttons, boxes with info on current time an sliders
    This are all referred to as an element and a prototype is created in elements = [ID]$-element
    All elements are divided into groups to control witch element to show when
    **************************************************************************/
    var elements  = nsTime.elements  = {};

    nsTime.elementGroup = {}; //[ELEMENT-ID]GROUP-ID

    function setGroup(id, groupId = id){
        elements[id].addClass('group-'+groupId);
        nsTime.elementGroup[id] = groupId;
    }

    //Create all buttons to change size of the bottom menu bms = bottom-menu-size
    var bmsButtons = {
            'bms-extended'          : {icon: 'fal fa-chevron-circle-up'  , size: 'extended'},
            'bms-minimized'         : {icon: 'fal fa-chevron-circle-down', size: 'minimized'},
            'bms-minimized2normal'  : {icon: 'fal fa-chevron-circle-up'  , size: 'normal'},
            'bms-extended2normal'   : {icon: 'fal fa-chevron-circle-down', size: 'normal'},
        };
    $.each( bmsButtons, function(id, options ){
        elements[id] =
            $.bsButton({
                square  : true,
                icon    : options.icon,
                bigIcon : true,
                onClick: function(){ ns.appSetting.set('bottomMenuSize', options.size); }
            });
        setGroup(id);
    });

    //Create all navigation-buttons = changing current or relative time
    var naviButtons = {
            'time-step-first'       : {icon: 'fa-arrow-to-left',         group: 'time-step-first-last', diff: -99999},
            'time-step-prev-ext'    : {icon: 'fa-angle-double-left',     group: 'time-step-ext',        diff: -6    },
            'time-step-prev'        : {icon: 'fa-angle-left',            group: 'time-step-prev-next',  diff: -1    },
            'time-step-next'        : {icon: 'fa-angle-right',           group: 'time-step-prev-next',  diff: +1    },
            'time-step-next-ext'    : {icon: 'fa-angle-double-right',    group: 'time-step-ext',        diff: +6    },
            'time-step-last'        : {icon: 'fa-arrow-to-right',        group: 'time-step-first-last', diff: +99999}
        };
    $.each( naviButtons, function(id, options ){
        elements[id] =
            $.bsButton({
                square  : true,
                icon    : options.icon,
                bigIcon : true,
                onClick: function(){ nsTime._addDiffToCurrentTimeMode(options.diff); }
            });
        setGroup(id, options.group);
    });

    //Create "empty" to
    elements['empty'] = $('<div/>').addClass( 'btn-shadow ' + $._bsGetSizeClass({baseClass: 'btn-shadow', useTouchSize: true}));
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
                    onClick: function(){ nsTime._addDiffToCurrentTimeMode(options.diff); }
                })
                    .width('3em');
            setGroup(newId, newGroup);
        }
    });

    //Create button to select time-mode (scale, relative etc.)
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
        width   : '5em',
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
        width    : '11em'
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
    var on = {click: function(){ nsTime.setCurrentRelative(0); } };

    //** CURRENT TIME **
    //min = 12:00am+1, mid = 18. May + 12.00am, max = 18. May 2022 + 12.00am

    //Current when mode = SCALE
    var currentClass = 'border-color-as-time font-weight-bold';
    elements['current-SCALE-min'] = {id: 'time_sup',          class: currentClass, on: on };
    elements['current-SCALE-mid'] = {id: 'date_time',         class: currentClass, on: on };
    elements['current-SCALE-max'] = {id: 'date_time_full',    class: currentClass, on: on };

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
    //Relative when mode = SCALE
    var relativeClass = 'is-current-relative text-capitalize show-for-global-setting-showrelative-visibility';
    elements['relative-SCALE']     = {id:'relative',                class: relativeClass };
    //Special version with other widths
    elements['relative-SCALE-min'] = {id:'relative', width:  '7em', class: relativeClass };
    elements['relative-SCALE-mid'] = {id:'relative', width:  '8em', class: relativeClass };
    elements['relative-SCALE-max'] = {id:'relative', width: '10em', class: relativeClass };

    //relative-SCALE-SIZE-none = relative-SCALE-SIZE but with display:none when not-visible
    relativeClass = 'is-current-relative text-capitalize show-for-global-setting-showrelative';
    elements['relative-SCALE-none']     = {id:'relative',                class: relativeClass };
    //Special version with other widths
    elements['relative-SCALE-min-none'] = {id:'relative', width:  '7em', class: relativeClass };
    elements['relative-SCALE-mid-none'] = {id:'relative', width:  '8em', class: relativeClass };
    elements['relative-SCALE-max-none'] = {id:'relative', width: '10em', class: relativeClass };

    //Relative when mode = RELATIVE
    relativeClass = 'is-current-relative text-capitalize border-color-as-time font-weight-bold';
    elements['relative-RELATIVE']     = {id:'relative',                class: relativeClass, on: on};
    elements['relative-RELATIVE-min'] = {id:'relative', width:  '7em', class: relativeClass, on: on};
    elements['relative-RELATIVE-mid'] = {id:'relative', width:  '8em', class: relativeClass, on: on};
    elements['relative-RELATIVE-max'] = {id:'relative', width: '10em', class: relativeClass, on: on};

}(jQuery, L, this, document));

;
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

;
/***********************************************************************************
bottom-menu-ElementSet.js

*************************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};


    /**************************************************************************
    elementSetList = []ElementSet
    ElementSet = {
        options: {
            $container   : $-element
            elementList  : ELEMENTLIST = [] of STRING or OPTIONS or ELEMENTLIST or {ownContainer:true, class:STRING} ownContainer:true => create new inner div with class
            defaultGroups: {BOTTOM-MENU-SIZE or "ALL"} of STRING = space seperated group-ids
            prioList     : {BOTTOM-MENU-SIZE or "ALL"} of {MODE}[]STRING or []STRING. []STRING = space seperated group-ids
        }
    }
    The elements in $container are all part of groups.
    Depending of the current width of $container not all elements are visible
    prioList contains a list of strings with group-ids.
    The function bottomMenu_onResize will find the set of groups in prioList tha fits the current
    width of $container and shown/hide the elements

    **************************************************************************/
    function ElementSet( options ){
        this.options    = options;
        this.$container = options.$container;

        this.groupWidth    = {}; //{GROUPID}WIDTH
        this.callWidth     = true;

        this.addElementList( options.elementList );
    }

    ElementSet.prototype = {
        //get: Return the bms, mode, ori version from data
        get: function(data, bms, mode, ori, defaultValue){
            if (data === undefined)
                return defaultValue;

            if (Array.isArray(data) || (typeof data == 'string'))
                return data;

            return this.get( data[bms] || data['ALL'], mode, ori, null, defaultValue);
        },

        getString: function(data, bms, mode, ori){
            return this.get(data, bms, mode, ori, '');
        },

        getArray: function(data, bms, mode, ori){
            return this.get(data, bms, mode, ori, []);
        },

        addElementList: function(list){
            var _this = this,
                $newElem;

            $.each( list, function(index, element ){
                if (!element)
                    return;

                if (Array.isArray(element)){
                    _this.addElementList( element );
                    return;
                }

                if (element instanceof $){
                    _this.$container.append(element);
                    return;
                }

                $newElem = null;

                var options = typeof element == 'string' ? {id: element} : element,
                    elementId = options.id;

                //First element or options.ownContainer => create sub-div
                if (!_this.$currentDiv || options.ownContainer)
                    _this.$currentDiv = $('<div/>')
                        .toggleClass('w-100', !!options.fullWidth)
                        .addClass(options.class || options.className || '')
                        .appendTo(_this.$container);

                var elem        = nsTime.elements[elementId],
                    $elem       = $.isPlainObject( elem ) ? nsTime.elements[elem.id] : elem,
                    elemOptions = $.isPlainObject( elem ) ? elem : {};

                if ($.isFunction(elemOptions.content))
                    $newElem = elemOptions.content( _this.$currentDiv, this, elemOptions);
                else
                    $newElem = $elem ? $elem.clone(true) : null;

                if (!$newElem)
                    return;

                //Adjust newElement
                $newElem.addClass(elemOptions.class || elemOptions.className || '');
                $newElem.css(elemOptions.css || {});

                if (elemOptions.width)
                    $newElem.width(elemOptions.width);

                if (elemOptions.align)
                    $newElem
                        .removeClass('text-center')
                        .addClass('text-'+elemOptions.align);

                if (elemOptions.on){
                    $newElem.removeClass('disabled show-as-normal transparent');
                    $.each(elemOptions.on, function(event, func){
                        $newElem.on(event, func);
                    });
                }



                var groupId = (nsTime.elementGroup[elementId] || elementId) + (elemOptions.subVersion ? '-'+elemOptions.subVersion : '');
                $newElem.addClass('group-'+groupId);
                _this.groupWidth[groupId] = 0;

                $newElem.appendTo( _this.$currentDiv );
            });

            return this.$container;
        },

        //**************************************************************************
        update: function(){
            //******************************************
            function splitStr(str){ return str.split(' ').filter(function(elem){ return !!elem; }); }
            //******************************************
            function compress( record ){
                var commonContentAsStr = null,
                    returnAsAll = true;

                $.each(record, function(id, content){
                    var contentAsStr = JSON.stringify(content);
                    if (commonContentAsStr === null)
                        commonContentAsStr = contentAsStr;
                    else
                        if (commonContentAsStr != contentAsStr)
                            returnAsAll = false;
                });
                return returnAsAll ? {ALL: JSON.parse(commonContentAsStr)} : record;
            }
            //******************************************
            if (!this.options.prioList)
                 return;

            var _this        = this,
                $allElements = this.$container.children('div').children();

            if (this.callWidth){
                this.callWidth = false;
                $.each(this.groupWidth, function(id){
                    $allElements.filter('.group-'+id).each( function(index, elem){
                        _this.groupWidth[id] = _this.groupWidth[id] + ($(elem).outerWidth(true) || 0);
                    });
                });

                //Find the total width of all groups in each set of bms, mode, orientation
                var newPrio = {};

                nsTime.bottomMenuSizes.forEach( function( bms ){
                    newPrio[bms] = {};
                    nsTime.timeOptions.timeModeList.forEach( function( mode ){
                        newPrio[bms][mode] = {};
                        ['portrait', 'landscape'].forEach( function( ori ){
                            var prioAndWidthList = newPrio[bms][mode][ori] = [],
                                defaultGroups    = _this.getString( _this.options.defaultGroups || '', bms, mode, ori ),
                                prioList         = _this.getArray( _this.options.prioList, bms, mode, ori );

                            prioList.forEach( function( prioStr ){
                                var groupList = splitStr(defaultGroups).concat( splitStr(prioStr) ),
                                    groupWidth = 0;
                                groupList.forEach( function( groupId ){
                                    groupWidth = groupWidth + (_this.groupWidth[groupId] || 0);
                                });
                                prioAndWidthList.push({
                                    list : groupList,
                                    width: groupWidth
                                });
                            });
                        });
                        newPrio[bms][mode] = compress( newPrio[bms][mode] );
                    });
                    newPrio[bms] = compress( newPrio[bms] );
                });
                this.options.prioList = compress( newPrio );
            }

            //Find the set of groups with largest width less that container width
            var bms              = ns.appSetting.get('bottomMenuSize'),
                mode             = nsTime.timeMode,
                orientation      = $('html').hasClass('landscape') ? 'landscape' : 'portrait',
                prioList         = this.getArray( this.options.prioList, bms, mode, orientation ),
                currentGroupList = prioList.length ? prioList[0].list : [],
                containerWidth   = this.$container.width();

            if (prioList)
                prioList.forEach( function( listAndWidth ){
                    if (listAndWidth.width <= containerWidth)
                        currentGroupList = listAndWidth.list;
                });

            //Hide/show all elemnts in each group
            $.each(this.groupWidth, function(id){
                $allElements.filter('.group-'+id).toggle( currentGroupList.includes(id) );
            });
        },

        //**************************************************************************
        onCurrentRelativeChanged: function( time ){
            var relative = time.relative || 0;
            this.$container
                .toggleClass('time-is-past',   relative < 0)
                .toggleClass('time-is-now',    relative == 0)
                .toggleClass('time-is-future', relative > 0);
        }
    };


    //**************************************************************************
    var elementSetList = [];

    nsTime.addElementSet = function( options ){
        var elementSet = new ElementSet( options );
        elementSetList.push(elementSet);
        return elementSet.$container;
    };



    //**************************************************************************
    nsTime.bottomMenu_onResize = function(){
        $.each(elementSetList, function(index, elementSet){
            elementSet.update();
        });
    };

    nsTime.bottomMenu_onCurrentRelativeChanged = function( time ){
        $.each(elementSetList, function(index, elementSet){
            elementSet.onCurrentRelativeChanged(time);
        });
    };


}(jQuery, L, this, document));

;
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

;
/****************************************************************************
 L.Control.BsTimeInfoControl.js

Leaflet control to display current time and relative time in the maps

****************************************************************************/
(function ($, L, moment, i18next, window/*, document, undefined*/) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};


    /******************************************************************
    L.Control.BsTimeInfoControl
    Control to show current time and info on time sync with main map
    ******************************************************************/
    L.Control.BsTimeInfoControl = L.Control.BsButtonBox.extend({
        options: {
            //small          : window.bsIsTouch,
            icon           : 'far fa-lg fa-clock',
            tooltipOnButton: true,
            square         : true,
            className      : 'time-info-control',   //Class-names for the container
            class          : 'show-as-normal',      //Class-names for <a>-buttons To allow the button to be 'normal' when disabled
            semiTransparent: false,

            extendedButton: {
                //small          : window.bsIsTouch,
                icon           : 'far fa-clock',
                text           : ['12:00 am(+1)'],
                textClass      : ['current-time'],
                square         : false,
                semiTransparent: false,
            }
        },

        /***********************************************************
        initialize
        ***********************************************************/
        initialize: function(options){
            options = $.extend(true, {}, this.options, options || {});

            var isMainMap      = options.isMainMap,
                isSecondaryMap = !isMainMap;

            //Adjust content
            if (isSecondaryMap){
                //Secondary in normal-mode = icon and relative text
                $.extend(/*this.*/options, {
                    square   : false,
                    icon     : 'far fa-clock',
                    text     : '+12t',
                    textClass: 'time-sync-info-text'
                });

                //Secondary in extended-mode = icon and time and relative text
                options.extendedButton.text.push('+24h');
                options.extendedButton.textClass.push('time-sync-info-text');
            }


            //Add items to popup-list: Main or global mode = select time-mode, secondary = select relative mode
            options.popupList = [];
            if ( (isMainMap && (nsTime.timeOptions.timeModeList.length > 1) ||
                 (isSecondaryMap && !nsTime.timeOptions.allowDifferentTime)) )
                options.popupList.push({
                    type        : 'button',
                    icon        : 'far fa-clock',
                    text        : {da: 'Tidsindstillinger', en: 'Time Settings'},
                    onClick     : nsTime.selectTimeMode,
                    closeOnClick: true,
                    lineAfter   : true
                });

            if (isSecondaryMap && nsTime.timeOptions.allowDifferentTime)
                options.popupList.push({
                    type        : 'button',
                    icon        : nsTime.msgHeader_timeSync.icon,
                    text        : nsTime.msgHeader_timeSync.text,
                    onClick     : $.proxy(this.editSetting, this),
                    closeOnClick: true,
                    lineAfter   : true
                });


            //Add links to settings for timezone and date & time-format
            $.each(['TIMEZONECHANGED','DATETIMEFORMATCHANGED'], function(index, id){
                var accOptions = ns.globalSettingAccordion(id);
                options.popupList.push({
                    type     : 'button',
                    icon     : accOptions.header.icon,
                    text     : accOptions.header.text,
                    onClick  : function(){ ns.globalSetting.edit(id); },
                    closeOnClick: true,
                });
            });

            return L.Control.BsButtonBox.prototype.initialize.call(this, options);
        },

        /***********************************************************
        onAdd
        ***********************************************************/
        onAdd: function(map){
            var result = L.Control.BsButtonBox.prototype.onAdd.call(this, map);

            //Find this.$currentTime = $-elements holding the current time of the map
            this.$currentTime = $(result).find('span.current-time');

            this.$currentTime.vfFormat('time_now_sup');

            //Find this.$relative = $-elements holding info on relative mode eq. "Now +12h"
            this.$relative = $(result).find('span.time-sync-info-text');
            this.$relative.css({
                'border-left' : '1px solid gray',
                'padding-left': '.35em'
            });

            map.on("momentchanged", this.onMomentChanged, this);

            return result;
        },

        /***********************************************************
        editSetting
        ***********************************************************/
        editSetting: function(){
            nsMap.editMapSetting(this._map.fcooMapIndex, {msgAccordionId: nsTime.msgTimeSync} );
        },

        /************************************************************
        setState
        ************************************************************/
        setState: function(BsButtonBox_setState){
            return function (options) {
                BsButtonBox_setState.call(this, options);
                this._map._setTimeSyncOptions( options );
                return this;
            };
        }(L.Control.BsButtonBox.prototype.setState),


        /************************************************************
        getState
        ************************************************************/
        getState: function(BsButtonBox_getState){
            return function () {
                var _this = this,
                    result = BsButtonBox_getState.call(this);

                if (!this.options.isMainMap){
                    result.mode = this.options.mode;

                    $.each(nsTime.timeSyncInfo, function(id/*, opt*/){
                        result[id+'Offset'] = _this.options[id+'Offset'];
                    });
                }
                return result;
            };
        }(L.Control.BsButtonBox.prototype.getState),



        /***********************************************************
        onMomentChanged
        ***********************************************************/
        onMomentChanged: function(time){
            var relative = time.relative || 0;
            this._map.$container
                .toggleClass('time-is-past',   relative < 0)
                .toggleClass('time-is-now',    relative == 0)
                .toggleClass('time-is-future', relative > 0);

        },

        /***********************************************************
        onChange
        ***********************************************************/
        onChange: function(/*options*/){
            if (this.options.isMainMap)
                return;

            var timeSyncOptions = this._map.timeSync || {},
                timeSyncMode = timeSyncOptions.mode || null,
                timeSyncInfo = timeSyncMode ? nsTime.timeSyncInfo[timeSyncMode] : {},
                asMain = timeSyncMode == nsTime.tsMain,
                offset = timeSyncOptions.offset || 0;


            this.bsButton.toggleClass('disabled', !this.options.show);

            //Bug fix to prevent multi call when other controls are changed
            var newTimeSyncAsStr = '' + JSON.stringify(this._map.timeSync) + (this.options.show ? 'On' : 'OFF') + timeSyncMode;
            if (!timeSyncMode || (this.timeSyncAsStr == newTimeSyncAsStr))
                return;

            this.timeSyncAsStr = newTimeSyncAsStr;

            //If mode is different from "as main" and the bsTimeInfoControl is hidden it is forced to be displayed disabled to allways see the time-offset
            var forcedShown = !this.options.show && (!asMain || !!offset);
            this.$container.toggleClass('forced-shown', forcedShown);
            $(this.bsButton).toggleClass('semi-transparent', forcedShown);

            forcedShown ? this.disable() : this.enable();

            //Update sync time (Now or relative time)
            this.$relative.empty().hide();
            if (!asMain || offset){
                var text = $.extend({}, timeSyncInfo.relativePrefix_Ctrl);
                if (offset){
                    var offsetText = (offset > 0 ? '+ ' : '- ') + Math.abs(offset);
                    text.da = text.da + (text.da ? ' ' : '') + offsetText+'t';
                    text.en = text.en + (text.en ? ' ' : '') + offsetText+'h';
                }
                this.$relative.i18n(text, 'html').show();
            }

            //Adjust the button:
            //Set icon color for mode and offset
            this.$container.find('i')
                .removeClass(nsTime.timeSyncIconColors)
                .addClass( nsTime.getIconClass(timeSyncMode, offset) );



            //If same as main map  => normal button: shape = square and big icon and no margin
            var isSquare = asMain && !offset;
            this.bsButton.toggleClass('square', isSquare);
            this.bsButton.find('i').toggleClass('fa-lg fa-no-margin', isSquare);

            //Update current time of the map
            this._map._updateTime();
        },
    });



    L.Map.addInitHook(function () {
        this.on('showinmultimaps', this._updateTime, this);

        if (this.options.bsTimeInfoControl) {
            this.bsTimeInfoControl = new L.Control.BsTimeInfoControl( this.options.bsTimeInfoControlOptions );
            this.addControl(this.bsTimeInfoControl);
        }
    });


}(jQuery, L, window.moment, window.i18next, this, document));





;
/****************************************************************************
 L.Control.BsTimeInfoControl.js

Leaflet control to display current time and relative time in the maps

****************************************************************************/
(function ($, L, moment, i18next, window/*, document, undefined*/) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};


    /******************************************************************
    L.Control.BsTimeInfoControl
    Control to show current time and info on time sync with main map
    ******************************************************************/
    L.Control.BsTimeInfoControl = L.Control.BsButtonBox.extend({
        options: {
            //small          : window.bsIsTouch,
            icon           : 'fa-lg fa-clock',
            tooltipOnButton: true,
            square         : true,
            className      : 'time-info-control',   //Class-names for the container
            class          : 'show-as-normal',      //Class-names for <a>-buttons To allow the button to be 'normal' when disabled
semiTransparent: false,

            extendedButton: {
                //small          : window.bsIsTouch,
                icon     : 'fa-clock',
                text     : ['12:00 am(+1)'],
                textClass: ['current-time'],
                square   : false,
semiTransparent: false,
            }
        },

        /***********************************************************
        initialize
        ***********************************************************/
        initialize: function(options){
            options = $.extend(true, {}, this.options, options || {});

            var isMainMap      = options.isMainMap,
                isSecondaryMap = !isMainMap;

            //Adjust content
            if (isSecondaryMap){
                //Secondary in normal-mode = icon and relative text
                $.extend(/*this.*/options, {
                    square   : false,
                    icon     : 'fa-clock',
                    text     : '+12t',
                    textClass: 'time-sync-info-text'
                });

                //Secondary in extended-mode = icon and time and relative text
                options.extendedButton.text.push('+24h');
                options.extendedButton.textClass.push('time-sync-info-text');
            }


            //Add items to popup-list: Main = select time-mode, secondary = select relative mode
            options.popupList = [];
            if (isMainMap && (nsTime.timeOptions.timeModeList.length > 1))
                options.popupList.push({
                    type        : 'button',
                    icon        : 'fa-clock',
                    text        : {da: '(?) Tidsvælger', en: '(?) Time Selector'},
                    onClick     : nsTime.selectTimeMode,
                    closeOnClick: true,
                    lineAfter   : true
                });

            if (!isMainMap)
                options.popupList.push({
                    type        : 'button',
                    icon        : nsTime.msgHeader_timeSync.icon,
                    text        : nsTime.msgHeader_timeSync.text,
                    onClick     : $.proxy(this.editSetting, this),
                    closeOnClick: true,
                    lineAfter   : true
                });


            //Add links to settings for timezone and date & time-format
            $.each(['TIMEZONECHANGED','DATETIMEFORMATCHANGED'], function(index, id){
                var accOptions = ns.globalSettingAccordion(id);
                options.popupList.push({
                    type     : 'button',
                    icon     : accOptions.header.icon,
                    text     : accOptions.header.text,
                    onClick  : function(){ ns.globalSetting.edit(id); },
                    closeOnClick: true,
                });
            });

            return L.Control.BsButtonBox.prototype.initialize.call(this, options);
        },

        /***********************************************************
        onAdd
        ***********************************************************/
        onAdd: function(map){
            var result = L.Control.BsButtonBox.prototype.onAdd.call(this, map);

            //Find this.$currentTime = $-elements holding the current time of the map
            this.$currentTime = $(result).find('span.current-time');

            this.$currentTime.vfFormat('time_now_sup');

            //Find this.$relative = $-elements holding info on relative mode eq. "Now +12h"
            this.$relative = $(result).find('span.time-sync-info-text');
            this.$relative.css({
                'border-left' : '1px solid gray',
                'padding-left': '.35em'
            });

            map.on("momentchanged", this.onMomentChanged, this);

            return result;
        },

        /***********************************************************
        editSetting
        ***********************************************************/
        editSetting: function(){
            nsMap.editMapSetting(this._map.fcooMapIndex, {msgAccordionId: nsTime.msgTimeSync} );
        },

        /************************************************************
        setState
        ************************************************************/
        setState: function(BsButtonBox_setState){
            return function (options) {
                BsButtonBox_setState.call(this, options);
                this._map._setTimeSyncOptions( options );
                return this;
            };
        }(L.Control.BsButtonBox.prototype.setState),


        /************************************************************
        getState
        ************************************************************/
        getState: function(BsButtonBox_getState){
            return function () {
                var _this = this,
                    result = BsButtonBox_getState.call(this);

                if (!this.options.isMainMap){
                    result.mode = this.options.mode;

                    $.each(nsTime.timeSyncInfo, function(id/*, opt*/){
                        result[id+'Offset'] = _this.options[id+'Offset'];
                    });
                }
                return result;
            };
        }(L.Control.BsButtonBox.prototype.getState),



        /***********************************************************
        onMomentChanged
        ***********************************************************/
        onMomentChanged: function(time){
            var relative = time.relative || 0;
            this._map.$container
                .toggleClass('time-is-past',   relative < 0)
                .toggleClass('time-is-now',    relative == 0)
                .toggleClass('time-is-future', relative > 0);

        },

        /***********************************************************
        onChange
        ***********************************************************/
        onChange: function(/*options*/){
            if (this.options.isMainMap)
                return;

            var timeSyncOptions = this._map.timeSync || {},
                timeSyncMode = timeSyncOptions.mode || null,
                timeSyncInfo = timeSyncMode ? nsTime.timeSyncInfo[timeSyncMode] : {},
                asMain = timeSyncMode == nsTime.tsMain,
                offset = timeSyncOptions.offset || 0;


            this.bsButton.toggleClass('disabled', !this.options.show);

            //Bug fix to prevent multi call when other controls are changed
            var newTimeSyncAsStr = '' + JSON.stringify(this._map.timeSync) + (this.options.show ? 'On' : 'OFF') + timeSyncMode;
            if (!timeSyncMode || (this.timeSyncAsStr == newTimeSyncAsStr))
                return;

            this.timeSyncAsStr = newTimeSyncAsStr;

            //If mode is different from "as main" and the bsTimeInfoControl is hidden it is forced to be displayed disabled to allways see the time-offset
            var forcedShown = !this.options.show && (!asMain || !!offset);
            this.$container.toggleClass('forced-shown', forcedShown);
            $(this.bsButton).toggleClass('semi-transparent', forcedShown);

            forcedShown ? this.disable() : this.enable();

            //Update sync time (Now or relative time)
            this.$relative.empty().hide();
            if (!asMain || offset){
                var text = $.extend({}, timeSyncInfo.relativePrefix_Ctrl);
                if (offset){
                    var offsetText = (offset > 0 ? '+ ' : '- ') + Math.abs(offset);
                    text.da = text.da + (text.da ? ' ' : '') + offsetText+'t';
                    text.en = text.en + (text.en ? ' ' : '') + offsetText+'h';
                }
                this.$relative.i18n(text, 'html').show();
            }

            //Adjust the button:
            //Set icon color for mode and offset
            this.$container.find('i')
                .removeClass(nsTime.timeSyncIconColors)
                .addClass( nsTime.getIconClass(timeSyncMode, offset) );



            //If same as main map  => normal button: shape = square and big icon and no margin
            var isSquare = asMain && !offset;
            this.bsButton.toggleClass('square', isSquare);
            this.bsButton.find('i').toggleClass('fa-lg fa-no-margin', isSquare);

            //Update current time of the map
            this._map._updateTime();
        },
    });



    L.Map.addInitHook(function () {
        this.on('showinmultimaps', this._updateTime, this);

        if (this.options.bsTimeInfoControl) {
            this.bsTimeInfoControl = new L.Control.BsTimeInfoControl( this.options.bsTimeInfoControlOptions );
            this.addControl(this.bsTimeInfoControl);
        }
    });


}(jQuery, L, window.moment, window.i18next, this, document));




