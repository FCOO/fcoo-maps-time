
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





;
/****************************************************************************
time-modes
****************************************************************************/
(function ($, L, moment, i18next, window/*, document, undefined*/) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};

    /******************************************************************
    TIME-MODE
    Txhere are four possible modes to display and select current time/moment:
    'FIXED', 'SELECT', 'RELATIVE', or 'ANIMATION'
    ******************************************************************/
    nsTime.tmFixed     = 'FIXED';
    nsTime.tmRelative  = 'RELATIVE';
    nsTime.tmSelect    = 'SELECT';
    nsTime.tmAnimation = 'ANIMATION';

    //nsTime.timeMode = The current selected time-mode
    nsTime.timeMode = nsTime.tmFixed;

    var timeModeInfo = {}; //{TIMEMODE}{relative, name, description}

    timeModeInfo[nsTime.tmFixed] = {
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

    nsTime.onSetupLoaded.push( function(){
        //Add timeMode to application-settings
        ns.appSetting.add({
            id          : 'timeMode',
            callApply   : true,
            applyFunc   : function( timeMode ){
                if (nsTime.timeOptions.timeModeList.indexOf(timeMode) >= 0)
                    nsTime.timeMode = timeMode;

                $.each(timeModeInfo, function(id){
                    window.modernizrToggle('time-mode-'+id, id == nsTime.timeMode);
                });
            },
            defaultValue: nsTime.timeMode,
            globalEvents: ns.events.TIMEMODECHANGED,
        });
    });

    nsTime.timeModeIsRelative = function( timeMode ){
        return !!timeModeInfo[timeMode || nsTime.timeMode].relative;
    };


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

        //Add buttons to settings for date-format and time zone
        let buttons = [];
        ['TIMEZONECHANGED','DATETIMEFORMATCHANGED'].forEach( id => {
            let accOptions = ns.globalSettingAccordion(id);
            buttons.push({
                icon   : accOptions.header.icon,
                text   : window.bsIsTouch ? null : accOptions.header.text,
                square : window.bsIsTouch,
                bigIcon: window.bsIsTouch,
                onClick: function(){ ns.globalSetting.edit(id); },
            });
        });

        $.bsModalForm({
            header  : {
                icon:'far fa-clock',
                text: {
                    da: allowDifferentTime ? 'Tidsindstillinger for ' + (nsMap.hasMultiMaps ? 'hovedkortet' : 'kortet') : 'Tidsindstilling',
                    en: allowDifferentTime ? 'Time Setting for the ' + (nsMap.hasMultiMaps ? 'main' : '') + ' map'      : 'Time Setting'
                }
            },
            flexWidth: true,
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
                //small: window.bsIsTouch,
                //textClass: 'font-size-0-9em',
                text : helpText
            }],
            buttons: buttons,
            onSubmit: function(data){
                ns.appSetting.set(data);
            }
        }).edit({timeMode: nsTime.timeMode});
    };


    /******************************************************************
    SECONDARY MAP TIME-SYNC
    Each secondary maps have a one of the following time-sync
    tsMain: The time is the same as in the main-map with -24 - to +24 hours offset
    tsNow : The time is the same as 'Now' with -24 - to +24 hours offset
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




    /*******************************************************
    Create content for time-sync-settings in MapSetting by prepend
    a create function to nsMap.mswcFunctionList (Map Setting With Control Function List) =
    Is a list of functions used to create Settings in MapSettingGroup using
    method addMapSettingWithControl when the MapSetting for each maps are created
    *******************************************************/
    function timeSyncOptions_singleMap(idPostfix='', controlId=''){
        let content = [],
            list    = [];

        $.each(nsTime.timeSyncInfo, function(id, options){
            list.push({
                id  : id,
                icon: [['fas fa-clock text-white', 'far fa-clock ' + nsTime.getIconClass(id, 0)]],
                text: options.name
            });

            var timeItems = [], text;
            [-24,-12,-6,-3,-2,-1, 0, 1,2,3,6,12,24].forEach( offset => {
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

            let showWhen = {};
            showWhen[(controlId ? controlId+'_' : '') + 'mode'+idPostfix] = id;
            content.push({
                id       : id+'Offset'+idPostfix,
                label    : {da:'Forskydning (plus/minus antal timer)', en:'Shift (plus/minus number of hours)'},
                type     : 'selectbutton',
                fullWidth: true,
                items    : timeItems,
                showWhen : showWhen,
                freeSpaceWhenHidden: true
            });
        });

        content.unshift({
            id          : 'mode'+idPostfix,
            label       : {da: 'Tiden på dette kort er', en: 'The time on this map is'},
            type        : 'radiobuttongroup',
            buttonType  : 'bigiconbutton',
            vertical    : true,
            fullWidth   : true,
            items       : list,
        });
        return content;
    }

    function mapSettingGroup_editCommonTimeSyncSetting(){
        nsMap.mapSettingGroup_mapSyncForm({
            controlId: 'bsTimeInfoControl',
            header   : nsTime.msgHeader_timeSync,
            flexWidth: window.bsIsTouch,
            buttons  : [{
                icon: ns.settingIcon('fa-clock-eight'),
                text: {da:'Hovedkort', en: 'Main map'},
                onClick: nsTime.selectTimeMode
            }],
            desc     : {
                da: 'Tiden på et kort er enten<ul><li>Samme tidspunkt som på hovedkortet, eller</li><li>Aktuelle tidspunkt (Nu)</li></ul>Begge med mulighed for forskydning &#177; 1-24t',
                en: 'The time on a map is<ul><li>The same time as on the main map, or</li><li>Current time (Now)</li></ul>Both with posible offset &#177; 1-24h'
            },

            getMapContent: timeSyncOptions_singleMap,

            getMapSetting: function(mapIndex, map){
                let state = map.bsTimeInfoControl.getState(),
                    data  = {};
                ['mode', 'NOWOffset', 'MAINOffset'].forEach( id => data[id+mapIndex] = state[id] );
                return data;
            },

            setMapSetting: function(mapIndex, map, data){
                let state = {};
                ['mode', 'NOWOffset', 'MAINOffset'].forEach( id => state[id] = data[id+mapIndex] );
                nsMap.getMapSettingGroup(map).saveParent({ bsTimeInfoControl: state });
            }
        });
    }


    nsTime.msgTimeSync = 'timeSync';
    nsTime.msgHeader_timeSync = {
        icon       : 'far fa-clock',
        text       : {da:'Tidsindstillinger', en:'Time Settings'},
        smallText  : {da:'Tid', en:'Time'}
    };

    nsTime.create_MapSettingGroup_content = function(){
        //Setting for secondary maps
        nsMap.msgAccordionAdd({
            accordionId: nsTime.msgTimeSync,
            header     : nsTime.msgHeader_timeSync,
            editCommon : mapSettingGroup_editCommonTimeSyncSetting

        }, true);

        //Create setting-content for secondary maps = Select mode and offset to main map/now
        nsMap.mswcFunctionList.unshift( function(map){
            if (map.options.isMainMap)
                return;

            let controlId = 'bsTimeInfoControl';

            let idList = ['mode'];
            $.each(nsTime.timeSyncInfo, id => idList.push(id+'Offset') );

            let modalContent = timeSyncOptions_singleMap('', controlId);
            //Add help
            modalContent.push({
                label: {da: 'Vejledning', en:'Guidance'},
                type : 'text',
                small: window.bsIsTouch,
                textClass: 'font-size-0-9em',
                text : {
                    da: 'Tiden på dette kort er enten<ul><li>Samme tidspunkt som på hovedkortet, eller</li><li>Aktuelle tidspunkt (Nu)</li></ul>Begge med mulighed for forskydning &#177; 1-24t',
                    en: 'The time on this map is<ul><li>The same time as on the main map, or</li><li>Current time (Now)</li></ul>Both with posible offset &#177; 1-24h'
                }
            });

            this.addMapSettingWithControl({
                controlId   : controlId,
                accordionId : nsTime.msgTimeSync,
                id          : idList,
                header      : nsTime.msgHeader_timeSync,
                modalContent: modalContent
            });
        });
    };

}(jQuery, L, window.moment, window.i18next, this, document));





