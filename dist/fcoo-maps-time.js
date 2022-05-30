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

;
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
//HER        unit      = 'hour',
        unit      = 'minute',

        timeReady       = false,    //Wait for creating the application before the maps time are set
        forceTimeUpdate = false;    //if true the set-function forces updating all time element, maps etc.





    var defaultTimeOptions = {
            timeModeList : 'SCALE,RELATIVE',


            allowDifferentTime: true, //If true the different maps can have differnet time - relative to the main map eq. +2h - Only used if fcoo/fcoo-maps-time is used

            step         : 1,   //Step in time-selector/slider. Using "unit"
            min          : -24, //Minimum relative time in "unit".
            max          : +48, //Maximum relative time in "unit".

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
            $.isArray(nsTime.timeOptions.timeModeList) ?
                nsTime.timeOptions.timeModeList :
                nsTime.timeOptions.timeModeList.split(',');

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

//TEST
nsMap.mainMapOptions.timeDimensionControl = false;
nsMap.mainMapOptions.timeDimensionControlOptions = {
    loopButton:true,
    //limitSliders: true
};
//TEST SLUT

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
            icon: 'fa-clock',
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
    });

    /***************************************
    set(newNow, newCurrent, newRelative)
    When one of nsTime.nowMoment, nsTime.currentMoment, or nsTime.currentRelative is changed one of the two other variable is calculated
    Witch one that is recalculated dependes on nsTime.timeMode is relative or absolute mode
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
    nsTime.setNowMoment = function()                          { set( moment().startOf(unit), false,            false             /*, 'setNowMoment'*/       ); };
    nsTime.setCurrentMoment = function( newCurrentMoment )    { set( false,                  newCurrentMoment, false             /*, 'setCurrentMoment'*/   ); };
    nsTime.setCurrentRelative = function( newCurrentRelative ){ set( false,                  false,            newCurrentRelative/*, 'setCurrentRelative'*/ ); };

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
    nsTime.tmAnimation = 'ABSOLUTE';

    nsTime.timeMode = nsTime.tmScale;

    var timeModeInfo = {}; //{TIMEMODE}{relative, name, description}

    timeModeInfo[nsTime.tmScale] = {
        name: {
            da: '(?) Fast tidspunkt',
            en: '(?) Fixed time'
        },
        description: {
            da: 'Vælg et tidspunkt vha. skalaen eller frem- og tilbage-knapperne',
            en: '(?) Select time on the scale or forward- and backward-buttons'
        }
    };
    timeModeInfo[nsTime.tmRelative] = {
        relative: true,
        name: {
            da: 'Relativt til aktuelle klokkeslet',
            en: 'Relative to current time'
        },
        description: {
            da: 'Vælg tidspunkt relativt til nuværende/aktuelle klokkeslet, f.eks. "Nu plus 2 timer".<br>Tidspunktet opdateres automatisk, når aktuelle tidspunkt ændre sig.',
            en: '(?) ENG af: Vælg tidspunkt relativt til nuværende/aktuelle klokkeslet, f.eks. "Nu plus 2 timer".<br>Tidspunktet opdateres automatisk, når aktuelle tidspunkt ændre sig.',
        }
    };
    timeModeInfo[nsTime.tmSelect] = {
        name: {
            da: '(?) SELECT',
            en: '(?) SELECT'
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

            ns.events.fire('TIMEMODECHANGED', timeMode);
        },
        defaultValue: nsTime.tmScale
    });

    function timeModeIsRelative(){
        return timeModeInfo[nsTime.timeMode].relative;
    }

    /***************************************
    selectTimeMode - Modal-form with info and select of time-mode
    ***************************************/
    nsTime.selectTimeMode = function(){
        var list = [],
            info = [i18next.sentence({
                da: 'Hvordan tidspunktet for hovedkortet vælges:',
                en: 'How the time for the main map is set:'
            })];

        $.each(timeModeInfo, function(id, timeMode){
            if (nsTime.timeOptions.timeModeList.includes(id)){
                info.push('<br><em><strong>' + i18next.sentence(timeMode.name) + '</strong></em><br>' + i18next.sentence(timeMode.description) );
                list.push({id: id, text: timeMode.name});
            }
        });

        $.bsModalForm({
//            show    : false,
            header  : {icon:'fa-clock', text: {da:'(?) Valg af tid i hovedkortet', en:'(?) Selection of Time in Main Map'}},
            content : [{
                type    : 'inputgroup',
                label   : {da: '(?) Hvordan skal der vælges tidspunkt', en:'(?) ENG: Hvordan skal der vælges tidspunkt'}, //TODO: Skal der være label overhoved
                content : {id: 'timeMode', type: 'selectlist', list: list, lineAfter: true }
            },{
                label   : {da: 'Vejledning', en:'Guidance'}, type: 'text', text: info.join('<br>')
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
    "at this time" or "at the present moment"
    */
    nsTime.tsMain = 'MAIN';
    nsTime.tsNow  = 'NOW';


    //nsTime.timeSyncInfo = {TIMESYNC}{name, description, relativePrefix_List, relativePrefix_Ctrl}
    /*
    MANGLER/TODO:
    I create_MapSettingGroup_content kan man vælge relative-time-mode via
    1: select, eller
    2: select-list
    */
    nsTime.timeSyncInfo = {};
    nsTime.timeSyncInfo[nsTime.tsMain] = {
        name: {
            //1: select
            da: 'Hovedkortet',
            en: 'Main map'

            //2: select-list
            //da: 'Samme som hovedkortet',
            //en: 'Same as main map'
        },
        description: {
            da: '',
            en: ''
        },
        zeroOffset         : {da:'Samme som hovedkortet', en:'Same as main map'},
        relativePrefix_List: {da: 'Hovedkort', en: 'Main map'}, //Prefix in list of offset in Setting
        relativePrefix_Ctrl: {da: '', en: ''},                  //Prefix for offset in bsTimeInfoControl

        iconColor      : ['icon-active', '', 'icon-active']
    };

    nsTime.timeSyncInfo[nsTime.tsNow] = {
        name: {
            da: 'Nuværende tidspunkt (Nu)',
            en: 'Present moment (Now)'
        },
        description: {
            da: '',
            en: ''
        },
        zeroOffset         : {da: 'Nu', en: 'Now'},
        relativePrefix_List: {da: 'Nu', en: 'Now'},     //Prefix in list of offset in Setting
        relativePrefix_Ctrl: {da: 'Nu', en: 'Now'},   //Prefix for offset in bsTimeInfoControl

//        iconColor      : ['icon-time-past', 'icon-time-now', 'icon-time-future'],
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
        icon       : 'fa-clock',
        text       : {da:'(?) Relativ tid', en:'(?) Relative time'},
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
                //1: As select
                modalContent = [],

                //2: As select-list
                //modalContent = [{text: '<br>'}],

                list         = [],
                idList       = ['mode'];

            $.each(nsTime.timeSyncInfo, function(id, options){
                list.push({
                    id  : id,
                    icon: 'fa-clock ' + nsTime.getIconClass(id, 0),
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
                        icon: 'fa-clock ' + nsTime.getIconClass(id, offset),
                        text: text
                    });
                });
                idList.push(id+'Offset');

                modalContent.push({
                    id   : id+'Offset',
                    label: {da:'Forskydning (plus/minus antal timer)', en:'Shift (plus/minus number of hours)'},
                    type : 'select',
                    items: timeItems,

                    showWhen: {'bsTimeInfoControl_mode': id},
                    freeSpaceWhenHidden: true
                });
            });

            modalContent.unshift({
                id   : 'mode',
                //1: As select
                label: {da: '(?) Vis tid relativt til', en: '(?) Show time relative to'},
                type : 'select', items: list,

                //2: As select-list
                //type : 'selectlist', list : list
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

        if (this.timeAsString == newTimeAsString)
            return this;

        this.timeAsString = newTimeAsString;

        //Update bsTimeInfoControl
        if (this.bsTimeInfoControl)
            this.bsTimeInfoControl.$currentTime.vfValue(this.time.current);

        //Call events
        this.fire("momentchanged", this.time);
        this.fire("datetimechange", {datetime: this.time.current.toISOString()});

        return this;
    };





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




