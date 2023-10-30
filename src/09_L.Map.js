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

        //Add button to open button menu - only visible when single map and bottom menu is closed
        if (false){
            nsMap.mainMapOptions = $.extend(nsMap.mainMapOptions, {
                bsToggleBottomMenuControl: true,
                bsToggleBottomMenuOptions: {class:'MANGLER'}
            });
        }


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