;
/****************************************************************************
05_time-mode-data.js

****************************************************************************/
(function ($, L, moment, i18next, window/*, document, undefined*/) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {},
        unit      = nsTime.unit;

    nsTime.ready = false; //Wait for creating the application before the maps time are set

    //nowMoment = moment-object representing 'now' in hole hours. Is changed every 60 minutes at hole hour (16:00:00, 17:00:00 etc)
    nsTime.nowMoment = moment().startOf(unit);
/*
    nsTime.tmFixed     = 'FIXED';
    nsTime.tmRelative  = 'RELATIVE';
    nsTime.tmSelect    = 'SELECT';
    nsTime.tmAnimation = 'ANIMATION';

    nsTime.timeMode = nsTime.tmFixed;
*/

    /******************************************************************************
    TIME-MODE-DATA
    TimeModeData = object with methods and data for a specific timeMode
    TimeModeData.data = {
        currentMoment   : MOMENT
        currentRelative : NUMBER
        min             : NUMBER
        max             : NUMBER
        globalMin       : NUMBER
        globalMax       : NUMBER
        start           : NUMBER
        end             : NUMBER
    }
    Contains the current values and range for the different time-modes
    ******************************************************************************/
    var timeModeDataList = {};

    nsTime.getCurrentTimeModeData = function(){
        return timeModeDataList[nsTime.timeMode];
    };



    nsTime.onSetupLoaded.push(function(){
        //Create TimeModeData for all avaiable time-modes in timeModeDataList
        nsTime.timeOptions.timeModeList.forEach( mode => {
            timeModeDataList[mode] = new nsTime.TimeModeData( mode );
        });
    });


    nsTime.TimeModeData = function( mode ){
        this.mode = mode;

        var to  = nsTime.timeOptions,
            tmo = to.timeModeOptions;
        this.data = {
            min       : tmo[mode].min,
            max       : tmo[mode].max,
            globalMin : to.min,
            globalMax : to.max,
            start     : tmo[mode].start,
            end       : tmo[mode].end,

            currentRelative: 0,
            currentMoment  : nsTime.nowMoment.clone()
        };
        this.isRelative = nsTime.timeModeIsRelative(mode);
        this.isFixed = !this.isRelative;

        //MANGLER
        this.isInterval = (mode == nsTime.tmAnimation);

        this.tsList = [];

        //Update time-sliders at global events
        var eventFunc = this.redrawTimeSlider.bind(this);
        ns.events.on(ns.events.LANGUAGECHANGED, eventFunc);
        if (this.isFixed)
            ns.events.on(ns.events.DATETIMEFORMATCHANGED, eventFunc);

        ns.events.on( ns.events.TIMEMODECHANGED, this.onTimeModeChanged.bind(this) );

        ns.events.on( ns.events.CREATEAPPLICATIONFINALLY, this.onCreateApplicationFinally.bind(this) );

        //Add the time-mode data to application-settings
        ns.appSetting.add({
            id          : 'time_'+mode,
            callApply   : true,
            applyFunc   : this.apply.bind(this),
            defaultValue: {currentRelative: 0}
        });
    };

    nsTime.TimeModeData.prototype = {

        /********************************************************
        apply
        ********************************************************/
        apply: function( data ){
            if (this.applyCalledOnce)
                return;

            //If this mode is fixed and now and a fixed moment is saved => Use this moment, but
            //if it was saved more than two hours ago the new moment can not be in the past
            if (this.isFixed && data.currentMomentISO){
                this.data.currentMoment = moment(data.currentMomentISO);

                if (data.nowMomentISO){
                    var saveAtNowMoment = moment(data.nowMomentISO),
                        savedAtHoursAgo = moment().diff(saveAtNowMoment, unit);

                    //If the saved moment was save more than two hours ago and it now is in the past => set current time = now
                    if ((savedAtHoursAgo >= 2) && (this.data.currentMoment.isBefore(nsTime.nowMoment)))
                        this.data.currentMoment = nsTime.nowMoment.clone();
                }
            }

            //Set currentMoment after currentRelative or currentRelative after currentMoment depending on this.isRelative
            if (this.isRelative){
                this.data.currentRelative = data.currentRelative;
                this.data.currentMoment = moment(nsTime.nowMoment).add(this.data.currentRelative, unit);
            }
            else
                this.data.currentRelative = this.data.currentMoment.diff(nsTime.nowMoment, unit);

            this.applyCalledOnce = true;
        },

        /********************************************************
        save
        ********************************************************/
        save: function(){
            //console.log('>>>>>>>>>> SAVE', this.mode, this.data.currentRelative );
            var data = {
                    currentRelative: this.data.currentRelative
                };
            if (this.isFixed){
                data.nowMomentISO = moment().format();
                if (this.data.currentMoment)
                    data.currentMomentISO = this.data.currentMoment.format();
            }

            if (this.isInterval){
                data.start = this.data.start;
                data.end   = this.data.end;
            }

            ns.appSetting.set('time_'+this.mode, data);
            ns.appSetting.save();
        },

        /********************************************************
        set
        ********************************************************/
        set: function( relative, redrawTimeSlider  ){
            if (this.updatingTimeSliders || !nsTime.ready)
                return;

            //console.log('>>>>>>>>>>> SET', this.mode, relative );

            this.data.currentRelative = relative;
            this.adjust();

            this.data.currentMoment = moment(nsTime.nowMoment).add(this.data.currentRelative, unit);

            if (!nsTime.ready)
                return;

            this.save();

            if (this.mode == nsTime.timeMode){
                this.updateBottomMenuElements(redrawTimeSlider);

                //Update current time on all maps
                nsMap.callAllMaps('_updateTime');
            }

        },

        /********************************************************
        setDelta
        ********************************************************/
        setDelta: function( delta ){
            this.set( this.data.currentRelative + delta );
        },

        /********************************************************
        adjust
        ********************************************************/
        adjust: function(){
            this.data.currentRelative = window.roundToRange(this.data.currentRelative, this.data.min, this.data.max);
        },

        /********************************************************
        updateBottomMenuElements
        ********************************************************/
        updateBottomMenuElements: function(redrawTimeSlider){
            var currentRelative = this.data.currentRelative,
                $container = nsMap.main.bottomMenu.$container;

            //Update elements in bottom-menu with current time and current relative
            $container.find('.is-current-moment').vfValue(this.data.currentMoment);

            //Releative time needs to be relative to 'true now' = moment()
            $container.find('.is-current-relative').vfValue( moment().add(currentRelative, unit) );

            //Enable/disable forward and backward buttons
            var isFirst = currentRelative == this.data.min,
                isLast  = currentRelative == this.data.max;

            $container.find('.btn-time-step-backward').toggleClass('disabled', isFirst);
            $container.find('.btn-time-step-forward').toggleClass('disabled', isLast);

            //Update style etc. for all elementSets
            nsTime.bottomMenu_onCurrentRelativeChanged(currentRelative);

            //Update value for buttons with time-slider
            nsTime.updateSliderButtons(currentRelative);

            if (redrawTimeSlider)
                this.redrawTimeSlider();

            this.updateTimeSlider();

        },

        /********************************************************
        updateTimeSlider
        ********************************************************/
        updateTimeSlider: function(){
            this.updatingTimeSliders = true;
            this.tsList.forEach(timeSlider => {
                if (this.isInterval){
                    //MANGLER: Hvis det er en timeSlider med start - end skal en anden metode end setValue bruges
                }
                else
                    timeSlider.setValue( this.data.currentRelative );
            }, this);
            this.updatingTimeSliders = false;
        },

        /********************************************************
        redrawTimeSlider
        ********************************************************/
        redrawTimeSlider: function(){
            this.tsList.forEach(timeSlider => {
                timeSlider.setFormat();
            });
        },

        /********************************************************
        onNowChanged
        ********************************************************/
        onNowChanged: function(){
            var newCurrentRelative = this.data.currentRelative;

            //Called when now changed: Check if fixed modes still are inside the range
            if (this.isFixed)
                newCurrentRelative = Math.max( this.data.currentMoment.diff(nsTime.nowMoment, unit), this.data.min );

            /* eslint-disable no-console */
            if (window.FCOOMAPSTIME_TEST_NOW)
                console.log('Relative for '+this.mode+' change from '+ this.data.currentRelative+' to '+newCurrentRelative);
            /* eslint-enable no-console */

            this.data.currentRelative = newCurrentRelative;

            this.onTimeModeChanged();
        },

        /********************************************************
        onTimeModeChanged
        ********************************************************/
        onTimeModeChanged: function(){
            this.set(this.data.currentRelative, true);
        },

        /********************************************************
        onCreateApplicationFinally
        ********************************************************/
        onCreateApplicationFinally: function(){
            //Make ref to all time-sliders with same time-mode
            this.tsList = [];
            nsTime.tsList.forEach(timeSlider => {
                if (timeSlider.options.timeMode == this.mode){
                    this.tsList.push( timeSlider );
                    timeSlider.setFormat();
                }
            }, this);

            this.set(this.data.currentRelative );
        }
    }; //end of nsTime.TimeModeData.prototype


    /******************************************************************
    When the site is fully created:
    - Set up intervals to update nsTime.nowMoment
    - Update current time-mode-data and all elements
    ******************************************************************/
    function setNowMoment( dummy, now ){
        nsTime.nowMoment = (now ? now : moment()).startOf(unit);
        $.each( timeModeDataList, function(id, timeModeData){
            timeModeData.onNowChanged();
        });

        //Update range etc. on all maps
        nsMap.callAllMaps('_updateNow');

    }

    nsMap.addFinallyEvent(function(){

        nsTime.ready = true;

        //***** TEST *****
        if (window.FCOOMAPSTIME_TEST_NOW){
            //TEST: now is 'moved' 1 hour every 10 seconds
            var testNow = moment().startOf(unit);
            var intervals = new window.Intervals({durationUnit: 'seconds'});
            intervals.addInterval({
                duration: 10,
                data    : {},
                resolve : function(){
                    testNow.add(1, unit);
                    /* eslint-disable no-console */
                    console.log('Now = ', testNow.toString());
                    /* eslint-enable no-console */
                    setNowMoment( {}, testNow);
                }
            });
            window.__jbs_getNowMoment = function(){ return moment(testNow); };
        }
        //***** TEST END *****
        else
            window.intervals.addInterval({
                duration: moment.duration(1, unit).asMinutes(),
                data    : {},
                resolve : setNowMoment
            });
    });

}(jQuery, L, window.moment, window.i18next, this, document));
;
/****************************************************************************
bsButtonTimeSlider.js

Methods to add mini time-slider to a button incl swiping and panning
****************************************************************************/
(function ($, L, moment, i18next, window/*, document, undefined*/) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};


    var margin = 3; //Left and right margin in slider (%)

    function getPercent( currentRelative, timeMode = nsTime.timeMode ){
        var tmOptions = nsTime.timeOptions.timeModeOptions[timeMode];
        return margin + (100 - 2*margin) * (currentRelative - tmOptions.min) / (tmOptions.max - tmOptions.min);
    }

    var panStartedAtPx,
        panStartedAtRelative,
        hourPrPx;

    function onPan( event ){
        var $target;
        switch (event.type){
            case 'swipeleft'  :
                nsTime.getCurrentTimeModeData().setDelta( -1 );
                break;

            case 'swiperight' :
                nsTime.getCurrentTimeModeData().setDelta( +1 );
                break;

            case 'panstart'   :
                $target = $(event.target);

                $target.addClass('slide-button-panning');

                panStartedAtPx = event.gesture.deltaX;

                hourPrPx = $target.data('range') / $target.width();

                panStartedAtRelative = nsTime.getCurrentTimeModeData().data.currentRelative;

                break;

            case 'panmove'  :
                var newRelative = Math.round( panStartedAtRelative + (event.gesture.deltaX - panStartedAtPx) * hourPrPx );
                nsTime.getCurrentTimeModeData().set(newRelative);
                break;

            case 'panend'   :
            case 'pancancel':
                $(event.target).removeClass('slide-button-panning');
                break;
        }
    }


    nsTime.createSliderButton = function( timeMode, $elem ){
        //Calculate the relative size 'the past' and 'the furture' from the min and max for the mode
        $elem
            .addClass('slider-button fa-sort-up')
            .css('background',
                    'linear-gradient(to right, '+
                        nsTime.pastColor+' '+ getPercent(0, timeMode)+'%, '+
                        nsTime.futureColor+' 0%) '+
                    'no-repeat bottom right');

        if (window.bsIsTouch){
            //Add pan and sswipe events to the button

            //Save the relative range for the button
            var tmOptions = nsTime.timeOptions.timeModeOptions[timeMode];
            $elem.data('range', tmOptions.max - tmOptions.min);

            //Add Hammer to the button
            $elem.hammer();
            $elem.on('panstart panmove panend pancancel swipeleft swiperight', onPan);
        }
    };

    nsTime.updateSliderButtons = function( currentRelative ){
        document.documentElement.style.setProperty('--slider-button-left', getPercent(currentRelative)+'%');
    };

}(jQuery, L, window.moment, window.i18next, this, document));





;
/****************************************************************************
L.Map
****************************************************************************/
(function ($, L, moment, i18next, window/*, document, undefined*/) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {},
        unit      = nsTime.unit;


    nsTime.onSetupLoaded.push( function(){
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

/*
        //Add button to open button menu - only visible when single map and bottom menu is closed
        if (false){
            nsMap.mainMapOptions = $.extend(nsMap.mainMapOptions, {
                bsToggleBottomMenuControl: true,
                bsToggleBottomMenuOptions: {class:'MANGLER'}
            });
        }
*/

        //***** TEST *****
        if (window.FCOOMAPSTIME_TEST){
            nsMap.mainMapOptions.timeDimensionControl = true;
            nsMap.mainMapOptions.timeDimensionControlOptions = {
                position    : 'topleft',
                loopButton  : true,
                //limitSliders: true
            };
            nsMap.secondaryMapOptions.timeDimensionControl = true;
            nsMap.secondaryMapOptions.timeDimensionControlOptions = {
                position    : 'topleft',
                loopButton  : false
            };
        }
        //***** TEST END *****

        //Create options for L.timeDimension.layer.wms
        nsMap.tdLayerWmsOptions = {
            cache        : nsTime.timeOptions.cache,
            cacheBackward: nsTime.timeOptions.cacheBackward,
            cacheForward : nsTime.timeOptions.cacheForward
        };


        //Create and add content and options for map-setting. See src/map-setting-group
        if (nsMap.setupOptions.multiMaps.enabled && nsTime.timeOptions.allowDifferentTime)
            nsTime.create_MapSettingGroup_content();

        var bsTimeInfoControlPosition = "bottomcenter";

        //MANGLER - Check hvor mange forskellige time-sync-modes, der er tilladt. Ryd ikke-tilladte fra nsTime.timeSyncInfo

        //Add bsTimeInfoControl to default map-settings
        nsMap.mainMapOptions.bsTimeInfoControl = true;

        nsMap.mainMapOptions.bsTimeInfoControlOptions = {
            //time-info-control on main map gets extra class = 'hide-for-single-map-and-bottom-menu-open'
            className : L.Control.BsTimeInfoControl.prototype.options.className + ' hide-for-single-map-and-bottom-menu-open',
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
            defaultTimeSyncOptions[id+'Offset'] = 'offset_0';

        });

        $.extend(nsMap.secondaryMapOptions.bsTimeInfoControlOptions, defaultTimeSyncOptions);

        //Add bsTimeInfoControl to mapSettingGroups list of controls
        nsMap.bsControls['bsTimeInfoControl'] = {
            icon: 'far fa-clock',
            text: {da:'Aktuelle tidspunkt', en:'Current time'},
            position: bsTimeInfoControlPosition
        };
    });


    /******************************************************************
    Extend L.Map with method to update options for time-sync
    ******************************************************************/
    L.Map.prototype._setTimeSyncOptions = function( options ){
        if (this.options.isMainMap)
            return;

        var mode = options.mode,
            offset = options[options.mode+'Offset'];

        offset = offset ? parseInt( offset.split('_')[1] ) : 0;

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
    L.Map.prototype._updateNow
    Called when 'now' changes
    ******************************************************************/
    L.Map.prototype._updateNow = function(){
        //set the range of this.timeDimension based on current 'now' and global min and max relative range
        var min   = nsTime.timeOptions.min,
            max   = nsTime.timeOptions.max,
            mom   = moment(nsTime.nowMoment).add(min, unit),
            times = [];

        for (var i=0; i<=max-min; i++){
            times.push( mom.toDate().getTime() );
            mom.add(1, unit);
        }
        this.timeDimension.setAvailableTimes(times, 'replace');

        this._updateTime();
    };

    /******************************************************************
    L.Map.prototype._updateTime
    ******************************************************************/
    L.Map.prototype._updateTime = function(){
        if (!this.isVisibleInMultiMaps || !nsTime.ready)
            return this;

        var timeData = nsTime.getCurrentTimeModeData().data;

        //Create own copy of current
        if (this.options.isMainMap)
            this.time = {
                now     : nsTime.nowMoment,
                current : moment(timeData.currentMoment),
                relative: timeData.currentRelative
            };
        else {
            //Adjust for time-offset in sync with main map or now
            var isTsMain = this.timeSync.mode == nsTime.tsMain,
                offset = this.timeSync.offset;
            this.time = {
                now     : nsTime.nowMoment,
                current : isTsMain ? moment(timeData.currentMoment) : moment(nsTime.nowMoment),
                relative: isTsMain ? timeData.currentRelative : 0
            };
            this.time.current.add(offset, nsTime.unit);
            this.time.relative += offset;
        }

        var newTimeAsString =
                this.time.now.toISOString() + '_' +
                this.time.current.toISOString() + '_' +
                this.time.relative;

        if (this.timeAsString == newTimeAsString)
            return this;

        this.timeAsString = newTimeAsString;

        //Update bsTimeInfoControl
        if (this.bsTimeInfoControl)
            this.bsTimeInfoControl.$currentTime.vfValue(this.time.current);

//**************************************************
//MANGLER Skal også opdaterer timeDimension!!!!!
//**************************************************
//console.log(this.timeDimension);
        this.timeDimension.setCurrentTime(this.time.current.toDate().getTime());



        //Call events - MANGLER: SKAL MÅSKE FJERNES....
        this.fire("momentchanged", this.time);
        this.fire("datetimechange", {datetime: this.time.current.toISOString()});

        return this;
    };





}(jQuery, L, window.moment, window.i18next, this, document));





;
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
        if (options.vfFormat){
            $result.vfFormat(options.vfFormat);
            options.vfOptions = options.vfOptions || {};
            options.vfOptions.capitalizeFirstLetter = true;
        }
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
        vfFormat : 'datetime_format',
        vfOptions: {
            dateFormat: {weekday: 'Short',  month: 'Short',  year: 'None' }
        },
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
        vfFormat : 'datetime_format_utc',
        vfOptions: {
            dateFormat: {weekday: 'Short',  month: 'Short',  year: 'None' }
        },
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

;
/***********************************************************************************
bottom-menu-elements-timeSlider.js

Create the content for bottom-menu with different versions of time-slider

Both are TimeSlider (see jquery-time-slider)
There are created as-is - not as prototype

*************************************************************************************/
(function ($, moment, i18next, window, document/*, undefined*/) {

    "use strict";

    //Create namespaces
    var ns      = window.fcoo = window.fcoo || {},
        nsMap   = ns.map = ns.map || {},
        nsTime  = nsMap.time = nsMap.time || {},
        nsColor = ns.color = ns.color || {};


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
    nsTime.pastColor        = 'var(--fc-time-past-color)';
    nsTime.pastColorValue   = getColorValue('fc-time-past-color');

    nsTime.nowColor         = 'var(--fc-time-now-color)';
    nsTime.nowColorValue    = getColorValue('fc-time-now-color');

    nsTime.futureColor      = 'var(--fc-time-future-color)';
    nsTime.futureColorValue = getColorValue('fc-time-future-color');

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

        //Major ticks and labels, minor ticks, utc scale, and relative scale get same color = black
        majorColor: '#000000',
        minorColor: '#000000',

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
            color          : nsColor.chromaBestContrast(nsTime.nowColorValue)
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

                //If it is a button with slider features create it
                if (elemOptions.slider)
                    nsTime.createSliderButton(elemOptions.slider, $newElem);



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
                nsTime.bottomMenuSizeList.forEach( function( bms ){
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
            let bms              = nsTime.bottomMenuSizeList[ ns.appSetting.get('bottom-menu-size') ],
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
        onCurrentRelativeChanged: function( currentRelative = 0 ){
            this.$container
                .toggleClass('time-is-past',   currentRelative < 0)
                .toggleClass('time-is-now',    currentRelative == 0)
                .toggleClass('time-is-future', currentRelative > 0);
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
        elementSetList.forEach( elementSet => {
            elementSet.update();
        });
    };


    /**************************************************************************
    nsTime.bottomMenu_onCurrentRelativeChanged( currentRelative )
    Calls onCurrentRelativeChanged for all elementSets in elementSetList
    onCurrentRelativeChanged change different class-names etc for the elements
    depending on the value of relative
    **************************************************************************/
    nsTime.bottomMenu_onCurrentRelativeChanged = function( currentRelative ){
        elementSetList.forEach( elementSet => {
            elementSet.onCurrentRelativeChanged( currentRelative );
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
    createBottomMenu( $container )
    ***************************************************************************
    **************************************************************************/
    function createBottomMenu( $container ){
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
    var sizeList = [];
    nsTime.bottomMenuSizeList.forEach( (size) => { sizeList.push('bottom-menu-'+size); });

    nsMap.BOTTOM_MENU = {
        height          : 'auto',
        sizeList        : sizeList,
        onSetSize       : nsTime.bottomMenu_onResize,
        standardHandler : true,
        isOpen          : true,
        createContent   : createBottomMenu
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

            //Header - MANGLER
/*
            options.popupList.push({
                icon: 'far fa-clock',
                text: 'MANGLER'
            });
*/
            if (window.bsIsTouch){
                options.popupList.push({
                    type        : 'button',
                    icon        : 'far fa-ruler-horizontal fa-flip-vertical',
                    text        : {da: 'Vis tidsvælger', en: 'Show time-selector'},
                    class       : 'hide-for-bottom-menu-open',
                    onClick     : function(){ nsMap.main.bottomMenu.open(); },
                    closeOnClick: true,
                    lineAfter   : true
                });
                options.popupList.push({
                    type        : 'button',
                    icon        : [['far fa-ruler-horizontal fa-flip-vertical', 'far fa-slash']],
                    text        : {da: 'Skjul tidsvælger', en: 'Hide time selector'},
                    class       : 'show-for-bottom-menu-open',
                    onClick     : function(){ nsMap.main.bottomMenu.close(); },
                    closeOnClick: true,
                    lineAfter   : true
                });
            }

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
            ['TIMEZONECHANGED','DATETIMEFORMATCHANGED'].forEach( id => {
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




